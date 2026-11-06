export type HomeBanner = {
  id: string;
  image: string;
  alt: string;
  href: string | null;
  width: number;
  height: number;
};

export type HomeBannerRow = {
  _id: string;
  titulo?: string;
  textoAlternativo?: string;
  imagemUrl?: string;
  link?: string;
  width?: number;
  height?: number;
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

export function normalizeHomeBanners(rows: HomeBannerRow[]): HomeBanner[] {
  return rows.flatMap((row) => {
    const alt = row.textoAlternativo?.trim() || row.titulo?.trim();
    if (!alt || !row.imagemUrl || !row.width || !row.height || row.width <= 0 || row.height <= 0) return [];
    try {
      const url = new URL(row.imagemUrl);
      if (url.protocol !== "https:" || url.hostname !== "cdn.sanity.io") return [];
    } catch { return []; }
    return [{ id: row._id, image: row.imagemUrl, alt, href: bannerLink(row.link), width: row.width, height: row.height }];
  });
}
