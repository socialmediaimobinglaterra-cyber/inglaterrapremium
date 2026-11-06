import { brazilianPhone } from "./property-contact";

export const INQUIRY_CONSENT_VERSION = "contato-imovel-v2";
export const INQUIRY_CONSENT = "Autorizo a Inglaterra Premium a utilizar meus dados para entrar em contato comigo sobre minha solicitação, conforme a Política de Privacidade.";

export function parsePropertyInquiry(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Informe seus dados.");
  const body = value as Record<string, unknown>;
  const text = (key: string) => typeof body[key] === "string" ? body[key].trim() : "";
  const name = text("name"), email = text("email").toLowerCase(), phoneText = text("phone"), message = text("message"), slug = text("slug");
  const phone = phoneText.length <= 30 ? brazilianPhone(phoneText) : null;
  if (name.length < 2 || name.length > 120 || /[\x00-\x1f\x7f]/.test(name)) throw new Error("Informe seu nome (até 120 caracteres).");
  if (email.length > 254 || /[\x00-\x1f\x7f]/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail válido.");
  if (!phone) throw new Error("Informe um WhatsApp válido com DDD.");
  if (!message || message.length > 2000) throw new Error("Informe uma mensagem de até 2000 caracteres.");
  if (!slug || slug.length > 200 || !/^[a-zA-Z0-9_-]+$/.test(slug)) throw new Error("Não foi possível identificar o imóvel.");
  if (body.consent !== true) throw new Error("Autorize o cadastro e contato para continuar.");
  const foco = body.foco === "locacao" || body.foco === "venda" ? body.foco : null;
  return { name, email, phone: `+${phone}`, message, slug, foco };
}

export function propertyInquiryPayload(lead: ReturnType<typeof parsePropertyInquiry>, property: { codigo: string | null; slug: string; titulo: string }) {
  return {
    event_type: "CONVERSION", event_family: "CDP",
    payload: {
      conversion_identifier: "inglaterra-premium-contato-imovel",
      name: lead.name, email: lead.email, mobile_phone: lead.phone,
      tags: ["inglaterra-premium", "contato-imovel", `imovel:${property.codigo || property.slug}`, ...(lead.foco ? [`finalidade:${lead.foco}`] : [])],
      legal_bases: [{ category: "communications", type: "consent", status: "granted" }],
    },
  };
}
