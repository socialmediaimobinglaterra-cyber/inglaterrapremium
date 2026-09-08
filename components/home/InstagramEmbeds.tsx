"use client";

import Script from "next/script";
import { useEffect } from "react";
import type { InstagramPost } from "@/lib/queries/instagram-posts";

function processInstagramEmbeds() {
  const instagram = (window as Window & { instgrm?: { Embeds?: { process: () => void } } })
    .instgrm;
  instagram?.Embeds?.process();
}

export function InstagramEmbeds({ posts }: { posts: InstagramPost[] }) {
  useEffect(() => {
    processInstagramEmbeds();
  }, [posts]);

  return (
    <>
      <Script
        async
        onLoad={processInstagramEmbeds}
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <div className="overflow-hidden bg-white" key={post.id}>
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={post.url}
              data-instgrm-version="14"
              style={{
                background: "#fff",
                border: 0,
                margin: "0 auto",
                maxWidth: 540,
                minWidth: 260,
                width: "100%",
              }}
            >
              <a href={post.url} rel="noreferrer" target="_blank">
                Ver post no Instagram
              </a>
            </blockquote>
          </div>
        ))}
      </div>
    </>
  );
}
