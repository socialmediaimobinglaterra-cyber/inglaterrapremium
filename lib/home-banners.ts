export type HomeBanner = {
  id: string;
  image: string;
  alt: string;
  href: string | null;
  width: number;
  height: number;
};

export function bannerLink(value?: string): string | null {
  const link = value?.trim();
  if (!link || /[\\\s]/.test(link)) return null;
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  try {
    const url = new URL(link);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}
