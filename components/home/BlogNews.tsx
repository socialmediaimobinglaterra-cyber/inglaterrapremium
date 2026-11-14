import { BLOG_URL, type BlogPost } from "@/lib/blog-posts";
import { BlogCover } from "./BlogCover";

export function BlogNews({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;
  return <section className="site-container bg-offwhite py-16" aria-labelledby="blog-news-title">
    <div className="mb-8 flex flex-col items-start justify-between gap-3.5 md:flex-row md:items-end md:gap-0">
      <h2 id="blog-news-title" className="text-[clamp(22px,5.5vw,38px)] font-light leading-tight tracking-[0.04em]">
        O mercado de alto padrão<br />de Londrina, em perspectiva
      </h2>
      <a href={BLOG_URL} target="_blank" rel="noopener noreferrer" className="nav-focus border-b border-terra pb-0.5 text-caption uppercase tracking-[0.28em] text-terra">Ver todas as notícias</a>
    </div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-[5px]">
      {posts.map(post => <article key={post.href} className="min-w-0 bg-white">
        <a href={post.href} target="_blank" rel="noopener noreferrer" className="nav-focus group block h-full">
          {post.image ? <BlogCover src={post.image} title={post.title} /> : null}
          <div className="px-[22px] pb-[26px] pt-[22px]">
            <div className="mb-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1">
              {post.category ? <><span className="text-caption uppercase tracking-[0.3em] text-terra">{post.category}</span><span aria-hidden="true" className="text-caption text-navy">·</span></> : null}
              <time className="text-caption text-navy" dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" })}</time>
            </div>
            <h3 className="mb-2.5 break-words text-base leading-snug tracking-[0.02em] decoration-navy/30 underline-offset-4 group-hover:underline">{post.title}</h3>
            <p className="break-words text-detail leading-[1.8] text-navy">{post.excerpt}</p>
            <div className="mt-[18px] flex items-center gap-2"><span className="text-caption uppercase tracking-[0.25em] text-terra">Ler mais</span><div className="h-px w-3.5 bg-terra transition-all group-hover:w-7" /></div>
          </div>
        </a>
      </article>)}
    </div>
  </section>;
}
