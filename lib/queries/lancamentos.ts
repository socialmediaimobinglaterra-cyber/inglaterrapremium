import { getPool } from "@/lib/db";
import type { NavDropdownItem } from "@/components/layout/HeaderClient";

type FotoRaw = {
  URLArquivo?: string;
  FotoDescricao?: string;
  FotoTitulo?: string;
  Principal?: string | number;
  url?: string;
  alt?: string;
  principal?: boolean;
  position?: string;
};

type LancamentoRow = Record<string, any>;

export type LancamentoResumo = {
  id: string;
  nome: string;
  slug: string;
  bairro: string;
  cidade: string;
  estado: string;
  status: string | null;
  image: string | null;
  imagePosition: string;
};

export type LancamentoDetail = LancamentoResumo & {
  construtoraNome: string | null;
  construtoraLogo: {
    url: string;
    alt: string;
    principal: boolean;
    position: string;
  } | null;
  entrega: string | null;
  faixa: string | null;
  metragens: string | null;
  unidades: string | null;
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
    position: string;
  }>;
  capa: {
    url: string;
    alt: string;
    principal: boolean;
    position: string;
  } | null;
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
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
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

function normalizePosition(value: unknown) {
  const allowed = new Set([
    "left top",
    "center top",
    "right top",
    "left center",
    "center center",
    "right center",
    "left bottom",
    "center bottom",
    "right bottom",
  ]);

  return typeof value === "string" && allowed.has(value) ? value : "center center";
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

function mapFotos(fotos: FotoRaw[] | null, nome: string) {
  const all = Array.isArray(fotos) ? fotos : [];

  return all
    .filter((foto) => Boolean(foto.URLArquivo ?? foto.url))
    .map((foto, index) => ({
      url: (foto.URLArquivo ?? foto.url) as string,
      alt: foto.FotoDescricao ?? foto.FotoTitulo ?? foto.alt ?? `${nome} - foto ${index + 1}`,
      principal: foto.principal === true || String(foto.Principal) === "1" || index === 0,
      position: normalizePosition(foto.position),
    }));
}

function getMainImage(galeria: LancamentoDetail["galeria"]) {
  return galeria.find((foto) => foto.principal)?.url ?? galeria[0]?.url ?? null;
}

function getMainPosition(galeria: LancamentoDetail["galeria"]) {
  return galeria.find((foto) => foto.principal)?.position ?? galeria[0]?.position ?? "center center";
}

function extractDifferentials(description: string | null) {
  if (!description) return [];

  const lines = description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const start = lines.findIndex((line) => /diferenciais/i.test(line));
  const selected = start >= 0 ? lines.slice(start + 1) : lines;

  return selected
    .filter((line) => line.startsWith("*") || line.startsWith("-") || line.startsWith("•"))
    .map((line) => line.replace(/^[*\-\u2022]\s*/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .slice(0, 6);
}

function mapLancamento(row: LancamentoRow): LancamentoDetail {
  const raw = row.raw ?? {};
  const nome = row.nome;
  const bairro = row.bairro_nome ?? row.imovel_bairro_nome ?? "Londrina";
  const imovelEndereco = [row.endereco, row.numero].filter(Boolean).join(", ") || null;
  const rawGallery = raw && typeof raw === "object" ? (raw as Record<string, unknown>).galeria : null;
  const rawCover = raw && typeof raw === "object" ? (raw as Record<string, unknown>).capa : null;
  const rawBuilderLogo =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>).construtoraLogo : null;
  const galeria = mapFotos(
    Array.isArray(rawGallery) && rawGallery.length > 0
      ? (rawGallery as FotoRaw[])
      : row.fotos,
    nome
  );
  const [capa] = mapFotos(
    Array.isArray(rawCover)
      ? (rawCover as FotoRaw[])
      : rawCover && typeof rawCover === "object"
        ? [rawCover as FotoRaw]
        : null,
    nome
  );
  const [construtoraLogo] = mapFotos(
    Array.isArray(rawBuilderLogo)
      ? (rawBuilderLogo as FotoRaw[])
      : rawBuilderLogo && typeof rawBuilderLogo === "object"
        ? [rawBuilderLogo as FotoRaw]
        : null,
    nome
  );
  const descricao =
    rawString(raw, ["descricao", "descrição", "Descricao", "Descrição", "sobre"]) ??
    row.imovel_descricao ??
    null;
  const precoVenda = numberOrNull(row.preco_venda);
  const areaUtil = numberOrNull(row.area_util);
  const areaTotal = numberOrNull(row.area_total);
  const metragens =
    rawString(raw, ["metragens", "Metragens", "area", "Área"]) ??
    formatArea(areaUtil ?? areaTotal);
  const faixa =
    rawString(raw, ["faixa", "valor", "valores", "preco", "preço"]) ??
    (precoVenda ? `A partir de ${formatCurrency(precoVenda)}` : null);
  const diferenciais = rawArray(raw, ["diferenciais", "Diferenciais"]).length
    ? rawArray(raw, ["diferenciais", "Diferenciais"])
    : extractDifferentials(descricao);

  return {
    id: row.id,
    nome,
    slug: row.slug,
    bairro,
    cidade: row.cidade ?? "Londrina",
    estado: row.estado ?? "PR",
    status: rawString(raw, ["status", "Status", "situacao", "situação"]),
    construtoraNome: rawString(raw, ["construtoraNome", "construtora_nome", "Construtora"]),
    construtoraLogo: construtoraLogo ?? null,
    entrega: rawString(raw, ["entrega", "Entrega", "previsao_entrega", "previsão_entrega"]),
    faixa,
    metragens,
    unidades: rawString(raw, ["unidades", "Unidades", "unidades_por_andar"]),
    descricao,
    descricao2: rawString(raw, ["descricao2", "descrição2", "Descricao2", "Descrição2"]),
    diferenciais,
    endereco:
      rawString(raw, ["endereco", "Endereço", "localizacao", "localização"]) ??
      imovelEndereco,
    latitude: numberOrNull(rawString(raw, ["latitude"]) ?? row.latitude),
    longitude: numberOrNull(rawString(raw, ["longitude"]) ?? row.longitude),
    galeria,
    capa: capa ?? null,
    image: capa?.url ?? getMainImage(galeria),
    imagePosition: capa?.position ?? getMainPosition(galeria),
  };
}

export async function getHeaderLancamentos(): Promise<NavDropdownItem[]> {
  const result = await getPool().query(
    `
      select nome, slug
      from lancamentos
      where ativo = true and slug is not null
      order by nome
    `
  );

  return result.rows.map((row) => ({
    label: row.nome,
    href: `/lancamentos/${row.slug}`,
  }));
}

export async function getLancamentoBySlug(slug: string) {
  const result = await getPool().query(
    `
      select l.id, l.nome, l.slug, l.bairro_nome, l.cidade, l.estado, l.raw,
        i.bairro_nome as imovel_bairro_nome, i.descricao as imovel_descricao,
        i.preco_venda, i.area_util, i.area_total, i.endereco, i.numero,
        i.latitude, i.longitude, i.fotos
      from lancamentos l
      left join imoveis i on i.id = l.imovel_id
      where l.slug = $1 and l.ativo = true
      limit 1
    `,
    [slug]
  );

  return result.rows[0] ? mapLancamento(result.rows[0]) : null;
}

export async function getRelatedLancamentos(currentSlug: string, limit = 3) {
  const result = await getPool().query(
    `
      select l.id, l.nome, l.slug, l.bairro_nome, l.cidade, l.estado, l.raw,
        i.bairro_nome as imovel_bairro_nome, i.descricao as imovel_descricao,
        i.preco_venda, i.area_util, i.area_total, i.endereco, i.numero,
        i.latitude, i.longitude, i.fotos
      from lancamentos l
      left join imoveis i on i.id = l.imovel_id
      where l.ativo = true and l.slug <> $1
      order by l.nome
      limit $2
    `,
    [currentSlug, limit]
  );

  return result.rows.map(mapLancamento);
}
