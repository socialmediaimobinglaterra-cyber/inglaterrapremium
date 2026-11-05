import { sanitizeState } from "./search-state";

export function filtersFromSearchParams(params: Record<string, string | string[] | undefined>) {
  const scalar = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const number = (key: string) => scalar(key)?.trim() ? Number(scalar(key)) : null;
  return sanitizeState({
    negocio: scalar("negocio"), tipo: scalar("tipo"), bairro: scalar("bairro"), condominio: scalar("condominio"),
    valorMinimo: number("valorMinimo"), valorMaximo: number("valorMaximo"),
  });
}
