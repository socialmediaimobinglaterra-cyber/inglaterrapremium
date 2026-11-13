import { productionEffectsAllowed } from "@/lib/runtime-policy";
import { get } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentAdminUser } from "@/lib/admin/auth";
import { validPrivateBlobUrl, blobResponseHeaders } from "@/lib/blob-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const denyHeaders = { "Cache-Control": "private, no-store", "Vary": "Cookie" };

export async function GET(request: NextRequest) {
  if (!productionEffectsAllowed()) return new NextResponse(null, { status: 403, headers: denyHeaders });
  const blobUrl = request.nextUrl.searchParams.get("url");
  if (!blobUrl || !validPrivateBlobUrl(blobUrl)) return new NextResponse("Arquivo inválido.", { status: 400, headers: denyHeaders });
  try {
    // Only exact persisted URLs of active banners are public. Never trust a path prefix alone.
    const published = await getPool().query("select 1 from home_banners where imagem = $1 and ativo = true limit 1", [blobUrl]);
    const isPublic = published.rows.length > 0;
    if (!isPublic) {
      const admin = await getCurrentAdminUser();
      if (!admin || !["admin", "editor"].includes(admin.role)) return new NextResponse(null, { status: 404, headers: denyHeaders });
    }
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return new NextResponse("Arquivo indisponível.", { status: 503, headers: denyHeaders });
    const result = await get(blobUrl, { access: "private", token });
    if (!result) return new NextResponse(null, { status: 404, headers: denyHeaders });
    if (result.statusCode !== 200 || !result.stream) return new NextResponse(null, { status: result.statusCode, headers: denyHeaders });
    return new NextResponse(result.stream, { headers: blobResponseHeaders(result.blob.contentType) });
  } catch {
    console.error("blob_delivery_unavailable");
    return new NextResponse("Arquivo indisponível.", { status: 502, headers: denyHeaders });
  }
}
