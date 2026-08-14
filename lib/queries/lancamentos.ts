import { getPool } from "@/lib/db";
import type { NavDropdownItem } from "@/components/layout/HeaderClient";

type FotoRaw = {
  URLArquivo?: string;
  FotoDescricao?: string;
  FotoTitulo?: string;
  Principal?: string | number;
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
};

export type LancamentoDetail = LancamentoResumo & {
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
    .filter((foto) => Boolean(foto.URLArquivo))
    .map((foto, index) => ({
      url: foto.URLArquivo as string,
      alt: foto.FotoDescricao ?? foto.FotoTitulo ?? `${nome} - foto ${index + 1}`,
      principal: String(foto.Principal) === "1",
    }));
}

function getMainImage(galeria: LancamentoDetail["galeria"]) {
  return galeria.find((foto) => foto.principal)?.url ?? galeria[0]?.url ?? null;
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
  const galeria = mapFotos(row.fotos, nome);
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
    entrega: rawString(raw, ["entrega", "Entrega", "previsao_entrega", "previsão_entrega"]),
    faixa,
    metragens,
    unidades: rawString(raw, ["unidades", "Unidades", "unidades_por_andar"]),
    descricao,
    descricao2: rawString(raw, ["descricao2", "descrição2", "Descricao2", "Descrição2"]),
    diferenciais,
    endereco: [row.endereco, row.numero].filter(Boolean).join(", ") || null,
    latitude: numberOrNull(row.latitude),
    longitude: numberOrNull(row.longitude),
    galeria,
    image: getMainImage(galeria),
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
