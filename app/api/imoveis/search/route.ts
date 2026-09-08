import { after, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { searchImoveis, type ImovelSearchFilters } from "@/lib/queries/imoveis";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const filters = (await request.json()) as ImovelSearchFilters;
    const page = Number.isFinite(Number((filters as Record<string, unknown>).page))
      ? Number((filters as Record<string, unknown>).page)
      : 1;
    const perPage = Number.isFinite(Number((filters as Record<string, unknown>).perPage))
      ? Number((filters as Record<string, unknown>).perPage)
      : 24;
    const result = await searchImoveis(filters, { page, perPage });

    const payload = {
      bairro: filters.bairro,
      tipo: filters.tipo,
      valor_min: filters.valorMinimo,
      valor_max: filters.valorMaximo,
      vagas_min: filters.vagasMinimas,
      quartos_min: filters.quartosMinimos,
      area_min: filters.areaMinima,
      termo_livre: null,
    };

    after(() => recordAnalyticsEvent({ tipoEvento: "busca_realizada", payload }));

    if (result.total === 0) {
      after(() => recordAnalyticsEvent({ tipoEvento: "busca_sem_resultado", payload }));
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Erro ao buscar imóveis", error);
    return NextResponse.json(
      { ok: false, imoveis: [], total: 0, page: 1, perPage: 24, hasMore: false },
      { status: 200 }
    );
  }
}
