import { after, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { searchImoveis, type ImovelSearchFilters } from "@/lib/queries/imoveis";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const filters = (await request.json()) as ImovelSearchFilters;
    const imoveis = await searchImoveis(filters);

    const payload = {
      bairro: filters.bairro,
      tipo: filters.tipo,
      valor_min: filters.valorMinimo,
      valor_max: filters.valorMaximo,
      termo_livre: null,
    };

    after(() => recordAnalyticsEvent({ tipoEvento: "busca_realizada", payload }));

    if (imoveis.length === 0) {
      after(() => recordAnalyticsEvent({ tipoEvento: "busca_sem_resultado", payload }));
    }

    return NextResponse.json({ ok: true, imoveis });
  } catch (error) {
    console.error("Erro ao buscar imóveis", error);
    return NextResponse.json({ ok: false, imoveis: [] }, { status: 200 });
  }
}
