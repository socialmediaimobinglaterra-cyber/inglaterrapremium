import { NextResponse } from "next/server";
import { parseSavedSearch } from "@/lib/saved-search";
import { deliverSavedSearch } from "@/lib/saved-search-store";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const reply = (message: string, status: number) => NextResponse.json({ ok: false, message }, { status });
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply("Origem não permitida.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply("Formato inválido.", 415);
  const central = process.env.CENTRAL_INTEGRATION_TOKEN;
  const rd = process.env.RD_STATION_API_KEY;
  if (!central || !rd) return reply("Salva busca indisponível no momento. Tente novamente mais tarde.", 503);
  const reader = request.body?.getReader();
  if (!reader) return reply("Informe seus dados.", 400);
  let lead;
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 8192) { await reader.cancel(); return reply("Solicitação muito grande.", 413); }
      chunks.push(value);
    }
    lead = parseSavedSearch(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch (error) {
    return reply(error instanceof SyntaxError ? "Formato inválido." : error instanceof Error ? error.message : "Revise seus dados.", 400);
  }
  try {
    const result = await deliverSavedSearch(request, lead, { central, rd });
    return NextResponse.json({ ok: result.status === 200, pending: result.status === 202, terminal: result.status === 422, message: result.message, reference: result.reference }, {
      status: result.status, headers: { "Cache-Control": "no-store", ...(result.retry ? { "Retry-After": String(result.retry) } : {}) },
    });
  } catch {
    console.error("saved_search_unavailable");
    return reply("Não foi possível confirmar o envio. Aguarde e tente novamente.", 503);
  }
}
