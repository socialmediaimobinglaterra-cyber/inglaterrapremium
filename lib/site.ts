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
  telephone: "+554333433010",
  creci: "CRECI-PR 12.345",
  address: {
    streetAddress: "Av. Duque de Caxias, 1726",
    addressLocality: "Londrina",
    addressRegion: "PR",
    postalCode: "",
    addressCountry: "BR",
  },
};
