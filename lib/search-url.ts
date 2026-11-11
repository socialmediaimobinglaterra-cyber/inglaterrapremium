import { numberFields, sanitizeState, textFields } from "./search-state";
import type { ImovelSearchFilters } from "./queries/imoveis";

const orders = ["relevancia", "maior_valor", "menor_valor", "mais_recentes"] as const;

export function filtersFromSearchParams(params: Record<string, string | string[] | undefined>) {
  const scalar = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const number = (key: string) => scalar(key)?.trim() ? Number(scalar(key)) : null;
  const state = sanitizeState({
    negocio: scalar("negocio"), tipo: scalar("tipo"), bairro: scalar("bairro"), condominio: scalar("condominio"),
    ...Object.fromEntries(numberFields.map(field => [field, number(field)])),
    mobiliado: scalar("mobiliado") === "true",
  });
  const order = scalar("order");
  return {
    ...state,
    order: orders.includes(order as typeof orders[number]) ? order as typeof orders[number] : "relevancia",
    mapSelection: scalar("mapa")?.slice(0, 120) || undefined,
  } satisfies ImovelSearchFilters;
}

export function filtersToSearchParams(filters: ImovelSearchFilters, current = new URLSearchParams()) {
  const params = new URLSearchParams(current);
  // Store only interpreted filters: reloading must not call the AI again or replay an old phrase.
  for (const field of [...textFields, ...numberFields, "mobiliado", "order", "mapa", "q", "page"]) params.delete(field);
  const state = sanitizeState(filters);
  for (const field of [...textFields, ...numberFields]) {
    if (state[field] != null) params.set(field, String(state[field]));
  }
  if (state.mobiliado) params.set("mobiliado", "true");
  if (filters.order && orders.includes(filters.order)) params.set("order", filters.order);
  if (filters.mapSelection) params.set("mapa", filters.mapSelection.slice(0, 120));
  return params;
}
