"use client";

import { useCallback, useEffect, useRef } from "react";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<number | null>(null);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { dialog?.close(); trigger?.focus(); };
  }, []);
  const safeIndex =
    images.length > 0 ? Math.min(Math.max(activeIndex, 0), images.length - 1) : 0;
  const activeImage = images[safeIndex];
  const hasMultiple = images.length > 1;

  const previousImage = useCallback(() => {
    if (!hasMultiple) return;
    onSelect(safeIndex === 0 ? images.length - 1 : safeIndex - 1);
  }, [hasMultiple, images.length, onSelect, safeIndex]);

  const nextImage = useCallback(() => {
    if (!hasMultiple) return;
    onSelect(safeIndex === images.length - 1 ? 0 : safeIndex + 1);
  }, [hasMultiple, images.length, onSelect, safeIndex]);

  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return;

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
  }, [hasMultiple, nextImage, onClose, previousImage]);

  if (!activeImage) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={event => { event.preventDefault(); onClose(); }}
      aria-label={`Galeria de fotos - ${nome}`}
      aria-modal="true"
      className="fixed inset-0 z-[90] m-0 flex h-[100dvh] max-h-none w-screen max-w-none flex-col border-0 bg-navy/95 p-0 text-white backdrop:bg-navy/95"
      role="dialog"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/75">
          {safeIndex + 1} / {images.length}
        </p>
        <button
          aria-label="Fechar"
          title="Fechar"
          className="border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-white transition hover:border-terra-light hover:text-terra-light"
          onClick={onClose}
          type="button"
        >
          Fechar
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-5 md:px-16"
        onTouchStart={event => { touchStart.current = event.touches[0].clientX; }}
        onTouchEnd={event => {
          if (touchStart.current !== null) {
            const delta = event.changedTouches[0].clientX - touchStart.current;
            if (delta > 50) previousImage();
            if (delta < -50) nextImage();
          }
          touchStart.current = null;
        }}>
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
          alt={activeImage.alt || `${nome} - foto ${safeIndex + 1}`}
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
      <p aria-live="polite" className="px-4 text-center text-xs text-white/75">{activeImage.alt}</p>

      {hasMultiple ? (
        <div className="border-t border-white/10 px-4 py-3 md:px-6">
          <div className="flex gap-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                aria-label={`Abrir foto ${index + 1}`}
                className={`h-14 w-20 shrink-0 overflow-hidden border-2 md:h-16 md:w-24 ${
                  index === safeIndex ? "border-terra-light" : "border-transparent"
                }`}
                key={`${image.url}-${index}`}
                onClick={() => onSelect(index)}
                type="button"
              >
                <img
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                  src={image.url}
                  style={{ objectPosition: image.position ?? "center center" }}
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
