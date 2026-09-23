import { NextResponse } from "next/server";
import { getPropertyMapData } from "@/lib/queries/property-map";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const negocio = new URL(request.url).searchParams.get("negocio") === "Alugar" ? "Alugar" : "Comprar";
  try {
    return NextResponse.json(await getPropertyMapData(negocio), { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Nao foi possivel carregar as localizacoes do mapa.");
    return NextResponse.json({ error: "map_unavailable" }, { status: 503 });
  }
}
