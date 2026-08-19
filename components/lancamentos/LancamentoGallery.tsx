"use client";

import { useState } from "react";

type GalleryImage = {
  url: string;
  alt: string;
  position?: string;
};

export function LancamentoGallery({
  images,
  nome,
}: {
  images: GalleryImage[];
  nome: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-navy/10 bg-white text-center text-xs leading-relaxed text-sand md:aspect-auto md:h-[520px]">
        Imagens do lançamento aguardando cadastro.
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            alt={images[activeIndex]?.alt ?? `${nome} - foto ${activeIndex + 1}`}
            className="h-full w-full object-cover"
            src={images[activeIndex]?.url}
            style={{ objectPosition: images[activeIndex]?.position ?? "center center" }}
          />
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto">
          {images.map((image, index) => (
            <button
              className={`h-11 w-14 shrink-0 overflow-hidden border-2 ${
                index === activeIndex ? "border-terra" : "border-transparent"
              }`}
              key={`${image.url}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <img
                alt=""
                className="h-full w-full object-cover"
                src={image.url}
                style={{ objectPosition: image.position ?? "center center" }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="hidden h-[520px] grid-cols-[1.7fr_1fr] gap-2 md:grid">
        <div className="overflow-hidden">
          <img
            alt={images[0]?.alt ?? `${nome} - perspectiva principal`}
            className="h-full w-full object-cover"
            src={images[0]?.url}
            style={{ objectPosition: images[0]?.position ?? "center center" }}
          />
        </div>
        <div className="grid grid-cols-2 grid-rows-2 gap-2">
          {images.slice(1, 5).map((image, index) => (
            <div className="relative overflow-hidden" key={`${image.url}-${index}`}>
              <img
                alt={image.alt}
                className="h-full w-full object-cover"
                src={image.url}
                style={{ objectPosition: image.position ?? "center center" }}
              />
              {index === 3 && images.length > 5 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-navy/60 text-[13px] font-medium text-white">
                  + {images.length - 5} fotos
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
