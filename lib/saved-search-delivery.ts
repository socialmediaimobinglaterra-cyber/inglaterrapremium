import { SEARCH_CONSENT, SEARCH_CONSENT_VERSION, searchProfile, type SavedSearchLead } from "./saved-search";

export type DeliveryState = "pending" | "sent" | "failed" | "rejected" | "uncertain";
export type Destination = "central" | "rd";

export function leadPayloads(lead: SavedSearchLead, consentAt: string, reference: string) {
  const profile = searchProfile(lead.filters);
  const tags = ["inglaterra-premium", "salva-busca", ...profile.map(item => `busca: ${item}`)];
  return {
    central: {
      name: lead.name, email: lead.email, phone: lead.phone, source: "Inglaterra Premium - Salva busca",
      tags, interest: profile.join("; "),
      notes: [`Salva busca - protocolo ${reference}`, ...profile, `Consentimento: ${consentAt} (${SEARCH_CONSENT_VERSION})`, SEARCH_CONSENT].join("\n"),
    },
    rd: {
      event_type: "CONVERSION", event_family: "CDP",
      payload: {
        conversion_identifier: "inglaterra-premium-salva-busca", name: lead.name, email: lead.email,
        mobile_phone: lead.phone, tags,
        legal_bases: [{ category: "communications", type: "consent", status: "granted" }],
      },
    },
  };
}

export async function sendLead(destination: Destination, payload: unknown, secrets: { central: string; rd: string }, fetcher: typeof fetch = fetch): Promise<DeliveryState> {
  const url = destination === "central"
    ? "https://atendimento.imobiliariainglaterra.com.br/api/public/integrations/inbound"
    : `https://api.rd.services/platform/conversions?api_key=${encodeURIComponent(secrets.rd)}`;
  try {
    const response = await fetcher(url, {
      method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/json", ...(destination === "central" ? { "X-Integration-Token": secrets.central } : {}) },
      body: JSON.stringify(payload),
    });
    // Server errors/timeouts may happen after the destination has created the lead.
    if (!response.ok) return response.status >= 500 ? "uncertain" : response.status === 429 ? "failed" : "rejected";
    const data = await response.json() as Record<string, unknown>;
    if (!data || typeof data !== "object") return "uncertain";
    if (destination === "rd") return typeof data.event_uuid === "string" && data.event_uuid ? "sent" : "uncertain";
    if (data.result === "error" || data.result === "ignored" || data.ok === false || data.error) return "rejected";
    return data.ok === true && (data.result === "created" || data.result === "updated") &&
      typeof data.conversation_id === "string" && data.conversation_id.length > 0 ? "sent" : "uncertain";
  } catch {
    // Never log fetch errors: RD requires its secret in the request URL.
    return "uncertain";
  }
}
