import { NextResponse } from "next/server";
import { parseNewsletter } from "@/lib/newsletter";
import { subscribeNewsletter } from "@/lib/newsletter-store";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const reply = (message: string, status: number) => NextResponse.json({ ok: false, message }, { status, headers: { "Cache-Control": "no-store" } });
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply("Origem não permitida.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply("Formato inválido.", 415);
  const apiKey = process.env.RD_STATION_API_KEY;
  if (!apiKey || !process.env.DATABASE_URL) return reply("Cadastro indisponível no momento. Tente novamente mais tarde.", 503);
  const reader = request.body?.getReader();
  if (!reader) return reply("Informe seu e-mail.", 400);
  let lead;
  try {
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2048) { await reader.cancel(); return reply("Solicitação muito grande.", 413); }
      chunks.push(value);
    }
    lead = parseNewsletter(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch (error) {
    return reply(error instanceof SyntaxError ? "Formato inválido." : error instanceof Error ? error.message : "Revise seus dados.", 400);
  }
  try {
    const result = await subscribeNewsletter(request, lead.email, apiKey);
    return NextResponse.json({ ok: result.status === 200, pending: result.status === 202, message: result.message }, {
      status: result.status, headers: { "Cache-Control": "no-store", ...(result.retry ? { "Retry-After": String(result.retry) } : {}) },
    });
  } catch {
    console.error("newsletter_unavailable");
    return reply("Não foi possível confirmar o cadastro. Aguarde e tente novamente.", 503);
  }
}
