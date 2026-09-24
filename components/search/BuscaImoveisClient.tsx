"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type {
  ImovelSearchFilters,
  ImovelSearchPage,
  ImovelSearchResult,
} from "@/lib/queries/imoveis";
import { imageUrlOrFallback } from "@/lib/images";
import type { CrmConversationListing } from "@/lib/crm-conversation";

type Props = {
  initialSearchPage: ImovelSearchPage;
  initialNegocio?: (typeof NEGOCIO_OPTIONS)[number];
  initialNaturalQuery?: string;
  initialMapSelection?: string;
  bairros: string[];
  tipos: string[];
  crmPreview?: boolean;
};

type ValorOption = {
  label: string;
  valorMinimo: number | null;
  valorMaximo: number | null;
};

type AiInterpretationNotice = {
  interpreted: string[];
  naoInterpretado: string[];
};

const NEGOCIO_OPTIONS = ["Comprar", "Alugar"] as const;
const SEARCH_PER_PAGE = 24;
const SUITES_OPTIONS = [
  { label: "Não definido", value: null },
  { label: "2+ suítes", value: 2 },
  { label: "3+ suítes", value: 3 },
  { label: "4+ suítes", value: 4 },
  { label: "5+ suítes", value: 5 },
] as const;
const VALOR_OPTIONS: ValorOption[] = [
  { label: "Não definido", valorMinimo: null, valorMaximo: null },
  { label: "Até R$ 2.000.000", valorMinimo: null, valorMaximo: 2_000_000 },
  { label: "Até R$ 4.000.000", valorMinimo: null, valorMaximo: 4_000_000 },
  { label: "Até R$ 6.000.000", valorMinimo: null, valorMaximo: 6_000_000 },
  { label: "Acima de R$ 6.000.000", valorMinimo: 6_000_000, valorMaximo: null },
];

