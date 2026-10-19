"use client";

import Image from "next/image";
import { useState } from "react";
import { GalleryLightbox } from "@/components/ui/GalleryLightbox";
import { imageUrlOrFallback } from "@/lib/images";

type Photo = { url: string; alt?: string };

export function PropertyGallery({ photos, commonPhotos = [], title }: {
  photos: Photo[];
  commonPhotos?: Photo[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const images = [...photos, ...commonPhotos]
    .filter((photo, index, all) => photo.url && all.findIndex(item => item.url === photo.url) === index)
    .map((photo, index) => ({ url: imageUrlOrFallback(photo.url), alt: photo.alt || `${title} - foto ${index + 1}` }));
  if (!images.length) return null;

  return (
    <>
      <div className="md:grid md:h-[560px] md:grid-cols-[1.7fr_1fr] md:gap-2">
        <button type="button" aria-label="Abrir foto 1 do imóvel" onClick={() => setActiveIndex(0)} className="relative block aspect-[4/3] w-full overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-terra md:aspect-auto">
          <Image alt={images[0].alt} className="h-full w-full object-cover" fill priority sizes="(min-width: 768px) 63vw, 100vw" src={images[0].url} />
        </button>
        <div className="mt-2 grid grid-cols-4 gap-1.5 md:mt-0 md:grid-cols-2 md:grid-rows-2 md:gap-2">
          {images.slice(1, 5).map((photo, index) => (
            <button type="button" aria-label={`Abrir foto ${index + 2} do imóvel`} onClick={() => setActiveIndex(index + 1)} className="relative aspect-[4/3] overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-terra md:aspect-auto" key={photo.url}>
              <Image alt={photo.alt} className="h-full w-full object-cover" fill sizes="(min-width: 768px) 19vw, 25vw" src={photo.url} />
              {index === 3 && images.length > 5 ? <span className="absolute inset-0 flex items-center justify-center bg-navy/60 text-[13px] font-medium text-white">+ {images.length - 5} fotos</span> : null}
            </button>
          ))}
        </div>
      </div>
      {activeIndex !== null ? <GalleryLightbox activeIndex={activeIndex} images={images} nome={title} onClose={() => setActiveIndex(null)} onSelect={setActiveIndex} /> : null}
    </>
  );
}
