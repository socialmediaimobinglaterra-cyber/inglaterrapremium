import { conversationResults } from "@/lib/crm-conversation";
import { canAccessCrmPreview } from "@/lib/crm-preview-access";

export async function POST(request: Request) {
  if (!await canAccessCrmPreview(request)) return new Response(null, { status: 404 });
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("invalid_input");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 8192) { await reader.cancel(); throw new Error("invalid_input"); }
      chunks.push(value);
    }
    const result = await conversationResults(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, message: "Não foi possível consultar o CRM. Seus resultados foram mantidos." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
