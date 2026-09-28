import { sanity } from "@/lib/sanity";
import { imageUrlOrFallback } from "@/lib/images";
import type { ImovelSearchResult } from "@/lib/queries/imoveis";

export type BairroFaq = {
  question: string;
  answer: string;
};

export type BairroDetail = {
  id: string;
  nome: string;
  slug: string;
  cidade: string;
  estado: string;
  imagemCapa: string | null;
  imagemCapaAlinhamento: string;
  imagemHome: string | null;
  imagemHomeAlinhamento: string;
  descricao: string | null;
  faq: BairroFaq[];
  valorMedioVenda: number | null;
  imoveisDisponiveis: number;
  heroImage: string | null;
};

export type BairroSummary = {
  nome: string;
  slug: string;
  cidade: string;
  imoveisDisponiveis: number;
  image: string | null;
  imagePosition: string;
};

function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const ACTIVE_FILTER = `status == "ativo" && publicarSite == true`;

type SanityBairroRow = {
  _id: string;
  nome: string;
  slug: string;
  cidade: string;
  estado: string;
  imagemCapaUrl: string | null;
  imagemHomeUrl: string | null;
  descricao: string | null;
  faq: Array<{ pergunta?: string; resposta?: string }> | null;
};

const BAIRRO_PROJECTION = `
  _id, nome, "slug": slug.current, cidade, estado,
  "imagemCapaUrl": imagemCapa.asset->url, "imagemHomeUrl": imagemHome.asset->url,
  descricao, faq
`;

function mapFaq(value: Array<{ pergunta?: string; resposta?: string }> | null): BairroFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item?.pergunta?.trim() && item?.resposta?.trim())
    .map((item) => ({ question: item.pergunta!.trim(), answer: item.resposta!.trim() }));
}

function mapImovel(row: Record<string, any>, index: number): ImovelSearchResult {
  return {
    id: String(index + 1).padStart(2, "0"),
    codigo: row.codigoImovel,
    slug: row.slug,
    titulo: row.title,
    bairro: row.neighborhood ?? "Londrina",
    cidade: row.cidade ?? "Londrina",
    tipo: row.type ?? "Imovel",
    area: numberOrNull(row.area ?? row.areaTotal),
    suites: row.suites,
    dormitorios: row.bedrooms,
    vagas: row.garage,
    precoVenda: numberOrNull(row.price),
    precoLocacao: numberOrNull(row.rentPrice),
    image: imageUrlOrFallback(row.mainImageUrl),
    tag: row.featured ? "EXCLUSIVO" : index === 0 ? "DESTAQUE" : "PREMIUM",
  };
}

const IMOVEL_ROW_PROJECTION = `
  codigoImovel, "slug": slug.current, title, neighborhood, cidade, type,
  area, areaTotal, suites, bedrooms, garage, price, rentPrice, featured,
  "mainImageUrl": mainImage.asset->url
`;

export async function getBairroPageData(slug: string) {
  const bairroRow = await sanity.fetch<SanityBairroRow | null>(
    `*[_type == "bairro" && slug.current == $slug && ativo == true][0] { ${BAIRRO_PROJECTION} }`,
    { slug }
  );

  if (!bairroRow) return null;

  const [metrics, imoveisRows, outrosRows] = await Promise.all([
    sanity.fetch<{ valorMedioVenda: number | null; imoveisDisponiveis: number }>(
      `{
        "valorMedioVenda": math::avg(*[_type == "property" && ${ACTIVE_FILTER} && neighborhood == $nome && defined(price)].price),
        "imoveisDisponiveis": count(*[_type == "property" && ${ACTIVE_FILTER} && neighborhood == $nome])
      }`,
      { nome: bairroRow.nome }
    ),
    sanity.fetch<Record<string, any>[]>(
      `*[_type == "property" && ${ACTIVE_FILTER} && neighborhood == $nome
        ] | order(coalesce(price, rentPrice) desc) [0...6] { ${IMOVEL_ROW_PROJECTION} }`,
      { nome: bairroRow.nome }
    ),
    sanity.fetch<Array<SanityBairroRow & { imoveisDisponiveis: number }>>(
      `*[_type == "bairro" && ativo == true && slug.current != $slug] {
        ${BAIRRO_PROJECTION},
        "imoveisDisponiveis": count(*[_type == "property" && ${ACTIVE_FILTER} && neighborhood == ^.nome])
      } | order(imoveisDisponiveis desc, nome asc) [0...3]`,
      { slug }
    ),
  ]);

  const bairro: BairroDetail = {
    id: bairroRow._id,
    nome: bairroRow.nome,
    slug: bairroRow.slug,
    cidade: bairroRow.cidade,
    estado: bairroRow.estado,
    imagemCapa: bairroRow.imagemCapaUrl,
    imagemCapaAlinhamento: "center center",
    imagemHome: bairroRow.imagemHomeUrl,
    imagemHomeAlinhamento: "center center",
    descricao: bairroRow.descricao,
    faq: mapFaq(bairroRow.faq),
    valorMedioVenda: numberOrNull(metrics.valorMedioVenda),
    imoveisDisponiveis: metrics.imoveisDisponiveis ?? 0,
    heroImage: bairroRow.imagemCapaUrl,
  };

  const imoveis = imoveisRows.map(mapImovel);
  const outrosBairros: BairroSummary[] = outrosRows.map((row) => ({
    nome: row.nome,
    slug: row.slug,
    cidade: row.cidade,
    imoveisDisponiveis: row.imoveisDisponiveis,
    image: row.imagemHomeUrl ?? row.imagemCapaUrl ?? null,
    imagePosition: "center center",
  }));

  return { bairro, imoveis, outrosBairros };
}
