import { after, NextResponse } from "next/server";
import { isAnalyticsEventType, recordAnalyticsEvent } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      tipoEvento?: unknown;
      imovelId?: unknown;
      canal?: unknown;
    };

    if (!isAnalyticsEventType(body.tipoEvento)) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    if (body.tipoEvento !== "clique_contato" && body.tipoEvento !== "clique_whatsapp") {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const tipoEvento = body.tipoEvento;

    after(() =>
      recordAnalyticsEvent({
        tipoEvento,
        imovelId: typeof body.imovelId === "string" ? body.imovelId : null,
        payload: {
          canal: typeof body.canal === "string" ? body.canal : null,
        },
      })
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Falha ao receber evento de analytics", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
