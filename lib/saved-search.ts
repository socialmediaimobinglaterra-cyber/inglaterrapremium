import { sanitizeState } from "./search-state";
import type { ImovelSearchFilters } from "./queries/imoveis";

export const SEARCH_CONSENT_VERSION = "salva-busca-v1";
export const SEARCH_CONSENT = "Autorizo a Inglaterra Premium a registrar meus dados e os critérios desta busca na central de atendimento e no RD Station, e a entrar em contato por e-mail ou WhatsApp sobre imóveis compatíveis. Posso solicitar o encerramento desse contato a qualquer momento.";

const labels: Record<string, string> = {
  negocio: "Finalidade", tipo: "Tipo", bairro: "Bairro", condominio: "Condomínio",
  valorMinimo: "Valor mínimo", valorMaximo: "Valor máximo", quartosMinimos: "Quartos mínimos",
  suitesMinimas: "Suítes mínimas", vagasMinimas: "Vagas mínimas", areaMinima: "Área mínima (m²)",
  areaMaxima: "Área máxima (m²)", mobiliado: "Mobiliado",
};

export function searchProfile(filters: ImovelSearchFilters) {
  const clean = sanitizeState(filters);
  return Object.entries(labels).flatMap(([key, label]) => {
    const value = clean[key as keyof ImovelSearchFilters];
    if (value == null) return [];
    const display = key.startsWith("valor") ? Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : value === true ? "Sim" : String(value);
    return [`${label}: ${display}`];
  });
}

export function parseSavedSearch(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Informe seus dados.");
  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  let phone = typeof body.phone === "string" && body.phone.length <= 30 ? body.phone.replace(/\D/g, "") : "";
  if (phone.length >= 12 && phone.startsWith("55")) phone = phone.slice(2);
  if (name.length < 2 || name.length > 120 || /[\r\n\x00-\x1f]/.test(name)) throw new Error("Informe seu nome (até 120 caracteres).");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail válido.");
  if (!/^[1-9]{2}9\d{8}$/.test(phone)) throw new Error("Informe um WhatsApp válido com DDD e nove dígitos.");
  if (body.consent !== true) throw new Error("Autorize o contato para salvar a busca.");
  if (!body.filters || typeof body.filters !== "object" || Array.isArray(body.filters)) throw new Error("Não foi possível identificar os filtros.");
  const raw = body.filters as Record<string, unknown>;
  // A cluster token is temporary, not a durable geographic preference.
  if (raw.mapSelection) throw new Error("Para salvar, escolha um bairro ou condomínio nos filtros no lugar da seleção do mapa.");
  const filters = sanitizeState(raw);
  for (const [key, clean] of Object.entries(filters)) {
    if (raw[key] != null && raw[key] !== "" && clean == null && raw[key] !== false) throw new Error("Revise os filtros da busca.");
  }
  for (const [min, max] of [["valorMinimo", "valorMaximo"], ["areaMinima", "areaMaxima"]] as const) {
    if (filters[min] != null && filters[max] != null && filters[min]! > filters[max]!) throw new Error("O mínimo não pode ser maior que o máximo.");
  }
  return { name, email, phone: `+55${phone}`, filters };
}

export type SavedSearchLead = ReturnType<typeof parseSavedSearch>;
