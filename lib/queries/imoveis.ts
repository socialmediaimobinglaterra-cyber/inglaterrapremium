import { getPool } from "@/lib/db";
import { imageUrlOrFallback } from "@/lib/images";

export type ImovelSearchFilters = {
  bairro?: string | null;
  tipo?: string | null;
  negocio?: "Comprar" | "Alugar" | null;
  valorMinimo?: number | null;
  valorMaximo?: number | null;
  suitesMinimas?: number | null;
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

type Foto = {
  URLArquivo?: string;
  Principal?: string | number;
};

function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getMainImage(fotos: Foto[] | null) {
  const all = Array.isArray(fotos) ? fotos : [];
  return imageUrlOrFallback(
    all.find((foto) => String(foto.Principal) === "1")?.URLArquivo ??
      all[0]?.URLArquivo
  );
}

function mapFotos(fotos: Array<Foto & { FotoDescricao?: string; FotoTitulo?: string }> | null) {
  const all = Array.isArray(fotos) ? fotos : [];
  return all
    .filter((foto) => Boolean(foto.URLArquivo))
    .map((foto) => ({
      url: imageUrlOrFallback(foto.URLArquivo),
      alt: foto.FotoDescricao ?? foto.FotoTitulo,
      principal: String(foto.Principal) === "1",
    }));
}

export function normalizeSearchFilters(filters: ImovelSearchFilters) {
  return {
    bairro: filters.bairro && filters.bairro !== "Todos os bairros" ? filters.bairro : null,
    tipo: filters.tipo && filters.tipo !== "Todos os tipos" ? filters.tipo : null,
    negocio: filters.negocio ?? "Comprar",
    valorMinimo: filters.valorMinimo ?? null,
    valorMaximo: filters.valorMaximo ?? null,
    suitesMinimas: filters.suitesMinimas ?? null,
    order: filters.order ?? "relevancia",
  } satisfies ImovelSearchFilters;
}

export async function getImoveisFilterOptions() {
  const pool = getPool();
  const [bairrosResult, tiposResult] = await Promise.all([
    pool.query(`
      select distinct bairro_nome
      from imoveis
      where ativo = true and ativo_no_site = true and bairro_nome is not null
      order by bairro_nome
    `),
    pool.query(`
      select distinct tipo
      from imoveis
      where ativo = true and ativo_no_site = true and tipo is not null
      order by tipo
    `),
  ]);

  return {
    bairros: bairrosResult.rows.map((row) => row.bairro_nome as string),
    tipos: tiposResult.rows.map((row) => row.tipo as string),
  };
}

export async function searchImoveis(rawFilters: ImovelSearchFilters, limit = 24) {
  const filters = normalizeSearchFilters(rawFilters);
  const values: unknown[] = [];
  const where = ["ativo = true", "ativo_no_site = true"];

  if (filters.negocio === "Alugar") {
    where.push("preco_locacao is not null");
  } else {
    where.push("preco_venda is not null");
  }

  if (filters.bairro) {
    values.push(filters.bairro);
    where.push(`bairro_nome = $${values.length}`);
  }

  if (filters.tipo) {
    values.push(filters.tipo);
    where.push(`tipo = $${values.length}`);
  }

  const priceColumn = filters.negocio === "Alugar" ? "preco_locacao" : "preco_venda";

  if (filters.valorMinimo !== null && filters.valorMinimo !== undefined) {
    values.push(filters.valorMinimo);
    where.push(`${priceColumn} >= $${values.length}`);
  }

  if (filters.valorMaximo !== null && filters.valorMaximo !== undefined) {
    values.push(filters.valorMaximo);
    where.push(`${priceColumn} <= $${values.length}`);
  }

  if (filters.suitesMinimas !== null && filters.suitesMinimas !== undefined) {
    values.push(filters.suitesMinimas);
    where.push("coalesce(suites, 0) >= $" + values.length);
  }

  values.push(limit);

  const orderBy =
    filters.order === "maior_valor"
      ? `${priceColumn} desc nulls last`
      : filters.order === "menor_valor"
        ? `${priceColumn} asc nulls last`
        : filters.order === "mais_recentes"
          ? "updated_at desc nulls last"
          : "is_premium_override desc, updated_at desc nulls last";

  const result = await getPool().query(
    `
      select id, kenlo_codigo, slug, titulo, bairro_nome, cidade, tipo,
        area_util, area_total, suites, dormitorios, vagas, preco_venda,
        preco_locacao, fotos, is_premium_override
      from imoveis
      where ${where.join(" and ")}
      order by ${orderBy}
      limit $${values.length}
    `,
    values
  );

  return result.rows.map((row, index): ImovelSearchResult => {
    const precoVenda = numberOrNull(row.preco_venda);
    const precoLocacao = numberOrNull(row.preco_locacao);

    return {
      id: String(index + 1).padStart(2, "0"),
      codigo: row.kenlo_codigo,
      slug: row.slug,
      titulo: row.titulo,
      bairro: row.bairro_nome ?? "Londrina",
      cidade: row.cidade ?? "Londrina",
      tipo: row.tipo ?? "Imovel",
      area: numberOrNull(row.area_util ?? row.area_total),
      suites: row.suites,
      dormitorios: row.dormitorios,
      vagas: row.vagas,
      precoVenda,
      precoLocacao,
      image: getMainImage(row.fotos),
      tag: row.is_premium_override ? "EXCLUSIVO" : index < 3 ? "DESTAQUE" : "PREMIUM",
    };
  });
}

function mapDetailRow(row: Record<string, any>): ImovelDetail {
  return {
    id: row.id,
    codigo: row.kenlo_codigo,
    slug: row.slug,
    titulo: row.titulo,
    tipo: row.tipo,
    finalidade: row.finalidade,
    bairro: row.bairro_nome ?? "Londrina",
    cidade: row.cidade ?? "Londrina",
    estado: row.estado ?? "PR",
    endereco: row.endereco,
    numero: row.numero,
    nomeCondominio: row.nome_condominio,
    nomeEdificio: row.nome_edificio,
    precoVenda: numberOrNull(row.preco_venda),
    precoLocacao: numberOrNull(row.preco_locacao),
    precoCondominio: numberOrNull(row.preco_condominio),
    precoIptu: numberOrNull(row.preco_iptu),
    area: numberOrNull(row.area_util),
    areaTotal: numberOrNull(row.area_total),
    suites: row.suites,
    dormitorios: row.dormitorios,
    banheiros: row.banheiros,
    vagas: row.vagas,
    descricao: row.descricao,
    latitude: numberOrNull(row.latitude),
    longitude: numberOrNull(row.longitude),
    urlKenlo: row.url_kenlo,
    videoUrl: row.video_url,
    corretor: row.corretor ?? {},
    fotos: mapFotos(row.fotos),
  };
}

export async function getImovelBySlug(slug: string) {
  const result = await getPool().query(
    `
      select id, kenlo_codigo, slug, titulo, tipo, finalidade, cidade, estado,
        bairro_nome, endereco, numero, nome_condominio, nome_edificio,
        preco_venda, preco_locacao, preco_condominio, preco_iptu,
        area_util, area_total, dormitorios, suites, banheiros, vagas,
        descricao, latitude, longitude, url_kenlo, video_url, corretor, fotos
      from imoveis
      where slug = $1 and ativo = true and ativo_no_site = true
      limit 1
    `,
    [slug]
  );

  return result.rows[0] ? mapDetailRow(result.rows[0]) : null;
}

export async function getSimilarImoveis(imovel: ImovelDetail, limit = 3) {
  const result = await getPool().query(
    `
      select id, kenlo_codigo, slug, titulo, bairro_nome, cidade, tipo,
        area_util, area_total, suites, dormitorios, vagas, preco_venda,
        preco_locacao, fotos, is_premium_override
      from imoveis
      where ativo = true
        and ativo_no_site = true
        and slug <> $1
        and (bairro_nome = $2 or tipo = $3)
      order by
        case when bairro_nome = $2 and tipo = $3 then 0
             when bairro_nome = $2 then 1
             else 2
        end,
        coalesce(preco_venda, preco_locacao) desc nulls last
      limit $4
    `,
    [imovel.slug, imovel.bairro, imovel.tipo, limit]
  );

  return result.rows.map((row, index): ImovelSearchResult => ({
    id: String(index + 1).padStart(2, "0"),
    codigo: row.kenlo_codigo,
    slug: row.slug,
    titulo: row.titulo,
    bairro: row.bairro_nome ?? "Londrina",
    cidade: row.cidade ?? "Londrina",
    tipo: row.tipo ?? "Imovel",
    area: numberOrNull(row.area_util ?? row.area_total),
    suites: row.suites,
    dormitorios: row.dormitorios,
    vagas: row.vagas,
    precoVenda: numberOrNull(row.preco_venda),
    precoLocacao: numberOrNull(row.preco_locacao),
    image: getMainImage(row.fotos),
    tag: row.is_premium_override ? "EXCLUSIVO" : index === 0 ? "DESTAQUE" : "PREMIUM",
  }));
}
