export const NEWSLETTER_CONSENT_VERSION = "newsletter-v1";
export const NEWSLETTER_CONSENT = "Autorizo a Inglaterra Premium a cadastrar meu e-mail no RD Station e enviar a newsletter. Posso cancelar o recebimento a qualquer momento.";

export function parseNewsletter(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Informe seu e-mail.");
  const body = value as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || /[\x00-\x1f\x7f]/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail válido.");
  if (body.consent !== true) throw new Error("Autorize o recebimento da newsletter para continuar.");
  return { email };
}

export function newsletterPayload(email: string) {
  return {
    event_type: "CONVERSION", event_family: "CDP",
    payload: {
      conversion_identifier: "inglaterra-premium-newsletter", email,
      tags: ["inglaterra-premium", "newsletter"],
      legal_bases: [{ category: "communications", type: "consent", status: "granted" }],
    },
  };
}
