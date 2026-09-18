// Server-side integration boundary. No dependency on the legacy catalog/database.
const ORIGIN = "https://admin.inglaterrapremium.com.br";
const CODE = /^[A-Z]{2}\d{4,12}$/;
const MAX_BYTES = 5 * 1024 * 1024;

export class CrmCatalogError extends Error {
  constructor(public readonly reason: "input" | "unavailable" | "rate_limit" | "invalid_response") {
    super(`CRM_CATALOG_${reason.toUpperCase()}`);
  }
}

function invalid(): never { throw new CrmCatalogError("invalid_response"); }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 5000) return invalid();
  return value;
}
function nullableText(value: unknown) { return value === null ? null : text(value); }
function decimal(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) || /^0(?:\.0+)?$/.test(value)) return invalid();
  return value;
}
function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) return invalid();
  return value;
}
function quantity(value: unknown) { return value === null ? null : integer(value); }
function boolean(value: unknown): boolean { if (typeof value !== "boolean") return invalid(); return value; }
function array(value: unknown): unknown[] { if (!Array.isArray(value)) return invalid(); return value; }

// Explicit projection: extra upstream keys never reach a page or browser DTO.
export function parseCrmProperty(value: unknown) {
  const item = record(value);
  const publicCode = text(item.publicCode);
  if (!CODE.test(publicCode) || item.unit !== "premium") return invalid();
  const prices = record(item.prices), areas = record(item.areas), rooms = record(item.rooms);
  const location = record(item.location), taxonomy = record(item.taxonomy);
  const sale = decimal(prices.sale), rent = decimal(prices.rent);
  const negotiation = sale ? (rent ? "venda_locacao" : "venda") : rent ? "locacao" : null;
  if (!negotiation || negotiation !== item.negotiation) return invalid();
  const state = text(location.state);
  if (!"AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ").includes(state)) return invalid();
  const unit = areas.unit;
  if (unit !== null && unit !== "m2" && unit !== "ha") return invalid();
  const media = array(item.media).map(value => {
    const image = record(value);
    if (image.kind !== "photo") return invalid();
    const url = text(image.url);
    if (!new RegExp(`^${ORIGIN.replaceAll(".", "\\.")}/api/blob-image/public/premium/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`, "i").test(url)) return invalid();
    return { kind: "photo" as const, url, order: integer(image.order), isPrimary: boolean(image.isPrimary) };
  });
  if (media.filter(image => image.isPrimary).length > 1 || media.some((image, index) => index > 0 && image.order <= media[index - 1].order)) return invalid();
  return {
    publicCode, unit: "premium" as const, negotiation,
    title: text(item.title), description: nullableText(item.description), usageCategory: nullableText(item.usageCategory),
    prices: { sale, rent, condominium: decimal(prices.condominium), iptu: decimal(prices.iptu) },
    taxonomy: { normalizedType: text(taxonomy.normalizedType), normalizedSubtype: nullableText(taxonomy.normalizedSubtype) },
    location: { officialNeighborhood: text(location.officialNeighborhood), neighborhoodAlias: nullableText(location.neighborhoodAlias), city: text(location.city), state },
    areas: { unit, total: decimal(areas.total), usable: decimal(areas.usable), private: decimal(areas.private) },
    rooms: { bedrooms: quantity(rooms.bedrooms), suites: quantity(rooms.suites), bathrooms: quantity(rooms.bathrooms), livingRooms: quantity(rooms.livingRooms), parkingSpaces: quantity(rooms.parkingSpaces) },
    media,
  };
}
export type CrmProperty = ReturnType<typeof parseCrmProperty>;

export function createCrmCatalogClient(fetcher: typeof fetch = fetch, apiOrigin = ORIGIN) {
  if (apiOrigin !== ORIGIN && !(apiOrigin === "http://127.0.0.1:3005" && process.env.NODE_ENV === "development" && !process.env.VERCEL && !process.env.VERCEL_ENV)) throw new CrmCatalogError("input");
  const root = `${apiOrigin}/api/catalog/premium`;
  async function read(path: string, allowMissing = false): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetcher(`${root}/${path}`, { method: "GET", cache: "no-store", redirect: "error", signal: controller.signal });
      if (response.status !== 200) {
        await response.body?.cancel();
        if (response.status === 404 && allowMissing) return null;
        throw new CrmCatalogError(response.status === 429 ? "rate_limit" : "unavailable");
      }
      if (!response.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
        await response.body?.cancel(); return invalid();
      }
      const reader = response.body?.getReader();
      if (!reader) return invalid();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > MAX_BYTES) { await reader.cancel(); return invalid(); }
          chunks.push(chunk.value);
        }
      } finally { reader.releaseLock(); }
      try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; }
      catch { return invalid(); }
    } catch (error) {
      if (error instanceof CrmCatalogError) throw error;
      throw new CrmCatalogError("unavailable");
    } finally { clearTimeout(timeout); }
  }
  return {
    async detail(code: string) {
      if (!CODE.test(code)) throw new CrmCatalogError("input");
      const raw = await read(`properties/${code}`, true);
      if (raw === null) return null;
      const item = parseCrmProperty(raw);
      if (item.publicCode !== code) return invalid();
      return item;
    },
    async list(params: URLSearchParams = new URLSearchParams()) {
      const allowed = new Set(["bairro", "cidade", "tipo", "condominio", "negocio", "valorMinimo", "valorMaximo", "suitesMinimas", "vagasMinimas", "quartosMinimos", "areaMinima", "areaMaxima", "order", "page", "perPage"]);
      for (const key of params.keys()) if (!allowed.has(key) || params.getAll(key).length !== 1) throw new CrmCatalogError("input");
      if (params.toString().length > 2048) throw new CrmCatalogError("input");
      const page = record(await read(`properties?${params}`));
      const items = array(page.items).map(parseCrmProperty);
      const total = integer(page.total), current = integer(page.page), perPage = integer(page.perPage);
      const hasMore = boolean(page.hasMore);
      if (!current || !perPage || perPage > 48 || items.length > perPage || total < items.length || new Set(items.map(item => item.publicCode)).size !== items.length) return invalid();
      return { items, total, page: current, perPage, hasMore };
    },
    async filters() {
      const response = record(await read("filters"));
      return array(response.items).map(value => {
        const row = record(value);
        return { bairro: text(row.bairro), cidade: text(row.cidade), estado: text(row.estado), tipo: text(row.tipo), condominio: row.condominio === undefined ? null : nullableText(row.condominio) };
      });
    },
  };
}
