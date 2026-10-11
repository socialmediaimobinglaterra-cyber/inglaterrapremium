import type { NavDropdownItem } from "@/components/layout/HeaderClient";
import { sanity } from "@/lib/sanity";
import type { ImovelSearchResult } from "@/lib/queries/imoveis";
import { imageUrlOrFallback, normalizeImageUrl } from "@/lib/images";
import { condominioSecaoAtiva, type ItemCatalogo } from "@/lib/condominio-secao";
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
  address: string | null;
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
  _id, nome, "slug": slugPublico.current,
  "bairro": coalesce(neighborhood, bairro), "cidade": coalesce(city, cidade), "estado": coalesce(state, estado),
  logradouro, numero, address, latitude, longitude,
  unidades, areaTotalTexto, seguranca,
  "descricaoPublica": coalesce(description, descricaoPublica), descricaoPublica2, diferenciais,
  "imagensUrls": array::compact(coalesce(images, imagens)[].asset->url),
  "imagensImoveis": *[_type == "property" && condominioRef._ref == ^._id && ${CONDOMINIO_PROPERTY_FILTER}
    && defined(mainImage.asset->url)] | order(coalesce(price, rentPrice) desc, _id asc)[0...3].mainImage.asset->url,
  "imoveisCount": count(*[_type == "property" && condominioRef._ref == ^._id && ${CONDOMINIO_PROPERTY_FILTER}])
`;

function mapCondominio(row: SanityCondominioRow): CondominioDetail {
  const galeria = (row.imagensUrls ?? [])
    .filter((url): url is string => Boolean(url))
    .map((url, index) => ({ url, alt: `${row.nome} - foto ${index + 1}`, principal: index === 0 }));

  const endereco = row.logradouro
    ? [row.logradouro, row.numero].filter(Boolean).join(", ") || null
    : row.address || null;

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

export async function getCondominioImoveis(condominio: CondominioDetail, limit = condominioSecaoAtiva() ? 24 : 3) {
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

// ───────────────────────────────────────────────────────────────────────────
// Seção "O condomínio" (contrato do CRM: ver lib/condominio-secao.ts).
// Só é usada com CONDOMINIO_SECAO=on.
// O CRM grava o documento INTEIRO a cada atualização e usa nomes novos
// (images, city, neighborhood, address...), enquanto os documentos de hoje usam
// os antigos (imagens, cidade, bairro, logradouro...). As consultas leem os dois.
// ───────────────────────────────────────────────────────────────────────────

export type Tipologia = {
  key: string;
  nome: string;
  area: number | null;
  dormitorios: number | null;
  suites: number | null;
  vagas: number | null;
};

export type FichaTecnica = {
  construtora: string | null;
  arquitetura: string | null;
  torres: number | null;
  andares: number | null;
  elevadores: number | null;
  totalUnidades: number | null;
  unidadesPorAndar: number | null;
  totalVagas: number | null;
  areaTerreno: number | null;
  areaConstruida: number | null;
  previsaoEntrega: string | null;
  tipologias: Tipologia[];
};

export type Planta = {
  key: string;
  nome: string;
  tipologiaKey: string | null;
  imagemUrl: string | null;
  arquivoUrl: string | null;
};

export type CondominioCompleto = {
  id: string;
  nome: string;
  /** Página pública do condomínio. Null quando ele não tem página (só os premium aprovados têm). */
  href: string | null;
  descricao: string | null;
  endereco: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  fotos: Array<{ url: string; alt: string }>;
  comodidades: string[];
  ficha: FichaTecnica | null;
  bookUrl: string | null;
  bookNome: string | null;
  plantas: Planta[];
};

const CONDOMINIO_COMPLETO_PROJECTION = `
  _id, nome,
  "descricao": coalesce(description, descricaoPublica),
  address, addressNumber, addressComplement, logradouro, numero,
  "bairro": coalesce(neighborhood, bairro), "cidade": coalesce(city, cidade), "estado": coalesce(state, estado), cep,
  "fotos": coalesce(images, imagens)[defined(asset)]{ "url": asset->url, "alt": coalesce(alt, legenda, caption) },
  amenitiesCondominio,
  fichaTecnica {
    construtora, arquitetura, torres, andares, elevadores, totalUnidades, unidadesPorAndar, totalVagas,
    areaTerreno, areaConstruida, previsaoEntrega,
    "tipologias": tipologias[]{ _key, nome, area, dormitorios, suites, vagas }
  },
  "bookUrl": book.asset->url, bookNome,
  "plantas": plantas[]{ _key, nome, tipologiaKey, "imagemUrl": imagem.asset->url, "arquivoUrl": arquivo.asset->url }
