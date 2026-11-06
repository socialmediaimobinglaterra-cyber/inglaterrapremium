export const BLOG_URL = "https://vmi.imobiliariainglaterra.com.br/";
export const BLOG_POSTS_URL = `${BLOG_URL}api/public/posts?limit=3&offset=0`;
export const BLOG_IMAGE_HOST = "bogqsbvhkujfhpgaievc.supabase.co";

export type BlogPost = {
  title: string;
  excerpt: string;
  image: string | null;
  category: string | null;
  publishedAt: string;
  href: string;
};

export function parseBlogPosts(payload: unknown, now = Date.now()): BlogPost[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { posts?: unknown }).posts)) throw new Error("invalid_blog_response");
  const seen = new Set<string>();
  const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
  return (payload as { posts: unknown[] }).posts.slice(0, 100).flatMap((item): BlogPost[] => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const title = text(row.titulo, 300);
    const published = Date.parse(text(row.data, 64));
    if (!title || !Number.isFinite(published) || published > now) return [];
    let href: string;
    try {
      const url = new URL(text(row.link, 2000));
      if (url.origin !== new URL(BLOG_URL).origin || url.username || url.password || url.pathname === "/") return [];
      url.hash = "";
      href = url.href;
      if (seen.has(href)) return [];
      seen.add(href);
    } catch { return []; }
    let image: string | null = null;
    try {
      const url = new URL(text(row.capa, 2000));
      if (url.protocol === "https:" && url.hostname === BLOG_IMAGE_HOST && !url.port && !url.username && !url.password && url.pathname.startsWith("/storage/v1/object/public/post-images/")) image = url.href;
    } catch { /* A missing cover does not invent a replacement image. */ }
    return [{ title, excerpt: text(row.resumo, 500), image, category: text(row.categoria, 100) || null, publishedAt: new Date(published).toISOString(), href }];
  }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 3);
}
