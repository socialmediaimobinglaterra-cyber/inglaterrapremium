const textFields = new Set(["bairro", "cidade", "tipo", "condominio"]);
const decimalFields = new Set(["valorMinimo", "valorMaximo", "areaMinima", "areaMaxima"]);
const countFields = new Set(["quartosMinimos", "suitesMinimas", "vagasMinimas"]);
const ordering = new Set(["relevancia", "menor_valor", "maior_valor", "mais_recentes"]);

export class CrmSearchInputError extends Error {}

function scaledDecimal(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(1000000) + BigInt(fraction.padEnd(6, "0"));
}

export function parseCrmSearch(input: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(input)) {
    if (!textFields.has(key) && !decimalFields.has(key) && !countFields.has(key) && !["negocio", "order", "page"].includes(key)) {
      throw new CrmSearchInputError("Filtro desconhecido.");
    }
    if (Array.isArray(raw)) throw new CrmSearchInputError("Um filtro foi informado mais de uma vez.");
    const value = raw?.trim();
    if (!value) continue;
    const valid = textFields.has(key) ? value.length <= 120
      : decimalFields.has(key) ? /^(?:0|[1-9]\d{0,14})(?:\.\d{1,6})?$/.test(value)
      : countFields.has(key) ? /^(?:0|[1-9]\d{0,3})$/.test(value) && Number(value) <= 1000
      : key === "negocio" ? ["Comprar", "Alugar"].includes(value)
      : key === "order" ? ordering.has(value)
      : /^[1-9]\d{0,4}$/.test(value) && Number(value) <= 10000;
    if (!valid) throw new CrmSearchInputError("Revise os valores dos filtros. Use números positivos e ponto para decimais.");
    params.set(key, value);
  }
  if (params.has("valorMinimo") && params.has("valorMaximo") && scaledDecimal(params.get("valorMinimo")!) > scaledDecimal(params.get("valorMaximo")!)) {
    throw new CrmSearchInputError("O valor mínimo não pode superar o máximo.");
  }
  if (params.has("areaMinima") && params.has("areaMaxima") && scaledDecimal(params.get("areaMinima")!) > scaledDecimal(params.get("areaMaxima")!)) {
    throw new CrmSearchInputError("A área mínima não pode superar a máxima.");
  }
  params.set("negocio", params.get("negocio") ?? "Comprar");
  params.set("order", params.get("order") ?? "relevancia");
  params.set("page", params.get("page") ?? "1");
  params.set("perPage", "24");
  if (params.toString().length > 2048) throw new CrmSearchInputError("Filtros muito extensos.");
  return params;
}

export function crmSearchPageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.delete("perPage");
  next.set("page", String(page));
  return `/preview/crm/imoveis?${next}`;
}
