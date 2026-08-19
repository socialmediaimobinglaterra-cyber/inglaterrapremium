import { NextResponse } from "next/server";
import { organization } from "@/lib/site";

export const runtime = "nodejs";

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const perfil = textValue(formData, "perfil");
  const nome = textValue(formData, "nome");
  const empresa = textValue(formData, "empresa");
  const whatsapp = textValue(formData, "whatsapp");
  const email = textValue(formData, "email");
  const mensagem = textValue(formData, "mensagem");

  if (!perfil || !nome || !whatsapp) {
    return NextResponse.json(
      { ok: false, message: "Informe perfil, nome e WhatsApp para enviar." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, message: "Envio indisponível no momento." },
      { status: 503 }
    );
  }

  const from =
    process.env.ADMIN_EMAIL_FROM ??
    "Inglaterra Premium <onboarding@resend.dev>";
  const to = process.env.BTS_CONTACT_TO ?? organization.email;
  const subject = `Contato Inglaterra BTS - ${perfil}`;
  const plainText = [
    "Novo contato recebido pela página Inglaterra BTS.",
    "",
    `Perfil: ${perfil}`,
    `Nome: ${nome}`,
    empresa ? `Empresa: ${empresa}` : null,
    `WhatsApp: ${whatsapp}`,
    email ? `E-mail: ${email}` : null,
    mensagem ? `Mensagem: ${mensagem}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const rows = [
    ["Perfil", perfil],
    ["Nome", nome],
    ["Empresa", empresa],
    ["WhatsApp", whatsapp],
    ["E-mail", email],
    ["Mensagem", mensagem],
  ].filter(([, value]) => value);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text: plainText,
        html: `
          <div style="font-family: Arial, sans-serif; color: #101a26;">
            <h1 style="font-size: 20px;">Novo contato Inglaterra BTS</h1>
            <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
              ${rows
                .map(
                  ([label, value]) => `
                    <tr>
                      <td style="border: 1px solid #eee; font-weight: 700;">${escapeHtml(label)}</td>
                      <td style="border: 1px solid #eee;">${escapeHtml(value)}</td>
                    </tr>
                  `
                )
                .join("")}
            </table>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Falha ao enviar contato BTS pelo Resend:", body);
      return NextResponse.json(
        { ok: false, message: "Não foi possível enviar sua mensagem agora." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Mensagem enviada. Nossa equipe entrará em contato.",
    });
  } catch (error) {
    console.error("Erro inesperado no contato BTS:", error);
    return NextResponse.json(
      { ok: false, message: "Não foi possível enviar sua mensagem agora." },
      { status: 502 }
    );
  }
}
