import { after, NextResponse } from "next/server";
import { recordAnalyticsEvent, sanitizeAnalyticsText } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    bairro: {
      type: ["string", "null"],
      enum: [
        "Terra Bonita",
        "Gleba Palhano",
        "Aurora",
        "Bela Suiça",
        "Nova Prochet",
        "Jardim Higienópolis",
        null,
      ],
    },
    tipo: {
      type: ["string", "null"],
      enum: ["Apartamento", "Casa", "Loja", "Sala", "Terreno", null],
    },
    negocio: {
      type: ["string", "null"],
      enum: ["Comprar", "Alugar", null],
    },
    suitesMinimas: {
      type: ["integer", "null"],
      minimum: 0,
      maximum: 10,
    },
    vagasMinimas: {
      type: ["integer", "null"],
      minimum: 0,
      maximum: 20,
    },
    quartosMinimos: {
      type: ["integer", "null"],
      minimum: 0,
      maximum: 20,
    },
    areaMinima: {
      type: ["number", "null"],
      minimum: 0,
    },
    valorMinimo: {
      type: ["number", "null"],
      minimum: 0,
    },
    valorMaximo: {
      type: ["number", "null"],
      minimum: 0,
    },
    naoInterpretado: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: [
    "bairro",
    "tipo",
    "negocio",
    "suitesMinimas",
    "vagasMinimas",
    "quartosMinimos",
    "areaMinima",
    "valorMinimo",
    "valorMaximo",
    "naoInterpretado",
  ],
} as const;

export async function POST(request: Request) {
  try {
    const { query } = (await request.json()) as { query?: string };

    if (!query?.trim() || !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, filters: null }, { status: 200 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Extraia filtros imobiliários para Londrina. Filtros disponíveis: bairro, tipo, negócio, suítes mínimas, vagas mínimas, quartos/dormitórios mínimos, área mínima em m², valor mínimo e valor máximo. Valores em milhões devem ser convertidos para reais. Quando o usuário disser 'até', use valorMaximo. Quando disser 'a partir de', 'acima de' ou 'mais de', use valorMinimo. Se não houver informação clara para um campo, retorne null. Coloque em naoInterpretado apenas termos relevantes do pedido que não podem ser convertidos para esses filtros disponíveis, como vista para o lago, andar alto, mobiliado, piscina privativa ou frente para rua.",
          },
          { role: "user", content: query },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "filtros_busca_imoveis",
            strict: true,
            schema,
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return NextResponse.json({ ok: false, filters: null }, { status: 200 });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const filters = content ? JSON.parse(content) : null;
    const naoInterpretado = Array.isArray(filters?.naoInterpretado)
      ? filters.naoInterpretado.filter((item: unknown) => typeof item === "string")
      : [];

    if (filters) {
      after(() =>
        recordAnalyticsEvent({
          tipoEvento: "busca_ia_usada",
          payload: {
            bairro: filters.bairro,
            tipo: filters.tipo,
            valor_min: filters.valorMinimo,
            valor_max: filters.valorMaximo,
            vagas_min: filters.vagasMinimas,
            quartos_min: filters.quartosMinimos,
            area_min: filters.areaMinima,
            nao_interpretado: naoInterpretado,
            termo_livre: sanitizeAnalyticsText(query),
          },
        })
      );
    }

    return NextResponse.json({ ok: Boolean(filters), filters, naoInterpretado }, { status: 200 });
  } catch (error) {
    console.error("Falha na busca por linguagem natural", error);
    return NextResponse.json({ ok: false, filters: null }, { status: 200 });
  }
}
