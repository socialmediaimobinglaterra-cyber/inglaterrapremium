import Image from "next/image";
import type { InstagramPost } from "@/lib/queries/instagram-posts";

function InstagramMark() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <rect height="16" rx="4" stroke="currentColor" strokeWidth="1.7" width="16" x="4" y="4" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.8" cy="7.2" fill="currentColor" r="1" />
    </svg>
  );
}

export function InstagramGallery({ posts }: { posts: InstagramPost[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4 md:gap-[5px]">
      {posts.map((post) => (
        <a
          className="group relative aspect-[4/5] overflow-hidden bg-navy"
          href={post.url}
          key={post.id}
          rel="noreferrer"
          target="_blank"
        >
          <Image
            alt={
              post.legenda
                ? `${post.legenda} — Instagram Inglaterra Premium`
                : "Post do Instagram da Inglaterra Premium"
            }
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            src={post.imagem ?? ""}
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-navy/0 p-4 text-white opacity-0 transition duration-300 group-hover:bg-navy/58 group-hover:opacity-100">
            <InstagramMark />
            {post.legenda ? (
              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-white/90">
                {post.legenda}
              </p>
            ) : null}
          </div>
        </a>
      ))}
    </div>
  );
}
