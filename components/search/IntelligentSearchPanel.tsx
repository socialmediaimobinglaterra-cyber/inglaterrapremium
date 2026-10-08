"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  busy: boolean;
  interpreting: boolean;
  refined: boolean;
  criteria: string[];
  message: string;
};

export function IntelligentSearchPanel({
  query, onQueryChange, onSearch, busy, interpreting, refined, criteria, message,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showShortcut, setShowShortcut] = useState(false);
  const summary = criteria.join(" · ");
  const suggestions = refined
    ? ["Agora quero com 3 suítes", "Pode ser em qualquer bairro"]
    : ["Apartamento na Gleba Palhano até R$ 4 milhões", "Casa com 4 suítes no Terra Bonita"];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowShortcut(!entry.isIntersecting && entry.boundingClientRect.bottom <= 72);
    }, { rootMargin: "-72px 0px 0px 0px", threshold: 0 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  function editSearch() {
    sectionRef.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
    inputRef.current?.focus({ preventScroll: true });
  }

  return (
    <>
      <section
        aria-labelledby="intelligent-search-title"
        className="scroll-mt-20 border-y border-sand/25 bg-sand/10"
        id="busca-inteligente"
        ref={sectionRef}
      >
        <div className="site-container py-5 md:py-6">
          <p className="mb-1 text-xs font-medium text-terra">Busca inteligente</p>
          <h2 className="text-xl font-light leading-tight md:text-2xl" id="intelligent-search-title">
            {refined ? "Vamos refinar sua busca?" : "Descreva o imóvel que você procura"}
          </h2>
          <p className="mt-1 text-sm text-navy">
            Bairro, valor e características para o seu próximo endereço.
          </p>
          <form
            aria-busy={busy}
            className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-3"
            onSubmit={(event) => { event.preventDefault(); onSearch(query); }}
          >
            <label className="sr-only" htmlFor="intelligent-search-query">Busca inteligente de imóveis</label>
            <input
              autoComplete="off"
              className="h-14 w-full min-w-0 flex-none rounded-sm border border-sand/60 bg-offwhite px-4 text-base text-navy outline-none placeholder:text-navy/65 focus:border-terra focus:ring-1 focus:ring-terra disabled:cursor-wait disabled:opacity-70 sm:flex-1"
              disabled={busy}
              id="intelligent-search-query"
              maxLength={500}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={refined ? "Agora quero com 3 suítes..." : "Apartamento na Gleba Palhano até R$ 3 milhões..."}
              ref={inputRef}
              type="text"
              value={query}
            />
            <button
              className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-sm bg-terra px-6 text-sm font-medium text-white transition-colors hover:bg-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra disabled:cursor-wait disabled:opacity-70 sm:w-[210px]"
              disabled={busy || !query.trim()}
              type="submit"
            >
              {interpreting && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white motion-reduce:animate-none" />}
              {interpreting ? "Interpretando..." : busy ? "Buscando..." : "Encontrar imóveis"}
            </button>
          </form>
          <div aria-label="Sugestões de busca" className="mt-2 flex flex-col items-start gap-x-6 sm:flex-row sm:flex-wrap">
            {suggestions.map((suggestion) => (
              <button
                className="min-h-11 max-w-full py-2 text-left text-xs leading-relaxed text-navy underline decoration-sand/60 underline-offset-4 hover:text-terra focus-visible:outline focus-visible:outline-2 focus-visible:outline-terra disabled:cursor-wait disabled:opacity-60"
                disabled={busy}
                key={suggestion}
                onClick={() => { onQueryChange(suggestion); onSearch(suggestion); }}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
          {message && <p className="mt-2 border-l-2 border-terra pl-3 text-sm leading-relaxed">{message}</p>}
        </div>
      </section>

      {showShortcut && (
        <div aria-label="Resumo da busca" className="sticky top-16 z-30 border-b border-navy/15 bg-offwhite shadow-sm">
          <div className="site-container flex h-14 min-w-0 items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-terra">{interpreting ? "Interpretando sua busca..." : "Sua seleção"}</p>
              <p className="truncate text-xs text-navy" title={message || summary}>
                {message || summary || "Imóveis em Londrina"}
              </p>
            </div>
            <button
              aria-controls="busca-inteligente"
              className="min-h-11 shrink-0 px-3 text-sm font-medium text-terra underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terra disabled:opacity-60"
              disabled={busy}
              onClick={editSearch}
              type="button"
            >
              Editar busca
            </button>
          </div>
        </div>
      )}
    </>
  );
}
