import { getPool } from "@/lib/db";

export type AnalyticsEventType =
  | "visualizacao_imovel"
  | "busca_realizada"
  | "busca_sem_resultado"
  | "clique_contato"
  | "clique_whatsapp"
  | "busca_ia_usada";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

const ALLOWED_EVENTS = new Set<AnalyticsEventType>([
  "visualizacao_imovel",
  "busca_realizada",
  "busca_sem_resultado",
  "clique_contato",
  "clique_whatsapp",
  "busca_ia_usada",
]);

export function isAnalyticsEventType(value: unknown): value is AnalyticsEventType {
  return typeof value === "string" && ALLOWED_EVENTS.has(value as AnalyticsEventType);
}

export function sanitizeAnalyticsText(value: string, maxLength = 500) {
  return value
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email_removido]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[numero_removido]")
    .trim()
    .slice(0, maxLength);
}

function cleanPayload(payload: AnalyticsPayload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== "")
  );
}

export async function recordAnalyticsEvent({
  tipoEvento,
  imovelId = null,
  payload = {},
}: {
  tipoEvento: AnalyticsEventType;
  imovelId?: string | null;
  payload?: AnalyticsPayload;
}) {
  try {
    await getPool().query(
      `
        insert into eventos_analytics (tipo_evento, imovel_id, payload)
        values ($1, $2, $3::jsonb)
      `,
      [tipoEvento, imovelId, JSON.stringify(cleanPayload(payload))]
    );
  } catch (error) {
    console.error("Falha ao gravar evento de analytics", error);
  }
}
