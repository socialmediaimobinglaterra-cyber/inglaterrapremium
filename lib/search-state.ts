import type { ImovelSearchFilters } from "./queries/imoveis";

export const QUERY_MAX_LENGTH = 500;
export const textFields = ["bairro", "condominio", "tipo", "negocio"] as const;
export const numberFields = ["valorMinimo", "valorMaximo", "suitesMinimas", "quartosMinimos", "vagasMinimas", "areaMinima", "areaMaxima"] as const;
export const filterFields = [...textFields, ...numberFields];
export type Vocabulary = { bairro: string[]; condominio: string[]; tipo: string[] };
export function normalizeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}
export function resolveName(value: string, names: string[]) {
  const key = normalizeName(value);
  const exact = names.find((name) => normalizeName(name) === key);
  if (exact) return exact;
  const withoutPrefix = (name: string) => normalizeName(name).replace(/^(condominio|residencial|edificio) /, "");
  const matches = names.filter((name) => withoutPrefix(name) === withoutPrefix(value));
  return matches.length === 1 ? matches[0] : null;
}
export function sanitizeState(value: unknown, vocabulary?: Vocabulary): ImovelSearchFilters {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const state: Record<string, string | number | null> = {};
  for (const field of textFields) {
    const raw = input[field];
    state[field] = typeof raw === "string" && raw.length <= 160 ? raw.trim() || null : null;
    if (field === "negocio") state[field] = raw === "Alugar" ? "Alugar" : "Comprar";
    else if (vocabulary && typeof state[field] === "string") state[field] = resolveName(state[field] as string, vocabulary[field]);
  }
  for (const field of numberFields) {
    const raw = input[field];
    const integer = ["suitesMinimas", "quartosMinimos", "vagasMinimas"].includes(field);
    state[field] = typeof raw === "number" && Number.isFinite(raw) && raw >= 0 && raw <= (integer ? 100 : 1e10) && (!integer || Number.isInteger(raw)) ? raw : null;
  }
  return state as ImovelSearchFilters;
}
export function applyChanges(current: unknown, result: unknown, vocabulary: Vocabulary) {
  if (!result || typeof result !== "object") throw new Error("invalid_output");
  const data = result as Record<string, unknown>;
  if (typeof data.reiniciar !== "boolean" || !Array.isArray(data.alteracoes) || data.alteracoes.length > 22 || !Array.isArray(data.naoInterpretado)) throw new Error("invalid_output");
  const state = sanitizeState(data.reiniciar ? {} : current, vocabulary);
  const notice = data.naoInterpretado.filter((v): v is string => typeof v === "string").slice(0, 8).map(v => v.slice(0, 100));
  for (const change of data.alteracoes) {
    if (!change || typeof change !== "object") continue;
    const { campo, acao, texto, numero } = change;
    if (!filterFields.includes(campo)) continue;
    if (acao === "remover") {
      Object.assign(state, { [campo]: campo === "negocio" ? "Comprar" : null });
    } else if (acao === "definir") {
      if (textFields.includes(campo)) {
        if (typeof texto !== "string" || texto.length > 160) continue;
        const resolved = campo === "negocio" ? (["Comprar", "Alugar"].includes(texto) ? texto : null) : resolveName(texto, vocabulary[campo as keyof Vocabulary]);
        if (resolved) Object.assign(state, { [campo]: resolved });
        else notice.push(texto.slice(0, 100));
      } else {
        const checked = sanitizeState({ [campo]: numero });
        if (checked[campo as keyof ImovelSearchFilters] !== null) Object.assign(state, { [campo]: checked[campo as keyof ImovelSearchFilters] });
      }
    }
  }
  for (const [min, max] of [["valorMinimo", "valorMaximo"], ["areaMinima", "areaMaxima"]] as const) {
    if (state[min] != null && state[max] != null && state[min]! > state[max]!) throw new Error("invalid_range");
  }
  return { filters: state, naoInterpretado: [...new Set(notice)].slice(0, 8) };
}
