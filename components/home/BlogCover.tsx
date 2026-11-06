"use client";

import Image from "next/image";
import { useState } from "react";

export function BlogCover({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <div className="relative h-[200px] overflow-hidden bg-offwhite">
    <Image alt={title} fill sizes="(min-width: 1440px) 432px, (min-width: 768px) 33vw, 100vw"
      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      src={src} onError={() => setFailed(true)} />
  </div>;
}
