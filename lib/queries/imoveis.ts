import { sanity } from "@/lib/sanity";
import { imageUrlOrFallback } from "@/lib/images";
import { resolveMapSelection, validMapSelection } from "@/lib/property-map";
import { getPropertyMapData } from "@/lib/queries/property-map";

export type ImovelSearchFilters = {
  mapSelection?: string | null;
  bairro?: string | null;
  condominio?: string | null;
  tipo?: string | null;
  negocio?: "Comprar" | "Alugar" | null;
  valorMinimo?: number | null;
  valorMaximo?: number | null;
  suitesMinimas?: number | null;
  vagasMinimas?: number | null;
  quartosMinimos?: number | null;
  areaMinima?: number | null;
  areaMaxima?: number | null;
  order?: "relevancia" | "maior_valor" | "menor_valor" | "mais_recentes";
};

export type ImovelSearchResult = {
  id: string;
  codigo: string;
  slug: string;
  titulo: string;
  bairro: string;
  cidade: string;
  tipo: string;
  area: number | null;
  suites: number | null;
  dormitorios: number | null;
  vagas: number | null;
  precoVenda: number | null;
  precoLocacao: number | null;
  image: string;
  tag: string;
};

export type ImovelSearchPage = {
  imoveis: ImovelSearchResult[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
};

export type ImovelDetail = {
  id: string;
  codigo: string;
  slug: string;
  titulo: string;
  tipo: string | null;
  finalidade: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  endereco: string | null;
  numero: string | null;
  nomeCondominio: string | null;
  nomeEdificio: string | null;
  precoVenda: number | null;
  precoLocacao: number | null;
  precoCondominio: number | null;
  precoIptu: number | null;
  area: number | null;
  areaTotal: number | null;
  suites: number | null;
  dormitorios: number | null;
  banheiros: number | null;
  vagas: number | null;
  descricao: string | null;
  latitude: number | null;
  longitude: number | null;
  urlKenlo: string | null;
  videoUrl: string | null;
  corretor: {
    nome?: string;
    email?: string;
    telefone?: string;
    celular?: string;
    foto?: string;
  };
  fotos: Array<{
    url: string;
    alt?: string;
    principal: boolean;
  }>;
};

function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// GROQ projection shared by list rows and the detail query: `mainImage`
// resolves to its CDN url directly, `images[]` to an array of urls in
// gallery order (mainImage is NOT repeated inside `images`, same as the
// Sanity property schema).
const IMAGE_PROJECTION = `"mainImageUrl": mainImage.asset->url, "imageUrls": images[].asset->url`;

type SanityImageRow = { mainImageUrl?: string | null; imageUrls?: (string | null)[] | null };

function getMainImage(row: SanityImageRow) {
  return imageUrlOrFallback(row.mainImageUrl ?? row.imageUrls?.[0] ?? null);
}

function mapFotos(row: SanityImageRow) {
  const fotos: Array<{ url: string; alt?: string; principal: boolean }> = [];
  if (row.mainImageUrl) {
    fotos.push({ url: imageUrlOrFallback(row.mainImageUrl), principal: true });
  }
  for (const url of row.imageUrls ?? []) {
    if (url) fotos.push({ url: imageUrlOrFallback(url), principal: false });
  }
  return fotos;
}

export function normalizeSearchFilters(filters: ImovelSearchFilters) {
  return {
    mapSelection: filters.mapSelection == null ? null : validMapSelection(filters.mapSelection) ? filters.mapSelection : "invalid",
    bairro: filters.bairro && filters.bairro !== "Todos os bairros" ? filters.bairro : null,
    condominio: filters.condominio ?? null,
    tipo: filters.tipo && filters.tipo !== "Todos os tipos" ? filters.tipo : null,
    negocio: filters.negocio === "Alugar" ? "Alugar" : "Comprar",
    valorMinimo: numberOrNull(filters.valorMinimo),
    valorMaximo: numberOrNull(filters.valorMaximo),
    suitesMinimas: numberOrNull(filters.suitesMinimas),
    vagasMinimas: numberOrNull(filters.vagasMinimas),
    quartosMinimos: numberOrNull(filters.quartosMinimos),
    areaMinima: numberOrNull(filters.areaMinima),
    areaMaxima: numberOrNull(filters.areaMaxima),
    order: filters.order ?? "relevancia",
  } satisfies ImovelSearchFilters;
}

const ACTIVE_FILTER = `status == "ativo" && publicarSite == true`;

export async function getImoveisFilterOptions() {
  const [bairros, tipos] = await Promise.all([
    sanity.fetch<string[]>(
      `array::unique(*[_type == "property" && ${ACTIVE_FILTER} && defined(neighborhood)].neighborhood) | order(@ asc)`
    ),
    sanity.fetch<string[]>(
      `array::unique(*[_type == "property" && ${ACTIVE_FILTER} && defined(type)].type) | order(@ asc)`
    ),
  ]);

  return { bairros, tipos };
}

async function buildSearchQuery(rawFilters: ImovelSearchFilters) {
  const filters = normalizeSearchFilters(rawFilters);
  const params: Record<string, unknown> = {};
  const where = [`_type == "property"`, ACTIVE_FILTER];

  if (filters.mapSelection) {
    const ids = validMapSelection(filters.mapSelection)
      ? resolveMapSelection(await getPropertyMapData(filters.negocio === "Alugar" ? "Alugar" : "Comprar"), filters.mapSelection)
      : [];
    params.ids = ids;
    where.push(`_id in $ids`);
  }

  const priceField = filters.negocio === "Alugar" ? "rentPrice" : "price";
  where.push(`defined(${priceField})`);

  if (filters.bairro) {
    params.bairro = filters.bairro;
    where.push(`neighborhood == $bairro`);
  }

  if (filters.tipo) {
    params.tipo = filters.tipo;
    where.push(`type == $tipo`);
  }

  if (filters.condominio) {
    params.condominio = filters.condominio;
    where.push(`coalesce(condominioRef->nome, condominioNome) == $condominio`);
  }

  if (filters.valorMinimo !== null && filters.valorMinimo !== undefined) {
    params.valorMinimo = filters.valorMinimo;
    where.push(`${priceField} >= $valorMinimo`);
  }

  if (filters.valorMaximo !== null && filters.valorMaximo !== undefined) {
    params.valorMaximo = filters.valorMaximo;
    where.push(`${priceField} <= $valorMaximo`);
  }

  if (filters.suitesMinimas !== null && filters.suitesMinimas !== undefined) {
    params.suitesMinimas = filters.suitesMinimas;
    where.push(`coalesce(suites, 0) >= $suitesMinimas`);
  }

  if (filters.vagasMinimas !== null && filters.vagasMinimas !== undefined) {
    params.vagasMinimas = filters.vagasMinimas;
    where.push(`coalesce(garage, 0) >= $vagasMinimas`);
  }

  if (filters.quartosMinimos !== null && filters.quartosMinimos !== undefined) {
    params.quartosMinimos = filters.quartosMinimos;
    where.push(`coalesce(bedrooms, 0) >= $quartosMinimos`);
  }

  if (filters.areaMinima !== null && filters.areaMinima !== undefined) {
    params.areaMinima = filters.areaMinima;
    where.push(`coalesce(area, areaTotal, 0) >= $areaMinima`);
  }

  if (filters.areaMaxima !== null && filters.areaMaxima !== undefined) {
    params.areaMaxima = filters.areaMaxima;
    where.push(`coalesce(area, areaTotal, 0) <= $areaMaxima`);
  }

  const orderBy =
    filters.order === "maior_valor"
      ? `${priceField} desc`
      : filters.order === "menor_valor"
        ? `${priceField} asc`
        : filters.order === "mais_recentes"
          ? "dataAtualizacaoCRM desc"
          : "featured desc, dataAtualizacaoCRM desc";

  // Sync timestamps and prices can tie; keep page boundaries deterministic.
  return { filters, params, where, orderBy: `${orderBy}, _id asc` };
}

function mapSearchRow(row: Record<string, any>, index: number): ImovelSearchResult {
  return {
    id: row._id,
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
    image: getMainImage(row),
    tag: row.featured ? "EXCLUSIVO" : index < 3 ? "DESTAQUE" : "PREMIUM",
  };
}

const SEARCH_ROW_PROJECTION = `
  _id, codigoImovel, "slug": slug.current, title, neighborhood, cidade, type,
  area, areaTotal, suites, bedrooms, garage, price, rentPrice, featured,
  ${IMAGE_PROJECTION}
`;

export async function searchImoveis(
  rawFilters: ImovelSearchFilters,
  options: { page?: number; perPage?: number } = {}
): Promise<ImovelSearchPage> {
  const { params, where, orderBy } = await buildSearchQuery(rawFilters);
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const perPage = Math.min(48, Math.max(1, Math.trunc(options.perPage ?? 24)));
  const offset = (page - 1) * perPage;
  const filter = where.join(" && ");

  const [total, rows] = await Promise.all([
    sanity.fetch<number>(`count(*[${filter}])`, params),
    sanity.fetch<Record<string, any>[]>(
      `*[${filter}] | order(${orderBy}) [${offset}...${offset + perPage}] { ${SEARCH_ROW_PROJECTION} }`,
      params
    ),
  ]);

  const imoveis = rows.map((row, index): ImovelSearchResult => mapSearchRow(row, offset + index));

  return {
    imoveis,
    total,
    page,
    perPage,
    hasMore: offset + imoveis.length < total,
  };
}

function mapDetailRow(row: Record<string, any>): ImovelDetail {
  return {
    id: row._id,
    codigo: row.codigoImovel,
    slug: row.slug,
    titulo: row.title,
    tipo: row.type,
    finalidade: row.finalidade,
    bairro: row.neighborhood ?? "Londrina",
    cidade: row.cidade ?? "Londrina",
    estado: row.estado ?? "PR",
    endereco: row.address,
    numero: row.addressNumber,
    nomeCondominio: row.condominioNome,
    nomeEdificio: row.condominioRefNome,
    precoVenda: numberOrNull(row.price),
    precoLocacao: numberOrNull(row.rentPrice),
    precoCondominio: numberOrNull(row.condominio),
    precoIptu: numberOrNull(row.iptu),
    area: numberOrNull(row.area),
    areaTotal: numberOrNull(row.areaTotal),
    suites: row.suites,
    dormitorios: row.bedrooms,
    banheiros: row.bathrooms,
    vagas: row.garage,
    descricao: row.description,
    latitude: numberOrNull(row.latitude),
    longitude: numberOrNull(row.longitude),
    urlKenlo: row.urlSiteAntigo,
    videoUrl: row.videoUrl,
    corretor: {
      nome: row.captador ?? undefined,
      email: row.captadorEmail ?? undefined,
      celular: row.captadorCelular ?? undefined,
    },
    fotos: mapFotos(row),
  };
}

const DETAIL_PROJECTION = `
  _id, codigoImovel, "slug": slug.current, title, type, finalidade, cidade, estado,
  neighborhood, address, addressNumber, condominioNome, "condominioRefNome": condominioRef->nome,
  price, rentPrice, condominio, iptu,
  area, areaTotal, bedrooms, suites, bathrooms, garage,
  description, latitude, longitude, urlSiteAntigo, videoUrl,
  captador, captadorEmail, captadorCelular,
  ${IMAGE_PROJECTION}
`;

export async function getImovelBySlug(slug: string) {
  const row = await sanity.fetch<Record<string, any> | null>(
    `*[_type == "property" && slug.current == $slug && ${ACTIVE_FILTER}][0] { ${DETAIL_PROJECTION} }`,
    { slug }
  );

  return row ? mapDetailRow(row) : null;
}

export async function getSimilarImoveis(imovel: ImovelDetail, limit = 3) {
  const rows = await sanity.fetch<Record<string, any>[]>(
    `*[_type == "property" && ${ACTIVE_FILTER} && slug.current != $slug
        && (neighborhood == $bairro || type == $tipo)
      ] {
        ${SEARCH_ROW_PROJECTION},
        "_rank": select(neighborhood == $bairro && type == $tipo => 0, neighborhood == $bairro => 1, true => 2)
      } | order(_rank asc, coalesce(price, rentPrice) desc) [0...$limit]`,
    { slug: imovel.slug, bairro: imovel.bairro, tipo: imovel.tipo, limit }
  );

  return rows.map((row, index): ImovelSearchResult => ({
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
    image: getMainImage(row),
    tag: row.featured ? "EXCLUSIVO" : index === 0 ? "DESTAQUE" : "PREMIUM",
  }));
}
