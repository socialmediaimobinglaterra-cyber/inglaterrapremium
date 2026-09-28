import type { NavDropdownItem } from "@/components/layout/HeaderClient";
import { sanity } from "@/lib/sanity";
import type { ImovelSearchResult } from "@/lib/queries/imoveis";
import { imageUrlOrFallback } from "@/lib/images";

export type CondominioResumo = {
  id: string;
  nome: string;
  slug: string;
  bairro: string;
  cidade: string;
  estado: string;
  image: string | null;
};

export type CondominioDetail = CondominioResumo & {
  imoveisCount: number;
  unidades: string | null;
  areaTotal: string | null;
  seguranca: string | null;
  descricao: string | null;
  descricao2: string | null;
  diferenciais: string[];
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  galeria: Array<{ url: string; alt: string; principal: boolean }>;
};

function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type SanityCondominioRow = {
  _id: string;
  nome: string;
  slug: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  logradouro: string | null;
  numero: string | null;
  latitude: number | null;
  longitude: number | null;
  unidades: string | null;
  areaTotalTexto: string | null;
  seguranca: string | null;
  descricaoPublica: string | null;
  descricaoPublica2: string | null;
  diferenciais: string[] | null;
  imagensUrls: (string | null)[] | null;
  imoveisCount: number;
};

const CONDOMINIO_PROJECTION = `
  _id, nome, "slug": slugPublico.current, bairro, cidade, estado,
  logradouro, numero, latitude, longitude,
  unidades, areaTotalTexto, seguranca, descricaoPublica, descricaoPublica2, diferenciais,
  "imagensUrls": imagens[].asset->url,
  "imoveisCount": count(*[_type == "property" && condominioRef._ref == ^._id && status == "ativo" && publicarSite == true])
`;

function mapCondominio(row: SanityCondominioRow): CondominioDetail {
  const galeria = (row.imagensUrls ?? [])
    .filter((url): url is string => Boolean(url))
    .map((url, index) => ({ url, alt: `${row.nome} - foto ${index + 1}`, principal: index === 0 }));

  const endereco = [row.logradouro, row.numero].filter(Boolean).join(", ") || null;

  return {
    id: row._id,
    nome: row.nome,
    slug: row.slug ?? "",
    bairro: row.bairro ?? "Londrina",
    cidade: row.cidade ?? "Londrina",
    estado: row.estado ?? "PR",
    image: galeria[0]?.url ?? null,
    imoveisCount: row.imoveisCount,
    unidades: row.unidades,
    areaTotal: row.areaTotalTexto,
    seguranca: row.seguranca,
    descricao: row.descricaoPublica,
    descricao2: row.descricaoPublica2,
    diferenciais: row.diferenciais ?? [],
    endereco,
    latitude: numberOrNull(row.latitude),
    longitude: numberOrNull(row.longitude),
    galeria,
  };
}

const CONDOMINIO_HAS_PAGE = `defined(slugPublico.current)`;

export async function getHeaderCondominios(): Promise<NavDropdownItem[]> {
  const rows = await sanity.fetch<Array<{ nome: string; slug: string }>>(
    `*[_type == "condominio" && ${CONDOMINIO_HAS_PAGE}] { nome, "slug": slugPublico.current } | order(nome asc)`
  );

  return rows.map((row) => ({
    label: row.nome,
    href: `/condominios/${row.slug}`,
  }));
}

export async function getCondominioBySlug(slug: string) {
  const row = await sanity.fetch<SanityCondominioRow | null>(
    `*[_type == "condominio" && slugPublico.current == $slug][0] { ${CONDOMINIO_PROJECTION} }`,
    { slug }
  );

  return row ? mapCondominio(row) : null;
}

export async function getCondominioImoveis(condominio: CondominioDetail, limit = 3) {
  const rows = await sanity.fetch<Record<string, any>[]>(
    `*[_type == "property" && status == "ativo" && publicarSite == true && condominioRef._ref == $id
      ] | order(coalesce(price, rentPrice) desc) [0...$limit] {
        _id, codigoImovel, "slug": slug.current, title, neighborhood, cidade, type,
        area, areaTotal, suites, bedrooms, garage, price, rentPrice, featured,
        "mainImageUrl": mainImage.asset->url
      }`,
    { id: condominio.id, limit }
  );

  return rows.map((row, index): ImovelSearchResult => ({
    id: String(index + 1).padStart(2, "0"),
    codigo: row.codigoImovel,
    slug: row.slug,
    titulo: row.title,
    bairro: row.neighborhood ?? "Londrina",
    cidade: row.cidade ?? "Londrina",
    tipo: row.type ?? "Imóvel",
    area: numberOrNull(row.area ?? row.areaTotal),
    suites: row.suites,
    dormitorios: row.bedrooms,
    vagas: row.garage,
    precoVenda: numberOrNull(row.price),
    precoLocacao: numberOrNull(row.rentPrice),
    image: imageUrlOrFallback(row.mainImageUrl),
    tag: row.featured ? "EXCLUSIVO" : index === 0 ? "DESTAQUE" : "PREMIUM",
  }));
}

export async function getRelatedCondominios(currentSlug: string, limit = 3) {
  const rows = await sanity.fetch<SanityCondominioRow[]>(
    `*[_type == "condominio" && ${CONDOMINIO_HAS_PAGE} && slugPublico.current != $currentSlug
      ] | order(nome asc) [0...$limit] { ${CONDOMINIO_PROJECTION} }`,
    { currentSlug, limit }
  );

  return rows.map(mapCondominio);
}
