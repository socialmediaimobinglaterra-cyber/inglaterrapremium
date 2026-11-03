// Regra do site Premium (definida pela Eveline, Marketing, nov/2026), sem dependência de Next
// para poder ser testada com `tsx`. A configuração vive no documento `premiumConfig` do
// Sanity (editável no Studio); aqui só se transforma essa configuração em filtro GROQ.

export type PremiumConfig = {
  bairrosPremium: string[];
  /**
   * Grafias EXATAS dessas bairros que existem nos imóveis (ex.: "Bela Suiça", "Bela Suíça").
   * Preenchido pelo carregador a partir dos dados; GROQ não ignora acento sozinho.
   */
  bairrosExatos: string[];
  /** _id dos documentos `condominio` premium. */
  condominioIds: string[];
  vendaMinima: number;
  locacaoMinima: number;
  /** Códigos (codigoImovel) que SEMPRE aparecem no Premium. */
  forcarPremium: string[];
  /** Códigos que NUNCA aparecem no Premium (vence sobre `forcarPremium`). */
  forcarMatriz: string[];
};

/** Mesmo valor-padrão do documento criado no Sanity; só vale se o documento sumir. */
export const DEFAULT_PREMIUM_CONFIG: PremiumConfig = {
  bairrosPremium: ["Terra Bonita", "Gleba Palhano", "Bela Suíça", "Nova Prochet"],
  bairrosExatos: [],
  condominioIds: [],
  vendaMinima: 1_000_000,
  locacaoMinima: 4_000,
  forcarPremium: [],
  forcarMatriz: [],
};

/** Imóvel publicado pelo CRM (antes de aplicar a regra premium). */
export const PUBLISHED_FILTER = `status == "ativo" && publicarSite == true`;

/** Sem acento, minúsculo, espaços únicos: compara "Bela Suíça" com "Bela Suiça". */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

/** GROQ não remove acento: lista as grafias com e sem acento, já em minúsculas. */
export function bairroVariants(names: string[]): string[] {
  const out = new Set<string>();
  for (const name of names) {
    const clean = name.replace(/\s+/g, " ").trim();
    if (!clean) continue;
    out.add(clean.toLocaleLowerCase("pt-BR"));
    out.add(normalizeText(clean));
  }
  return [...out];
}

/** Entre os bairros que existem nos imóveis, os que são (sem acento/caixa) um dos bairros premium. */
export function resolveBairrosExatos(configured: string[], existing: string[]): string[] {
  const wanted = new Set(configured.map(normalizeText));
  return [...new Set(existing.map((n) => n.trim()).filter((n) => n && wanted.has(normalizeText(n))))];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "").map((v) => v.trim()) : [];
}

function money(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

type RawConfig = {
  bairrosPremium?: unknown;
  condominioIds?: unknown;
  vendaMinima?: unknown;
  locacaoMinima?: unknown;
  forcarPremium?: unknown;
  forcarMatriz?: unknown;
} | null;

/** Aceita o que vier do Sanity (campos ausentes, nulos ou com lixo) e devolve uma configuração válida. */
export function normalizeConfig(raw: RawConfig | undefined): PremiumConfig {
  if (!raw) return DEFAULT_PREMIUM_CONFIG;
  return {
    bairrosPremium: strings(raw.bairrosPremium),
    bairrosExatos: [],
    condominioIds: strings(raw.condominioIds).map((id) => id.replace(/^drafts\./, "")),
    vendaMinima: money(raw.vendaMinima, DEFAULT_PREMIUM_CONFIG.vendaMinima),
    locacaoMinima: money(raw.locacaoMinima, DEFAULT_PREMIUM_CONFIG.locacaoMinima),
    forcarPremium: strings(raw.forcarPremium).map((c) => c.toUpperCase()),
    forcarMatriz: strings(raw.forcarMatriz).map((c) => c.toUpperCase()),
  };
}

// JSON é GROQ válido para lista de strings; JSON.stringify cuida de aspas e barras.
const lista = (values: string[]) => JSON.stringify(values);

/**
 * Filtro GROQ do que aparece no Premium. DECISÃO DO CRM MANDA; a regra abaixo é PROVISÓRIA.
 *   publicado pelo CRM (ativo + publicarSite)
 *   E ( o documento TEM `publicarPremium` definido  ->  vale ele (true entra, false sai)
 *       OU não tem  ->  regra provisória do premiumConfig:
 *            fora da lista "nunca no Premium"
 *            E ( está em "sempre no Premium"
 *                OU ( bairro premium OU condomínio premium ) E ( venda >= mínimo OU locação >= mínimo ) ) )
 * Quando o CRM passar a gravar `publicarPremium` em todos os imóveis, a parte provisória deixa de ser usada.
 */
export function buildPremiumFilter(config: PremiumConfig): string {
  const bairros = bairroVariants(config.bairrosPremium);
  const bairroTeste = [
    bairros.length ? `lower(neighborhood) in ${lista(bairros)}` : null,
    config.bairrosExatos.length ? `neighborhood in ${lista(config.bairrosExatos)}` : null,
  ].filter(Boolean);
  const local = [
    bairroTeste.length ? `(${bairroTeste.join(" || ")})` : null,
    config.condominioIds.length ? `condominioRef._ref in ${lista(config.condominioIds)}` : null,
  ].filter(Boolean);
  const regra = local.length
    ? `((${local.join(" || ")}) && (price >= ${config.vendaMinima} || rentPrice >= ${config.locacaoMinima}))`
    : "false";
  const forcar = config.forcarPremium.length ? `codigoImovel in ${lista(config.forcarPremium)}` : "false";
  const excluir = config.forcarMatriz.length ? `!(codigoImovel in ${lista(config.forcarMatriz)})` : "true";
  const provisoria = `${excluir} && (${forcar} || ${regra})`;
  return `${PUBLISHED_FILTER} && ((defined(publicarPremium) && publicarPremium == true) || (!defined(publicarPremium) && ${provisoria}))`;
}