`;

function textoOuNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapCondominioCompleto(row: Record<string, any>, href: string | null): CondominioCompleto {
  const ficha = row.fichaTecnica as Record<string, any> | null;
  const enderecoRua = textoOuNull(row.logradouro)
    ? [textoOuNull(row.logradouro), textoOuNull(row.numero)].filter(Boolean).join(", ")
    : textoOuNull(row.address);
  const cep = String(row.cep ?? "").replace(/\D/g, "");

  return {
    id: row._id,
    nome: row.nome,
    href,
    descricao: textoOuNull(row.descricao),
    endereco: enderecoRua,
    complemento: textoOuNull(row.addressComplement),
    bairro: textoOuNull(row.bairro),
    cidade: textoOuNull(row.cidade),
    estado: textoOuNull(row.estado),
    cep: cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : null,
    fotos: ((row.fotos ?? []) as Array<{ url?: string | null; alt?: string | null }>)
      .filter((foto) => Boolean(foto?.url))
      .map((foto, index) => ({
        url: normalizeImageUrl(foto.url)!,
        alt: textoOuNull(foto.alt) ?? `${row.nome} - foto ${index + 1}`,
      })),
    comodidades: ((row.amenitiesCondominio ?? []) as unknown[]).filter((v): v is string => typeof v === "string" && v.length > 0),
    ficha: ficha
      ? {
          construtora: textoOuNull(ficha.construtora),
          arquitetura: textoOuNull(ficha.arquitetura),
          torres: numberOrNull(ficha.torres),
          andares: numberOrNull(ficha.andares),
          elevadores: numberOrNull(ficha.elevadores),
          totalUnidades: numberOrNull(ficha.totalUnidades),
          unidadesPorAndar: numberOrNull(ficha.unidadesPorAndar),
          totalVagas: numberOrNull(ficha.totalVagas),
          areaTerreno: numberOrNull(ficha.areaTerreno),
          areaConstruida: numberOrNull(ficha.areaConstruida),
          previsaoEntrega: textoOuNull(ficha.previsaoEntrega),
          tipologias: ((ficha.tipologias ?? []) as Array<Record<string, any>>)
            .filter((t) => t?._key && textoOuNull(t.nome))
            .map((t) => ({
              key: t._key,
              nome: t.nome,
              area: numberOrNull(t.area),
              dormitorios: numberOrNull(t.dormitorios),
              suites: numberOrNull(t.suites),
              vagas: numberOrNull(t.vagas),
            })),
        }
      : null,
    bookUrl: textoOuNull(row.bookUrl),
    bookNome: textoOuNull(row.bookNome),
    plantas: ((row.plantas ?? []) as Array<Record<string, any>>)
      .filter((p) => p?._key && (p.imagemUrl || p.arquivoUrl))
      .map((p) => ({
        key: p._key,
        nome: textoOuNull(p.nome) ?? "Planta",
        tipologiaKey: textoOuNull(p.tipologiaKey),
        imagemUrl: normalizeImageUrl(p.imagemUrl),
        arquivoUrl: textoOuNull(p.arquivoUrl),
      })),
  };
}

export async function getCondominioCompleto(id: string): Promise<CondominioCompleto | null> {
  const [row, directory] = await Promise.all([
    sanity.fetch<Record<string, any> | null>(
      `*[_type == "condominio" && _id == $id][0] { ${CONDOMINIO_COMPLETO_PROJECTION} }`,
      { id }
    ),
    getCondominioDirectory(),
  ]);
  if (!row) return null;
  // Só os condomínios aprovados (lista premium) têm página; os demais aparecem sem link.
  const slug = directory.find((entry) => entry._id === id)?.slug;
  return mapCondominioCompleto(row, slug ? `/condominios/${slug}` : null);
}

/** Catálogo de comodidades (documento único imovelOptions). A Inglaterra ainda não tem: devolve vazio e o site usa os rótulos embutidos. */
export async function getCatalogoComodidades(): Promise<Map<string, ItemCatalogo>> {
  const itens = await sanity.fetch<Array<ItemCatalogo> | null>(
    `*[_id == "imovelOptions"][0].amenities[]{ value, label, categoria, escopo }`
  );
  return new Map((itens ?? []).filter((i) => i?.value).map((i) => [i.value, i]));
}
