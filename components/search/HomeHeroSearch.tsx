"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const EXAMPLES = [
  "Apartamento na Gleba Palhano até R$ 3 milhões",
  "Casa com 4 suítes no Terra Bonita",
];

export function HomeHeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isBusy = isSubmitting || isPending;

  function submitSearch(value = query) {
    const trimmed = value.trim();
    if (!trimmed || isBusy) return;

    setIsSubmitting(true);
    startTransition(() => {
      router.push(`/imoveis?q=${encodeURIComponent(trimmed)}`);
    });
  }

  return (
    <div className="w-full border border-white/50 bg-offwhite/90 px-5 py-[22px] shadow-[0_20px_48px_rgba(16,26,38,0.18)] backdrop-blur-[18px] md:max-w-[54vw] md:px-10 md:py-8">
      <div className="mb-3.5 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-terra" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-terra">
          Busca inteligente · Inglaterra AI
        </span>
      </div>
      <form
        aria-busy={isBusy}
        className="flex flex-col gap-2.5 border-b border-navy/10 pb-3 md:flex-row md:gap-0 md:pb-0"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <input
          aria-label="Busca inteligente de imóveis"
          className="flex-1 border-0 bg-transparent py-1 text-[15px] italic text-navy outline-none placeholder:text-navy/45 md:py-2.5 md:text-[19px]"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Descreva o imóvel que você procura..."
          value={query}
        />
        <button
          className="py-1 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-terra disabled:cursor-wait disabled:opacity-70 md:py-2.5 md:pl-5 md:text-right"
          disabled={isBusy}
          type="submit"
        >
          {isBusy ? "Abrindo busca..." : "Perguntar →"}
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            className="rounded-full border border-navy/10 px-3 py-1.5 text-[10.5px] text-navy disabled:cursor-wait disabled:opacity-70"
            disabled={isBusy}
            key={example}
            onClick={() => {
              setQuery(example);
              submitSearch(example);
            }}
            type="button"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
