import { POST as interpret } from "@/app/api/imoveis/ai/route";
import { canAccessCrmPreview } from "@/lib/crm-preview-access";

export async function POST(request: Request) {
  if (!await canAccessCrmPreview(request)) return new Response(null, { status: 404 });
  return interpret(request);
}
