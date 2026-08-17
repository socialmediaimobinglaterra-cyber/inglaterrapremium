import { get } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

function isAllowedBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname.endsWith(".blob.vercel-storage.com") ||
        url.hostname === "blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const blobUrl = request.nextUrl.searchParams.get("url");
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!blobUrl || !isAllowedBlobUrl(blobUrl)) {
    return new NextResponse("Imagem inválida.", { status: 400 });
  }

  if (!token) {
    return new NextResponse("BLOB_READ_WRITE_TOKEN não configurado.", {
      status: 500,
    });
  }

  try {
    const result = await get(blobUrl, { access: "private", token });

    if (!result) {
      return new NextResponse("Imagem não encontrada.", { status: 404 });
    }

    if (result.statusCode !== 200 || !result.stream) {
      return new NextResponse(null, { status: result.statusCode });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": result.blob.contentType,
      },
    });
  } catch (error) {
    console.error("Erro ao servir imagem privada do Blob", error);
    return new NextResponse("Imagem indisponível.", { status: 502 });
  }
}
