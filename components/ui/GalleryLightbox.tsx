"use client";

import { useEffect } from "react";

type GalleryImage = {
  url: string;
  alt: string;
  position?: string;
};

export function GalleryLightbox({
  activeIndex,
  images,
  nome,
  onClose,
  onSelect,
}: {
  activeIndex: number;
  images: GalleryImage[];
  nome: string;
  onClose: () => void;
  onSelect: (index: number) => void;
}) {
  const activeImage = images[activeIndex];
  const hasMultiple = images.length > 1;

  function previousImage() {
    onSelect(activeIndex === 0 ? images.length - 1 : activeIndex - 1);
  }

  function nextImage() {
    onSelect(activeIndex === images.length - 1 ? 0 : activeIndex + 1);
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasMultiple) previousImage();
      if (event.key === "ArrowRight" && hasMultiple) nextImage();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  if (!activeImage) return null;

  return (
    <div
      aria-label={`Galeria de fotos - ${nome}`}
      aria-modal="true"
      className="fixed inset-0 z-[90] flex flex-col bg-navy/95 text-white"
      role="dialog"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">
          {activeIndex + 1} / {images.length}
        </p>
        <button
          className="border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-white transition hover:border-terra-light hover:text-terra-light"
          onClick={onClose}
          type="button"
        >
          Fechar
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-5 md:px-16">
        {hasMultiple ? (
          <button
            aria-label="Foto anterior"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 border border-white/20 bg-navy/60 px-3 py-3 text-[10px] uppercase tracking-[0.14em] text-white transition hover:border-terra-light hover:text-terra-light md:left-6"
            onClick={previousImage}
            type="button"
          >
            Ant.
          </button>
        ) : null}

        <img
          alt={activeImage.alt || `${nome} - foto ${activeIndex + 1}`}
          className="max-h-full max-w-full object-contain"
          src={activeImage.url}
        />

        {hasMultiple ? (
          <button
            aria-label="Próxima foto"
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 border border-white/20 bg-navy/60 px-3 py-3 text-[10px] uppercase tracking-[0.14em] text-white transition hover:border-terra-light hover:text-terra-light md:right-6"
            onClick={nextImage}
            type="button"
          >
            Próx.
          </button>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="border-t border-white/10 px-4 py-3 md:px-6">
          <div className="flex gap-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                aria-label={`Abrir foto ${index + 1}`}
                className={`h-14 w-20 shrink-0 overflow-hidden border-2 md:h-16 md:w-24 ${
                  index === activeIndex ? "border-terra-light" : "border-transparent"
                }`}
                key={`${image.url}-${index}`}
                onClick={() => onSelect(index)}
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
      ) : null}
    </div>
  );
}
