"use client";

import Image from "next/image";
import { useState } from "react";
import { GalleryLightbox } from "@/components/ui/GalleryLightbox";
import { imageUrlOrFallback } from "@/lib/images";

type Foto = { url: string; alt?: string };

/**
 * Galeria do imóvel (mosaico igual ao de sempre) com fotos que abrem em tela
 * cheia. Usada só com CONDOMINIO_SECAO=on; desligada, a página mantém o mosaico
 * estático antigo.
 */
export function ImovelGaleria({ fotos, titulo }: { fotos: Foto[]; titulo: string }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const imagens = fotos.map((foto, index) => ({
    url: imageUrlOrFallback(foto.url),
    alt: foto.alt ?? `${titulo} — foto ${index + 1}`,
  }));
  const principal = imagens[0];
  if (!principal) return null;

  return (
    <>
      <div className="md:grid md:h-[560px] md:grid-cols-[1.7fr_1fr] md:gap-2">
        <button
          aria-label="Abrir foto principal em tela cheia"
          className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden border-0 bg-transparent p-0 md:aspect-auto md:h-full"
          onClick={() => setAberta(0)}
          type="button"
        >
          <Image alt={`${titulo} — foto principal`} className="h-full w-full object-cover" fill priority sizes="(min-width: 768px) 63vw, 100vw" src={principal.url} />
        </button>
        <div className="mt-2 grid grid-cols-4 gap-1.5 md:mt-0 md:grid-cols-2 md:grid-rows-2 md:gap-2">
          {imagens.slice(1, 5).map((foto, index) => (
            <button
              aria-label={`Abrir foto ${index + 2} em tela cheia`}
              className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden border-0 bg-transparent p-0 md:aspect-auto md:h-full"
              key={`${foto.url}-${index}`}
              onClick={() => setAberta(index + 1)}
              type="button"
            >
              <Image alt={foto.alt} className="h-full w-full object-cover" fill sizes="(min-width: 768px) 19vw, 25vw" src={foto.url} />
              {index === 3 && imagens.length > 5 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-navy/60 text-[13px] font-medium text-white">
                  + {imagens.length - 5} fotos
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {aberta !== null ? (
        <GalleryLightbox activeIndex={aberta} images={imagens} nome={titulo} onClose={() => setAberta(null)} onSelect={setAberta} />
      ) : null}
    </>
  );
}
