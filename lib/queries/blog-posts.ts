import { unstable_cache } from "next/cache";
import { BLOG_POSTS_URL, parseBlogPosts } from "@/lib/blog-posts";

const readBlogPosts = unstable_cache(async () => {
  const response = await fetch(BLOG_POSTS_URL, {
    headers: { Accept: "application/json" }, cache: "no-store",
    signal: AbortSignal.timeout(3500), redirect: "error",
  });
  if (!response.ok) throw new Error("blog_http_error");
  return parseBlogPosts(await response.json());
}, ["public-blog-posts-v1"], { revalidate: 900 });

export async function getBlogPosts() {
  try { return await readBlogPosts(); }
  catch {
    console.warn("public_blog_unavailable");
    return [];
  }
}