function currency(value: number | null) {
  if (value === null) return "Sob consulta";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function area(value: number | null) {
  if (value === null) return "Área sob consulta";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m²`;
}

function describeAiFilters(filters: ImovelSearchFilters) {
  const labels = [
    filters.mapSelection ? "Localização selecionada no mapa" : null,
    filters.tipo,
    filters.bairro,
    filters.condominio,
    filters.negocio === "Alugar" ? "Locação" : filters.negocio === "Comprar" ? "Venda" : null,
    filters.suitesMinimas ? `${filters.suitesMinimas}+ suítes` : null,
    filters.vagasMinimas ? `${filters.vagasMinimas}+ vagas` : null,
    filters.quartosMinimos ? `${filters.quartosMinimos}+ quartos` : null,
    filters.areaMinima ? `a partir de ${area(filters.areaMinima)}` : null,
    filters.areaMaxima != null ? `até ${area(filters.areaMaxima)}` : null,
    filters.valorMinimo != null
      ? `acima de ${currency(filters.valorMinimo)}`
      : null,
    filters.valorMaximo != null ? `até ${currency(filters.valorMaximo)}` : null,
  ];

  return labels.filter((label): label is string => Boolean(label));
}

function IconFiltros() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 4h14M4 8h8M6.5 12h3" stroke="#101a26" strokeLinecap="round" strokeWidth="1.3" />
      <circle cx="4" cy="4" fill="#ffffff" r="1.3" stroke="#101a26" strokeWidth="1.1" />
      <circle cx="10" cy="8" fill="#ffffff" r="1.3" stroke="#101a26" strokeWidth="1.1" />
      <circle cx="7" cy="12" fill="#ffffff" r="1.3" stroke="#101a26" strokeWidth="1.1" />
    </svg>
  );
}

function IconSalvar() {
  return (
    <svg fill="none" height="15" viewBox="0 0 16 16" width="15" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 2h10v12l-5-3-5 3V2z" stroke="#ffffff" strokeLinejoin="round" strokeWidth="1.3" />
    </svg>
  );
}

function PillSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const selectId = `filtro-${label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="relative w-[148px] shrink-0 rounded-[24px] border border-navy/10 py-2 pl-4 pr-[30px] xl:w-0 xl:min-w-[100px] xl:flex-1">
      <label className="sr-only" htmlFor={selectId}>
        {label}
      </label>
      <span className="mb-0.5 block text-[8px] uppercase tracking-[0.14em] text-navy">
        {label}
      </span>
      <select
        className="w-full min-w-0 cursor-pointer appearance-none truncate border-0 bg-transparent text-[13px] font-medium text-navy outline-none disabled:cursor-wait disabled:opacity-60"
        title={value}
        id={selectId}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-navy">
        ▾
      </span>
    </div>
  );
}

function ListingCard({ imovel }: { imovel: CrmConversationListing }) {
  const price = imovel.precoVenda ?? imovel.precoLocacao;
  const image = imageUrlOrFallback(imovel.image);

  return (
    <Link className="group block text-inherit no-underline" aria-disabled={imovel.crmDisplay && !imovel.crmDisplay.href ? true : undefined} onClick={event => { if (imovel.crmDisplay && !imovel.crmDisplay.href) event.preventDefault(); }} href={imovel.crmDisplay ? imovel.crmDisplay.href ?? "#" : `/imoveis/${imovel.slug}`}>
      <div className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-[#1e1e1e] md:aspect-[5/4]">
        {imovel.crmDisplay ? (imovel.image ? <img alt={imovel.titulo} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" src={imovel.image} /> : <span className="flex h-full items-center justify-center text-sm text-white">Foto indisponível</span>) : <Image
          alt={`${imovel.titulo} — ${imovel.bairro}, Londrina`}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          src={image}
        />}
        {imovel.tag ? <span className="absolute left-3.5 top-3.5 border border-white/40 px-2.5 py-[5px] text-[8px] uppercase tracking-[0.3em] text-white">
          {imovel.tag}
        </span> : null}
      </div>
      <div className="pt-4">
        {imovel.codigo ? <p className="mb-1.5 text-xs text-navy">Ref. {imovel.codigo}</p> : null}
        <p className="mb-1.5 text-[11px] tracking-[0.06em] text-navy">
          {imovel.bairro}, {imovel.crmDisplay ? imovel.cidade : "Londrina"}
        </p>
        <h3 className="mb-2.5 text-base font-normal leading-[1.3] tracking-[0.01em] text-navy">
          {imovel.titulo}
        </h3>
        <div className={`flex items-baseline justify-between gap-4 border-t border-navy/10 pt-2.5 ${imovel.crmDisplay ? "flex-wrap" : ""}`}>
          <span className="text-[11px] text-navy">
            {imovel.crmDisplay?.area ?? area(imovel.area)}
            {imovel.suites && imovel.suites > 0 ? ` · ${imovel.suites} suítes` : ""}
            {imovel.vagas && imovel.vagas > 0 ? ` · ${imovel.vagas} vagas` : ""}
          </span>
          <span className="shrink-0 text-[17px] text-navy">{imovel.crmDisplay?.price ?? currency(price)}</span>
        </div>
      </div>
    </Link>
  );
}

export function BuscaImoveisClient({
  initialSearchPage,
  initialNegocio = "Comprar",
  initialNaturalQuery,
  initialMapSelection,
  bairros,
  tipos,
  crmPreview = false,
}: Props) {
  const [imoveis, setImoveis] = useState(initialSearchPage.imoveis);
  const [total, setTotal] = useState(initialSearchPage.total);
  const [page, setPage] = useState(initialSearchPage.page);
  const [hasMore, setHasMore] = useState(initialSearchPage.hasMore);
  const [currentFilters, setCurrentFilters] = useState<ImovelSearchFilters>({ negocio: initialNegocio, order: "relevancia", mapSelection: initialMapSelection });
  const filtersRef = useRef(currentFilters);
  const requestSequence = useRef(0);
  const aiBusyRef = useRef(false);
  const manualBusyRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const [naturalQuery, setNaturalQuery] = useState(initialNaturalQuery ?? "");
  const [aiNote, setAiNote] = useState("");
  const [aiInterpretationNotice, setAiInterpretationNotice] = useState<AiInterpretationNotice | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const busy = isAiSearching || isPending || isLoadingMore;
  const initialNaturalQueryHandled = useRef(false);
  const negocio = currentFilters.negocio ?? initialNegocio;
  const bairro = currentFilters.bairro ?? "Todos os bairros";
  const tipo = currentFilters.tipo ?? "Todos os tipos";
  const order = currentFilters.order ?? "relevancia";
  const bairroOptions = [...new Set(["Todos os bairros", ...bairros, ...(currentFilters.bairro ? [currentFilters.bairro] : [])])];
  const tipoOptions = [...new Set(["Todos os tipos", ...tipos, ...(currentFilters.tipo ? [currentFilters.tipo] : [])])];
  const valorOptions = [...VALOR_OPTIONS];
  let valorOption = valorOptions.find(v => v.valorMinimo === (currentFilters.valorMinimo ?? null) && v.valorMaximo === (currentFilters.valorMaximo ?? null));
  if (!valorOption) {
    valorOption = {
      label: [currentFilters.valorMinimo != null ? `De ${currency(currentFilters.valorMinimo)}` : "", currentFilters.valorMaximo != null ? `até ${currency(currentFilters.valorMaximo)}` : ""].filter(Boolean).join(" "),
      valorMinimo: currentFilters.valorMinimo ?? null, valorMaximo: currentFilters.valorMaximo ?? null,
    };
    valorOptions.push(valorOption);
  }
  const valor = valorOption.label;
  const suitesOptions: {label: string; value: number | null}[] = [...SUITES_OPTIONS];
  let suitesOption = suitesOptions.find(v => v.value === (currentFilters.suitesMinimas ?? null));
  if (!suitesOption) {
    suitesOption = { label: `${currentFilters.suitesMinimas}+ suítes`, value: currentFilters.suitesMinimas ?? null };
    suitesOptions.push(suitesOption);
  }
  const suites = suitesOption.label;

  function saveFilters(filters: ImovelSearchFilters) {
    filtersRef.current = filters;
    setCurrentFilters(filters);
  }
  async function runSearch(filters: ImovelSearchFilters, options: {page?: number; append?: boolean} = {}) {
    const sequence = ++requestSequence.current;
    const nextPage = options.page ?? 1;
    const response = await fetch(crmPreview ? "/preview/crm/api/search" : "/api/imoveis/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...filters, page: nextPage, perPage: SEARCH_PER_PAGE }),
    });
    const data = await response.json();
    if (sequence !== requestSequence.current) return false;
    if (!response.ok || !data.ok) throw new Error("search_failed");
    const nextImoveis: ImovelSearchResult[] = Array.isArray(data.imoveis) ? data.imoveis : [];
    setImoveis(current => Array.from(new Map((options.append ? [...current, ...nextImoveis] : nextImoveis).map(item => [item.slug, item])).values()));
    setTotal(data.total);
    setPage(data.page);
    setHasMore(Boolean(data.hasMore));
    return true;
  }
  function updateFilters(nextFilters: ImovelSearchFilters) {
    if (aiBusyRef.current || manualBusyRef.current || loadingMoreRef.current) return;
    manualBusyRef.current = true;
    setAiNote("");
    startTransition(async () => {
      try {
        if (await runSearch(nextFilters)) {
          saveFilters(nextFilters);
          setAiInterpretationNotice(current => current ? { ...current, interpreted: describeAiFilters(nextFilters) } : null);
        }
      }
      catch { setAiNote("Não foi possível atualizar os resultados. Tente novamente."); }
      finally { manualBusyRef.current = false; }
    });
  }
  function onBairroChange(value: string) { updateFilters({ ...filtersRef.current, bairro: value === "Todos os bairros" ? null : value }); }
  function onTipoChange(value: string) { updateFilters({ ...filtersRef.current, tipo: value === "Todos os tipos" ? null : value }); }
  function onNegocioChange(value: string) { updateFilters({ ...filtersRef.current, negocio: value === "Alugar" ? "Alugar" : "Comprar" }); }
  function onValorChange(value: string) {
    const option = valorOptions.find(v => v.label === value)!;
    updateFilters({ ...filtersRef.current, valorMinimo: option.valorMinimo, valorMaximo: option.valorMaximo });
  }
  function onSuitesChange(value: string) { updateFilters({ ...filtersRef.current, suitesMinimas: suitesOptions.find(v => v.label === value)!.value }); }
  function onOrderChange(value: string) { updateFilters({ ...filtersRef.current, order: value as ImovelSearchFilters["order"] }); }
  function limparBusca() { updateFilters({ negocio: "Comprar", order: "relevancia" }); }

  async function carregarMais() {
    if (!hasMore || loadingMoreRef.current || aiBusyRef.current || manualBusyRef.current) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try { await runSearch(filtersRef.current, { page: page + 1, append: true }); }
    catch { setAiNote("Não foi possível carregar mais imóveis. Tente novamente."); }
    finally { loadingMoreRef.current = false; setIsLoadingMore(false); }
  }
  async function runNaturalSearch(query = naturalQuery) {
    const trimmed = query.trim();
    if (!trimmed || aiBusyRef.current || manualBusyRef.current || loadingMoreRef.current) return;
    if (trimmed.length > 500) { setAiNote("Use até 500 caracteres para descrever sua busca."); return; }
    aiBusyRef.current = true;
    ++requestSequence.current;
    setIsAiSearching(true);
    setAiNote("");
    const previous = filtersRef.current;
    try {
      const response = await fetch(crmPreview ? "/preview/crm/api/ai" : "/api/imoveis/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, state: { ...previous, mapSelection: undefined } }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.filters) {
        setAiNote(data.message ?? "Busca inteligente indisponível. Seus filtros foram mantidos.");
        return;
      }
      const filters: ImovelSearchFilters = { ...data.filters, order: previous.order, mapSelection: previous.mapSelection };
      if (!await runSearch(filters)) return;
      saveFilters(filters);
      const naoInterpretado = Array.isArray(data.naoInterpretado) ? data.naoInterpretado.filter((v: unknown): v is string => typeof v === "string") : [];
      setAiInterpretationNotice(naoInterpretado.length ? { interpreted: describeAiFilters(filters), naoInterpretado } : null);
    } catch {
      setAiNote("Não foi possível concluir a busca. Seus filtros foram mantidos; tente novamente.");
    } finally {
      aiBusyRef.current = false;
      setIsAiSearching(false);
    }
  }

  useEffect(() => {
    if (initialNaturalQueryHandled.current || !initialNaturalQuery?.trim()) return;
    initialNaturalQueryHandled.current = true;
    setNaturalQuery(initialNaturalQuery);
    void runNaturalSearch(initialNaturalQuery);
  }, [initialNaturalQuery]);

  return (
    <main className="bg-offwhite text-navy">
      <section className="pt-24 md:pt-32">
        <div className="site-container mb-7 md:mb-10">
          <p className="mb-4 text-[11px] text-navy">Início / Imóveis / {currentFilters.negocio === "Alugar" ? "Alugar" : "Comprar"}</p>
          <h1 className="mb-3.5 max-w-[720px] text-[clamp(26px,8vw,34px)] font-light leading-[1.1] tracking-[0.02em] text-navy md:text-[clamp(34px,4vw,52px)]">
            Imóveis de Alto Padrão {currentFilters.negocio === "Alugar" ? "para Alugar" : "à Venda"} em Londrina
          </h1>
          <p className="max-w-[520px] text-sm leading-[1.7] text-navy">
            Seleção curada de casas, apartamentos e coberturas nos bairros mais valorizados da cidade — Gleba Palhano, Bela Suíça, Aurora, Nova Prochet, Jardim Higienópolis e Terra Bonita.
          </p>
        </div>
      </section>

      <div className="border-y border-navy/10">
        <fieldset disabled={busy} aria-label="Filtros rápidos" aria-busy={busy} className="site-container flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto py-4 md:py-3.5">
          <div className="flex shrink-0 items-center gap-2 pr-1.5">
            <IconFiltros />
            <div>
              <p className="text-[9px] font-semibold uppercase leading-[1.3] tracking-[0.1em] text-terra">
                Filtros rápidos
              </p>
              <p className="text-xs font-medium leading-[1.3] text-navy">
                Refine a sua busca
              </p>
            </div>
          </div>

          <PillSelect label="Tipo" onChange={onTipoChange} options={tipoOptions} value={tipo} />
          <PillSelect label="Negócio" onChange={onNegocioChange} options={[...NEGOCIO_OPTIONS]} value={negocio} />
          <PillSelect label="Localização" onChange={onBairroChange} options={bairroOptions} value={bairro} />
          <PillSelect label="Valor" onChange={onValorChange} options={valorOptions.map((item) => item.label)} value={valor} />
          <PillSelect label="Suítes" onChange={onSuitesChange} options={suitesOptions.map((item) => item.label)} value={suites} />

          <button
            className="shrink-0 rounded-[24px] border-0 bg-navy px-[26px] py-[13px] text-xs font-medium text-white"
            onClick={() => updateFilters(filtersRef.current)}
            type="button"
          >
            {busy ? "Buscando..." : "Buscar"}
          </button>

          <div className="flex shrink-0 gap-2">
            <button aria-label="Filtros avançados" className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-navy/10 bg-transparent" type="button">
              <IconFiltros />
            </button>
            <button aria-label="Salvar busca" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-navy" type="button">
              <IconSalvar />
            </button>
          </div>
        </fieldset>
      </div>

      <section className="site-container border-b border-navy/10 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-0">
          <div className="md:flex-1">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-terra" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-terra">
                Busca inteligente · Inglaterra AI
              </span>
            </div>
            <form
              aria-busy={isAiSearching}
              className="flex flex-col gap-2 border-b border-navy/10 pb-3 md:max-w-[720px] md:flex-row md:gap-0 md:pb-0"
              onSubmit={(event) => {
                event.preventDefault();
                void runNaturalSearch();
              }}
            >
              <input
                aria-label="Busca inteligente de imóveis"
                disabled={busy}
                maxLength={500}
                className="flex-1 border-0 bg-transparent py-1 text-[15px] italic text-navy outline-none placeholder:text-navy/45 md:py-2.5 md:text-[19px]"
                onChange={(event) => setNaturalQuery(event.target.value)}
                placeholder="Descreva o imóvel que você procura..."
                value={naturalQuery}
              />
              <button
                className="py-1 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-terra disabled:cursor-wait disabled:opacity-70 md:py-2.5 md:pl-5 md:text-right"
                disabled={busy}
                type="submit"
              >
                {isAiSearching ? "Interpretando..." : "Perguntar →"}
              </button>
            </form>
            {aiNote ? <p className="mt-2 text-[11px] text-navy">{aiNote}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {[
              "Apartamento na Gleba Palhano até R$ 4 milhões",
              "Casa com 4 suítes no Terra Bonita",
            ].map((example) => (
              <button
                className="rounded-full border border-navy/10 px-3 py-1.5 text-[10.5px] text-navy disabled:cursor-wait disabled:opacity-70"
                disabled={busy}
                key={example}
                onClick={() => {
                  setNaturalQuery(example);
                  void runNaturalSearch(example);
                }}
                type="button"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="site-container py-7 md:py-10">
        {currentFilters.mapSelection && total === 0 && <p role="status" className="mb-4 text-sm text-navy">Nenhum imóvel disponível nesta seleção. O catálogo pode ter sido atualizado. <Link className="underline" href="/#property-map-title">Selecionar novamente no mapa</Link></p>}
        <p aria-live="polite" className="mb-4 text-xs text-navy">{describeAiFilters(currentFilters).join(" · ")}</p>
        <button type="button" onClick={limparBusca} disabled={busy} className="mb-4 text-xs text-terra underline disabled:opacity-60">Limpar filtros</button>
        {aiInterpretationNotice ? (
          <div className="mb-5 border border-navy/10 bg-white px-4 py-3 text-[13px] leading-relaxed text-navy">
            Filtramos por:{" "}
            <span className="font-medium">
              {aiInterpretationNotice.interpreted.length > 0
                ? aiInterpretationNotice.interpreted.join(", ")
                : "filtros disponíveis"}
            </span>
            . Não conseguimos filtrar automaticamente por:{" "}
            <span className="font-medium">
              {aiInterpretationNotice.naoInterpretado.join(", ")}
            </span>{" "}
            — verifique os detalhes de cada imóvel.
          </div>
        ) : null}
        <div className="mb-7 flex flex-col items-start justify-between gap-2.5 border-b border-navy/10 pb-5 md:mb-10 md:flex-row md:items-baseline md:gap-0">
          <h2 className="text-lg font-medium text-navy md:text-xl">
            Resultados da busca{" "}
            <span className="text-sm font-normal text-navy">
              {total} imóveis encontrados
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-xs text-navy" htmlFor="ordenar-imoveis">
              Ordenar por
            </label>
            <select
              className="cursor-pointer border-0 bg-transparent text-xs font-medium text-navy outline-none"
              id="ordenar-imoveis"
              disabled={busy}
              onChange={(event) => onOrderChange(event.target.value)}
              value={order}
            >
              <option value="relevancia">Relevância</option>
              <option value="maior_valor">Maior valor</option>
              <option value="menor_valor">Menor valor</option>
              <option value="mais_recentes">Mais recentes</option>
            </select>
          </div>
        </div>

        {imoveis.length > 0 ? (
          <div className="grid grid-cols-1 gap-9 md:grid-cols-3 md:gap-10">
            {imoveis.map((imovel) => (
              <ListingCard imovel={imovel} key={imovel.slug} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="mb-4 text-[15px] text-navy">
              Nenhum imóvel encontrado com esses critérios.
            </p>
            <button
              className="border border-navy bg-transparent px-7 py-3 text-[10px] uppercase tracking-[0.2em] text-navy transition hover:bg-navy hover:text-white"
              onClick={limparBusca}
              disabled={busy}
              type="button"
            >
              Ver todos os imóveis
            </button>
          </div>
        )}

        {hasMore ? (
          <div className="mt-10 flex justify-center md:mt-16">
            <button
              className="border border-navy bg-transparent px-9 py-3.5 text-[10px] uppercase tracking-[0.2em] text-navy transition hover:bg-navy hover:text-white disabled:cursor-wait disabled:opacity-60"
              disabled={isLoadingMore || isAiSearching || isPending}
              onClick={carregarMais}
              type="button"
            >
              {isLoadingMore ? "Carregando..." : "Carregar mais imóveis"}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
