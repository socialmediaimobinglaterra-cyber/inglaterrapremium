export type LeadAttribution = {
  traffic_source?: string;
  traffic_medium?: string;
  traffic_campaign?: string;
};

// Only campaign labels, never full URLs, search phrases, emails or click IDs.
function label(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  return text.length > 0 && text.length <= 120 && /^[\p{L}\p{N} ._()\-]+$/u.test(text) ? text : undefined;
}

export function parseAttribution(value: unknown): LeadAttribution {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const fields = value as Record<string, unknown>;
  const source = label(fields.traffic_source);
  if (!source) return {};
  const medium = label(fields.traffic_medium);
  const campaign = label(fields.traffic_campaign);
  return {
    traffic_source: source,
    ...(medium ? { traffic_medium: medium } : {}),
    ...(campaign ? { traffic_campaign: campaign } : {}),
  };
}

export function attributionFromVisit(href: string, referrer: string): LeadAttribution {
  try {
    const url = new URL(href);
    const campaign = parseAttribution({
      traffic_source: url.searchParams.get("utm_source"),
      traffic_medium: url.searchParams.get("utm_medium"),
      traffic_campaign: url.searchParams.get("utm_campaign"),
    });
    if (campaign.traffic_source) return campaign;
    if (!referrer) return { traffic_source: "(direct)", traffic_medium: "(none)" };
    const referring = new URL(referrer);
    if (!["http:", "https:"].includes(referring.protocol) || referring.origin === url.origin) return {};
    return parseAttribution({ traffic_source: referring.hostname, traffic_medium: "referral" });
  } catch { return {}; }
}

let initialVisit: LeadAttribution | undefined;

export function getVisitAttribution(): LeadAttribution {
  if (typeof window === "undefined") return {};
  // Memory only: retained across client navigation, no cookies/localStorage.
  initialVisit ??= attributionFromVisit(window.location.href, document.referrer);
  return initialVisit;
}
