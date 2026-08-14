import { NextResponse } from "next/server";
import { searchImoveis, type ImovelSearchFilters } from "@/lib/queries/imoveis";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const filters = (await request.json()) as ImovelSearchFilters;
    const imoveis = await searchImoveis(filters);

    return NextResponse.json({ ok: true, imoveis });
  } catch (error) {
    console.error("Erro ao buscar imóveis", error);
    return NextResponse.json({ ok: false, imoveis: [] }, { status: 200 });
  }
}
