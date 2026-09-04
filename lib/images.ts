export function normalizeImageUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^http:\/\//i, "https://");
}

export function imageUrlOrFallback(value: string | null | undefined, fallback = "/images/capa-hero.jpg") {
  return normalizeImageUrl(value) ?? fallback;
}
