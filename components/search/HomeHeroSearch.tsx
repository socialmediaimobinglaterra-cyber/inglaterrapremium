"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { NEGOCIO_OPTIONS, getValorOptions } from "@/lib/search-options";

const EXAMPLES = [
  "Apartamento na Gleba Palhano até R$ 3 milhões",
  "Casa com 4 suítes no Terra Bonita",
];

export function HomeHeroSearch({ searchPath = "/imoveis", filterOptions }: {
  searchPath?: string;
  filterOptions?: { bairros: string[]; condominios: string[]; tipos: string[] };
}) {
  const router = useRouter();
  const id = useId();
  const [mode, setMode] = useState("ai");
  const [negocio, setNegocio] = useState("Comprar");
  const [tipo, setTipo] = useState("");
  const [location, setLocation] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({ Comprar: "0", Alugar: "0" });
  const price = prices[negocio] ?? "0";
  const valorOptions = getValorOptions(negocio);
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isBusy = isSubmitting || isPending;

  function submitFilters() {
    if (isBusy) return;
    const params = new URLSearchParams({ negocio });
    if (tipo) params.set("tipo", tipo);
    if (location) {
      const separator = location.indexOf(":");
      params.set(location.slice(0, separator), location.slice(separator + 1));
    }
    const range = valorOptions[Number(price)];
    if (range.valorMinimo !== null) params.set("valorMinimo", String(range.valorMinimo));
    if (range.valorMaximo !== null) params.set("valorMaximo", String(range.valorMaximo));
    setIsSubmitting(true);
    startTransition(() => router.push(`${searchPath}?${params}`));
  }

  function submitSearch(value = query) {
    const trimmed = value.trim();
    if (!trimmed || isBusy) return;

    setIsSubmitting(true);
    startTransition(() => {
      router.push(`${searchPath}?q=${encodeURIComponent(trimmed)}`);
    });
  }

  return (
    <div className="w-full border border-white/50 bg-offwhite/90 px-5 py-[22px] shadow-[0_20px_48px_rgba(16,26,38,0.18)] backdrop-blur-[18px] md:max-w-[54vw] md:px-10 md:py-8">
      {filterOptions && (
        <div role="tablist" aria-label="Modalidade de busca" className="mb-4 flex gap-5 border-b border-navy/10">
          {[["ai", "Busca inteligente"], ["filters", "Busca por filtros"]].map(([value, label]) => (
            <button key={value} id={`${id}-${value}-tab`} type="button" role="tab"
              aria-selected={mode === value} aria-controls={`${id}-${value}-panel`}
              tabIndex={mode === value ? 0 : -1}
              className={`min-h-11 border-b-2 text-detail transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-terra ${mode === value ? "border-terra font-semibold text-terra" : "border-transparent text-navy/70 hover:text-navy"}`}
              onClick={() => setMode(value)}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                const next = event.key === "Home" ? "ai" : event.key === "End" ? "filters" : mode === "ai" ? "filters" : "ai";
                setMode(next);
                document.getElementById(`${id}-${next}-tab`)?.focus();
              }}>{label}</button>
          ))}
        </div>
      )}
      <div hidden={mode !== "ai"} id={`${id}-ai-panel`} role={filterOptions ? "tabpanel" : undefined} aria-labelledby={filterOptions ? `${id}-ai-tab` : undefined}>
      <div className="mb-3.5 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-terra" />
        <span className="text-caption font-semibold uppercase tracking-[0.28em] text-terra">
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
          maxLength={500}
          className="min-w-0 flex-1 border-0 bg-transparent py-1 text-[15px] italic text-navy outline-none placeholder:text-navy/45 md:py-2.5 md:text-[19px]"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Descreva o imóvel que você procura..."
          value={query}
        />
        <button
          className="py-1 text-left text-caption font-semibold uppercase tracking-[0.2em] text-terra disabled:cursor-wait disabled:opacity-70 md:py-2.5 md:pl-5 md:text-right"
          disabled={isBusy}
          type="submit"
        >
          {isBusy ? "Abrindo busca..." : "Perguntar →"}
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            className="rounded-full border border-navy/10 px-3 py-1.5 text-caption text-navy disabled:cursor-wait disabled:opacity-70"
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
      {filterOptions && (
        <div hidden={mode !== "filters"} id={`${id}-filters-panel`} role="tabpanel" aria-labelledby={`${id}-filters-tab`}>
          <form aria-busy={isBusy} onSubmit={(event) => { event.preventDefault(); submitFilters(); }}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <label className="min-w-0 text-detail text-navy">Finalidade
                <select aria-label="Finalidade" className="mt-1 min-h-11 w-full border-0 border-b border-navy/20 bg-transparent text-sm text-navy focus-visible:outline-terra" value={negocio} onChange={(event) => setNegocio(event.target.value)}>
                  {NEGOCIO_OPTIONS.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label className="min-w-0 text-detail text-navy">Tipo de imóvel
                <select aria-label="Tipo de imóvel" className="mt-1 min-h-11 w-full border-0 border-b border-navy/20 bg-transparent text-sm text-navy focus-visible:outline-terra" value={tipo} onChange={(event) => setTipo(event.target.value)}>
                  <option value="">Todos os tipos</option>
                  {filterOptions.tipos.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label className="min-w-0 text-detail text-navy">Localização
                <select aria-label="Localização" className="mt-1 min-h-11 w-full border-0 border-b border-navy/20 bg-transparent text-sm text-navy focus-visible:outline-terra" value={location} onChange={(event) => setLocation(event.target.value)}>
                  <option value="">Todas as localizações</option>
                  <optgroup label="Bairros">{filterOptions.bairros.map((value) => <option key={value} value={`bairro:${value}`}>{value}</option>)}</optgroup>
                  <optgroup label="Condomínios">{filterOptions.condominios.map((value) => <option key={value} value={`condominio:${value}`}>{value}</option>)}</optgroup>
                </select>
              </label>
              <label className="min-w-0 text-detail text-navy">Faixa de valor
                <select aria-label="Faixa de valor" className="mt-1 min-h-11 w-full border-0 border-b border-navy/20 bg-transparent text-sm text-navy focus-visible:outline-terra" value={price} onChange={(event) => setPrices(current => ({ ...current, [negocio]: event.target.value }))}>
                  {valorOptions.map((value, index) => <option key={value.label} value={index}>{value.label}</option>)}
                </select>
              </label>
            </div>
            <button type="submit" disabled={isBusy} className="mt-3 min-h-11 text-caption font-semibold uppercase tracking-[0.2em] text-terra disabled:cursor-wait disabled:opacity-70">
              {isBusy ? "Abrindo busca..." : "Buscar imóveis →"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
