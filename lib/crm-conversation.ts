import { createCrmCatalogClient } from "./crm-catalog";
import { formatCrmDecimal, isLocalCrmPreview } from "./crm-preview";
import { parseCrmSearch } from "./crm-search";
import { canAccessCrmPreview } from "./crm-preview-access";
import type { Vocabulary } from "./search-state";
import type { ImovelSearchResult } from "./queries/imoveis";

export type CrmConversationListing = ImovelSearchResult & {
  crmDisplay?: { price: string; area: string; href: string | null };
};

export async function previewCatalog() {
  if (!await canAccessCrmPreview()) throw new Error("preview_unavailable");
  return isLocalCrmPreview() ? createCrmCatalogClient(fetch, "http://127.0.0.1:3005") : createCrmCatalogClient();
}

export async function conversationVocabulary() {
  const options = await (await previewCatalog()).filters();
  const vocabulary: Vocabulary = { bairro: [], tipo: [], condominio: [] };
  for (const key of ["bairro", "tipo", "condominio"] as const) {
    vocabulary[key] = [...new Set(options.map(row => row[key]).filter((name): name is string => Boolean(name)))];
  }
  return vocabulary;
}

export async function conversationResults(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("invalid_input");
  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "perPage" && value === 24) continue;
    if (value === null || value === undefined) continue;
    if (typeof value !== "string" && typeof value !== "number") throw new Error("invalid_input");
    raw[key] = String(value);
  }
  const query = parseCrmSearch(raw);
  const result = await (await previewCatalog()).list(query);
  const imoveis: CrmConversationListing[] = result.items.map(item => {
    const price = query.get("negocio") === "Alugar" ? item.prices.rent : item.prices.sale;
    const size = item.areas.usable ?? item.areas.total;
    return {
      id: item.publicCode, codigo: item.publicCode, slug: item.publicCode,
      titulo: item.title, bairro: item.location.officialNeighborhood ?? "", cidade: item.location.city,
      tipo: item.taxonomy.normalizedType ?? "", area: null, precoVenda: null, precoLocacao: null,
      suites: item.rooms.suites, dormitorios: item.rooms.bedrooms, vagas: item.rooms.parkingSpaces,
      image: (item.media.find(photo => photo.isPrimary) ?? item.media[0])?.url ?? "", tag: "",
      crmDisplay: {
        price: price ? `R$ ${formatCrmDecimal(price, 2)}` : "Sob consulta",
        area: size ? `${formatCrmDecimal(size)} ${item.areas.unit === "ha" ? "ha" : item.areas.unit === "m2" ? "m²" : ""}` : "Área sob consulta",
        href: item.publicCode === "CA5278" ? "/preview/crm/CA5278" : null,
      },
    };
  });
  return { imoveis, total: result.total, page: result.page, perPage: result.perPage, hasMore: result.hasMore };
}

// Local-only guard; production retains its distributed limiter and usage log.
let previewAttempts = 0;
let previewWindow = Date.now();
export function consumePreviewAiQuota() {
  if (!isLocalCrmPreview()) throw new Error("preview_unavailable");
  const now = Date.now();
  if (now - previewWindow >= 3600000) { previewAttempts = 0; previewWindow = now; }
  if (previewAttempts >= 3) return Math.max(1, Math.ceil((previewWindow + 3600000 - now) / 1000));
  previewAttempts++;
  return 0;
}
