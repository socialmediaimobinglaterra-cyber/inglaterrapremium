import { deliverRdContact } from "./rd-contact-store";
import type { LeadAttribution } from "./lead-attribution";
import { NEWSLETTER_CONSENT, NEWSLETTER_CONSENT_VERSION, newsletterPayload } from "./newsletter";

export async function subscribeNewsletter(request: Request, email: string, apiKey: string, attribution?: LeadAttribution) {
  const result = await deliverRdContact(request, {
    fingerprint: `${NEWSLETTER_CONSENT_VERSION}:${email}`,
    consentVersion: NEWSLETTER_CONSENT_VERSION, consent: NEWSLETTER_CONSENT,
    payload: newsletterPayload(email, attribution),
  }, apiKey);
  return result.status === 200 ? { ...result, message: "Cadastro realizado. Obrigado por assinar nossa newsletter." } : result;
}
