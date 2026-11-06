"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { HomeBanner } from "@/lib/home-banners";

export function BannerCarousel({ banners, compactBottom = false }: { banners: HomeBanner[]; compactBottom?: boolean }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const count = banners.length;
  const activeIndex = count ? index % count : 0;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPlaying(!preference.matches);
    const reduceMotion = () => { if (preference.matches) setPlaying(false); };
    const visibility = () => setVisible(!document.hidden);
    visibility();
    preference.addEventListener("change", reduceMotion);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      preference.removeEventListener("change", reduceMotion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    if (count < 2 || !playing || hovered || focused || !visible) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), 6000);
    return () => window.clearInterval(timer);
  }, [count, playing, hovered, focused, visible]);

  if (!count) return null;
  const banner = banners[activeIndex];
  const photo = <Image alt={banner.alt} src={banner.image} fill sizes="(min-width: 1440px) 1296px, 90vw" className="object-contain" />;
  const move = (offset: number) => {
    setPlaying(false);
    setIndex((activeIndex + offset + count) % count);
  };

  return (
    <section aria-label="Banners da Inglaterra Premium" aria-roledescription={count > 1 ? "carrossel" : undefined}
      className={compactBottom ? "site-container pt-12 md:pt-20" : "site-container py-12 md:py-20"}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
      <div className="relative" style={{ aspectRatio: `${banners[0].width} / ${banners[0].height}` }}>
        <div className="absolute inset-0" role="group" aria-roledescription="slide" aria-label={`${activeIndex + 1} de ${count}`}>
          {banner.href ? <a className="nav-focus absolute inset-0 block" href={banner.href}>{photo}</a> : photo}
        </div>
      </div>
      {count > 1 ? <div className="mt-3 flex items-center justify-end gap-2 text-navy">
        <span className="mr-2 text-sm" aria-live={playing ? "off" : "polite"}>{activeIndex + 1} / {count}</span>
        <button type="button" aria-label="Banner anterior" title="Banner anterior" className="nav-focus h-11 w-11 border border-navy/20" onClick={() => move(-1)}>&larr;</button>
        <button type="button" aria-label={playing ? "Pausar banners" : "Reproduzir banners"} title={playing ? "Pausar banners" : "Reproduzir banners"} className="nav-focus h-11 w-11 border border-navy/20" onClick={() => setPlaying(!playing)}>{playing ? "Ⅱ" : "▷"}</button>
        <button type="button" aria-label="Próximo banner" title="Próximo banner" className="nav-focus h-11 w-11 border border-navy/20" onClick={() => move(1)}>&rarr;</button>
      </div> : null}
    </section>
  );
}
