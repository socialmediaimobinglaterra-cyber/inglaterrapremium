import type { NavDropdownItem } from "@/components/layout/HeaderClient";
import { sanity } from "@/lib/sanity";
import type { ImovelSearchResult } from "@/lib/queries/imoveis";
import { imageUrlOrFallback } from "@/lib/images";
import { cache } from "react";
import { CONDOMINIO_PROPERTY_FILTER, publicCondominioDirectory } from "@/lib/premium-condominios";

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
  "imagensUrls": array::compact(imagens[].asset->url),
  "imagensImoveis": *[_type == "property" && condominioRef._ref == ^._id && ${CONDOMINIO_PROPERTY_FILTER}
    && defined(mainImage.asset->url)] | order(coalesce(price, rentPrice) desc, _id asc)[0...3].mainImage.asset->url,
  "imoveisCount": count(*[_type == "property" && condominioRef._ref == ^._id && ${CONDOMINIO_PROPERTY_FILTER}])
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

const getCondominioDirectory = cache(async () =>
  publicCondominioDirectory(await sanity.fetch<Array<{
    _id: string; nome: string; slug: string | null; ativo?: boolean;
  }>>(`*[_type == "condominio"] { _id, nome, ativo, "slug": slugPublico.current }`))
);

export const getPublicCondominios = cache(async (): Promise<CondominioDetail[]> => {
  const directory = await getCondominioDirectory();
  if (!directory.length) return [];
  const rows = await sanity.fetch<Array<SanityCondominioRow & { imagensImoveis: string[] | null }>>(
    `*[_type == "condominio" && _id in $ids] { ${CONDOMINIO_PROJECTION} } | order(nome asc, _id asc)`,
    { ids: directory.map((row) => row._id) }
  );
  const slugs = new Map(directory.map((row) => [row._id, row.slug]));
  return rows.filter((row) => row.imoveisCount > 0 && slugs.has(row._id)).map((row) => mapCondominio({
    ...row, slug: slugs.get(row._id)!,
    imagensUrls: row.imagensUrls?.length ? row.imagensUrls : row.imagensImoveis,
  }));
});

export async function getHeaderCondominios(): Promise<NavDropdownItem[]> {
  const directory = await getCondominioDirectory();
  if (!directory.length) return [];
  // The menu needs links and eligibility, not galleries or editorial descriptions.
  const eligible = await sanity.fetch<Array<{ _id: string; nome: string; cidade: string; bairro: string; imoveisCount: number }>>(
    `*[_type == "condominio" && _id in $ids] { _id, nome, cidade, bairro,
      "imoveisCount": count(*[_type == "property" && condominioRef._ref == ^._id && ${CONDOMINIO_PROPERTY_FILTER}])
    } | order(nome asc, _id asc)`, { ids: directory.map((row) => row._id) }
  );
  const slugs = new Map(directory.map((row) => [row._id, row.slug]));
  const rows = eligible.filter((row) => row.imoveisCount > 0 && slugs.has(row._id));

  return rows.map((row) => ({
    label: rows.filter((item) => item.nome === row.nome).length > 1
      ? `${row.nome} — ${row.cidade}, ${row.bairro}` : row.nome,
    href: `/condominios/${slugs.get(row._id)}`,
  }));
}

export async function getCondominioBySlug(slug: string) {
  return (await getPublicCondominios()).find((row) => row.slug === slug) ?? null;
}

export async function getCondominioImoveis(condominio: CondominioDetail, limit = 3) {
  const rows = await sanity.fetch<Record<string, any>[]>(
    `*[_type == "property" && ${CONDOMINIO_PROPERTY_FILTER} && condominioRef._ref == $id
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
  return (await getPublicCondominios()).filter((row) => row.slug !== currentSlug).slice(0, limit);
}
