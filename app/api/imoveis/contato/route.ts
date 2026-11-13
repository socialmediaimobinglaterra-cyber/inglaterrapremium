import { productionEffectsAllowed } from "@/lib/runtime-policy";
import { NextResponse } from "next/server";
import { INQUIRY_CONSENT, INQUIRY_CONSENT_VERSION, parsePropertyInquiry, propertyInquiryPayload } from "@/lib/property-inquiry";
import { deliverRdContact } from "@/lib/rd-contact-store";
import { getImovelBySlug } from "@/lib/queries/imoveis";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!productionEffectsAllowed()) return NextResponse.json({ ok: false, message: "Recurso indisponível neste ambiente de testes." }, { status: 503 });
  const reply = (message: string, status: number) => NextResponse.json({ ok: false, message }, { status, headers: { "Cache-Control": "no-store" } });
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply("Origem não permitida.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply("Formato inválido.", 415);
  const apiKey = process.env.RD_STATION_API_KEY;
  if (!apiKey || !process.env.DATABASE_URL) return reply("Cadastro indisponível no momento. Você pode continuar pelo WhatsApp.", 503);
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
      if (size > 12288) { await reader.cancel(); return reply("Solicitação muito grande.", 413); }
      chunks.push(value);
    }
    lead = parsePropertyInquiry(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch (error) {
    return reply(error instanceof SyntaxError ? "Formato inválido." : error instanceof Error ? error.message : "Revise seus dados.", 400);
  }
  try {
    const property = await getImovelBySlug(lead.slug);
    if (!property) return reply("Imóvel indisponível para cadastro.", 404);
    const result = await deliverRdContact(request, {
      fingerprint: JSON.stringify([INQUIRY_CONSENT_VERSION, lead.email, lead.phone, property.id, lead.foco]),
      consentVersion: INQUIRY_CONSENT_VERSION, consent: INQUIRY_CONSENT,
      payload: propertyInquiryPayload(lead, property),
    }, apiKey);
    return NextResponse.json({ ok: result.status === 200, pending: result.status === 202, message: result.message }, {
      status: result.status, headers: { "Cache-Control": "no-store", ...(result.retry ? { "Retry-After": String(result.retry) } : {}) },
    });
  } catch {
    console.error("property_inquiry_unavailable");
    return reply("Não foi possível confirmar o cadastro. Você pode continuar pelo WhatsApp.", 503);
  }
}
