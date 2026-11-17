import { contactSettings } from "./contact-settings";

export const SITE_FALLBACK_URL = "https://inglaterrapremium-eta.vercel.app";

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    SITE_FALLBACK_URL;

  const withProtocol = configuredUrl.startsWith("http")
    ? configuredUrl
    : `https://${configuredUrl}`;

  return withProtocol.replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export const organization = {
  name: "Inglaterra Premium",
  legalName: "Grupo Inglaterra",
  email: "central@imobiliariainglaterra.com.br",
  telephone: contactSettings.phoneInternational,
  creci: "CRECI-PR J3748",
  address: {
    streetAddress: "Rod. Mabio Gonçalves Palhano, 1003 - Loja 02 - Palhano 2",
    addressLocality: "Londrina",
    addressRegion: "PR",
    postalCode: "86055-585",
    addressCountry: "BR",
  },
};
