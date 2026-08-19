import type { NavDropdownItem } from "@/components/layout/HeaderClient";
import { getPool } from "@/lib/db";
import type { ImovelSearchResult } from "@/lib/queries/imoveis";

type FotoRaw = {
  URLArquivo?: string;
  FotoDescricao?: string;
  FotoTitulo?: string;
  Principal?: string | number;
  url?: string;
  alt?: string;
  principal?: boolean;
};

type CondominioRow = Record<string, any>;

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
  galeria: Array<{
    url: string;
    alt: string;
    principal: boolean;
  }>;
};

function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function rawString(raw: unknown, keys: string[]) {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return null;
}

function rawArray(raw: unknown, keys: string[]) {
  if (!raw || typeof raw !== "object") return [];
  const source = raw as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value.map(String).map((item) => item.trim()).filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
      return value
        .split(/\r?\n|;/)
        .map((item) => item.replace(/^[*\-\u2022]\s*/, "").trim())
        .filter(Boolean);
    }
  }

  return [];
}

function mapFotos(fotos: FotoRaw[] | null, nome: string) {
  const all = Array.isArray(fotos) ? fotos : [];

  return all
    .filter((foto) => Boolean(foto.URLArquivo ?? foto.url))
    .map((foto, index) => ({
      url: (foto.URLArquivo ?? foto.url) as string,
      alt: foto.FotoDescricao ?? foto.FotoTitulo ?? foto.alt ?? `${nome} - foto ${index + 1}`,
      principal: foto.principal === true || String(foto.Principal) === "1" || index === 0,
    }));
}

function getMainImage(galeria: CondominioDetail["galeria"]) {
  return galeria.find((foto) => foto.principal)?.url ?? galeria[0]?.url ?? null;
}

function formatCurrency(value: number | null) {
  if (value === null) return null;

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function formatArea(value: number | null) {
  if (value === null) return null;
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²`;
}

function mapImovel(row: Record<string, any>, index: number): ImovelSearchResult {
  const fotos = mapFotos(row.fotos, row.titulo);
  const precoVenda = numberOrNull(row.preco_venda);
  const precoLocacao = numberOrNull(row.preco_locacao);

  return {
    id: String(index + 1).padStart(2, "0"),
    codigo: row.kenlo_codigo,
    slug: row.slug,
    titulo: row.titulo,
    bairro: row.bairro_nome ?? "Londrina",
    cidade: row.cidade ?? "Londrina",
    tipo: row.tipo ?? "Imóvel",
    area: numberOrNull(row.area_util ?? row.area_total),
    suites: row.suites,
    dormitorios: row.dormitorios,
    vagas: row.vagas,
    precoVenda,
    precoLocacao,
    image: getMainImage(fotos) ?? "/images/capa-hero.jpg",
    tag: row.is_premium_override ? "EXCLUSIVO" : index === 0 ? "DESTAQUE" : "PREMIUM",
  };
}

function mapCondominio(row: CondominioRow): CondominioDetail {
  const raw = row.raw ?? {};
  const rawGallery = raw && typeof raw === "object" ? (raw as Record<string, unknown>).galeria : null;
  const fallbackFotos = Array.isArray(row.imoveis_fotos) ? row.imoveis_fotos.flat() : [];
  const galeria = mapFotos(
    Array.isArray(rawGallery) && rawGallery.length > 0 ? (rawGallery as FotoRaw[]) : fallbackFotos,
    row.nome
  );

  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    bairro: row.bairro_nome ?? "Londrina",
    cidade: row.cidade ?? "Londrina",
    estado: row.estado ?? "PR",
    image: getMainImage(galeria),
    imoveisCount: Number(row.imoveis_count ?? 0),
    unidades: rawString(raw, ["unidades", "Unidades", "lotes", "Lotes"]),
    areaTotal: rawString(raw, ["areaTotal", "area_total", "Área total", "AreaTotal"]),
    seguranca: rawString(raw, ["seguranca", "segurança", "Segurança", "portaria"]),
    descricao: rawString(raw, ["descricao", "descrição", "Descricao", "Descrição", "sobre"]),
    descricao2: rawString(raw, ["descricao2", "descrição2", "Descricao2", "Descrição2"]),
    diferenciais: rawArray(raw, ["diferenciais", "Diferenciais", "infraestrutura", "Infraestrutura"]),
    endereco: rawString(raw, ["endereco", "Endereço", "localizacao", "localização"]),
    latitude: numberOrNull(rawString(raw, ["latitude"])),
    longitude: numberOrNull(rawString(raw, ["longitude"])),
    galeria,
  };
}

export async function getHeaderCondominios(): Promise<NavDropdownItem[]> {
  const result = await getPool().query(
    `
      select nome, slug
      from condominios
      where ativo = true and slug is not null
      order by nome
    `
  );

  return result.rows.map((row) => ({
    label: row.nome,
    href: `/condominios/${row.slug}`,
  }));
}

export async function getCondominioBySlug(slug: string) {
  const result = await getPool().query(
    `
      select c.id, c.nome, c.slug, c.bairro_nome, c.cidade, c.estado,
        c.imoveis_count, c.raw,
        coalesce(
          jsonb_agg(i.fotos order by i.updated_at desc)
            filter (where i.id is not null and jsonb_array_length(i.fotos) > 0),
          '[]'::jsonb
        ) as imoveis_fotos
      from condominios c
      left join imoveis i on i.nome_condominio = c.nome
        and i.ativo = true
        and i.ativo_no_site = true
      where c.slug = $1 and c.ativo = true
      group by c.id
      limit 1
    `,
    [slug]
  );

  return result.rows[0] ? mapCondominio(result.rows[0]) : null;
}

export async function getCondominioImoveis(condominio: CondominioDetail, limit = 3) {
  const result = await getPool().query(
    `
      select id, kenlo_codigo, slug, titulo, bairro_nome, cidade, tipo,
        area_util, area_total, suites, dormitorios, vagas, preco_venda,
        preco_locacao, fotos, is_premium_override
      from imoveis
      where ativo = true
        and ativo_no_site = true
        and nome_condominio = $1
      order by coalesce(preco_venda, preco_locacao) desc nulls last, updated_at desc nulls last
      limit $2
    `,
    [condominio.nome, limit]
  );

  return result.rows.map(mapImovel);
}

export async function getRelatedCondominios(currentSlug: string, limit = 3) {
  const result = await getPool().query(
    `
      select c.id, c.nome, c.slug, c.bairro_nome, c.cidade, c.estado,
        c.imoveis_count, c.raw,
        coalesce(
          jsonb_agg(i.fotos order by i.updated_at desc)
            filter (where i.id is not null and jsonb_array_length(i.fotos) > 0),
          '[]'::jsonb
        ) as imoveis_fotos
      from condominios c
      left join imoveis i on i.nome_condominio = c.nome
        and i.ativo = true
        and i.ativo_no_site = true
      where c.ativo = true and c.slug <> $1
      group by c.id
      order by c.nome
      limit $2
    `,
    [currentSlug, limit]
  );

  return result.rows.map(mapCondominio);
}
