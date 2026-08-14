import { NextResponse } from "next/server";

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
    valorMinimo: {
      type: ["number", "null"],
      minimum: 0,
    },
    valorMaximo: {
      type: ["number", "null"],
      minimum: 0,
    },
  },
  required: ["bairro", "tipo", "negocio", "suitesMinimas", "valorMinimo", "valorMaximo"],
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
              "Extraia filtros imobiliários para Londrina. Valores em milhões devem ser convertidos para reais. Quando o usuário disser 'até', use valorMaximo. Quando disser 'a partir de', use valorMinimo. Se não houver informação clara, retorne null.",
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

    return NextResponse.json({ ok: Boolean(filters), filters }, { status: 200 });
  } catch (error) {
    console.error("Falha na busca por linguagem natural", error);
    return NextResponse.json({ ok: false, filters: null }, { status: 200 });
  }
}
