"use client";

import { useState } from "react";
import { GalleryLightbox } from "@/components/ui/GalleryLightbox";

export type GrupoPlantas = {
  key: string;
  titulo: string | null;
  /** Ex.: "52 m² · 2 dormitórios · 1 suíte · 1 vaga". Zero é exibido; ausente não aparece. */
  detalhes: string | null;
  plantas: Array<{ url: string; nome: string }>;
};

/**
 * Tipos de unidade com a planta de cada um. Clicar numa planta abre em tela
 * cheia (mesmo lightbox das fotos), navegando por todas as plantas da seção.
 */
export function TipologiasPlantas({ grupos, nome }: { grupos: GrupoPlantas[]; nome: string }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const todas = grupos.flatMap((grupo) =>
    grupo.plantas.map((planta) => ({ url: planta.url, alt: `${nome} - planta ${planta.nome}` }))
  );
  let cursor = 0;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        {grupos.map((grupo) => (
          <div key={grupo.key}>
            {grupo.titulo ? <p className="mb-1 text-[15px] font-normal text-navy">{grupo.titulo}</p> : null}
            {grupo.detalhes ? <p className="mb-3 text-[12px] text-navy/80">{grupo.detalhes}</p> : null}
            {grupo.plantas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {grupo.plantas.map((planta) => {
                  const indice = cursor++;
                  return (
                    <button
                      aria-label={`Ampliar planta ${planta.nome}`}
                      className="block w-full cursor-zoom-in border border-navy/10 bg-white p-2 md:w-[calc(50%-4px)]"
                      key={`${planta.url}-${indice}`}
                      onClick={() => setAberta(indice)}
                      type="button"
                    >
                      <img alt={`Planta ${planta.nome}`} className="aspect-[4/3] w-full object-contain" loading="lazy" src={planta.url} />
                      <span className="mt-1.5 block text-left text-[11px] text-navy/80">{planta.nome}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {aberta !== null ? (
        <GalleryLightbox activeIndex={aberta} images={todas} nome={nome} onClose={() => setAberta(null)} onSelect={setAberta} />
      ) : null}
    </>
  );
}
