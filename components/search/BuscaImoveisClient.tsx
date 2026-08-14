"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { ImovelSearchFilters, ImovelSearchResult } from "@/lib/queries/imoveis";

type Props = {
  initialImoveis: ImovelSearchResult[];
  bairros: string[];
  tipos: string[];
};

type ValorOption = {
  label: string;
  valorMinimo: number | null;
  valorMaximo: number | null;
};

const NEGOCIO_OPTIONS = ["Comprar", "Alugar"] as const;
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
  return (
    <div className="relative min-w-[148px] shrink-0 rounded-[24px] border border-navy/10 py-2 pl-4 pr-[30px]">
      <span className="mb-0.5 block text-[8px] uppercase tracking-[0.14em] text-sand">
        {label}
      </span>
      <select
        className="w-full cursor-pointer appearance-none border-0 bg-transparent text-[13px] font-medium text-navy outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-sand">
        ▾
      </span>
    </div>
  );
}

function ListingCard({ imovel }: { imovel: ImovelSearchResult }) {
  const price = imovel.precoVenda ?? imovel.precoLocacao;

  return (
    <Link className="group block text-inherit no-underline" href={`/imoveis/${imovel.slug}`}>
      <div className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-[#1e1e1e] md:aspect-[5/4]">
        <img
          alt={`${imovel.titulo} — ${imovel.bairro}, Londrina`}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          src={imovel.image}
        />
        <span className="absolute left-3.5 top-3.5 border border-white/40 px-2.5 py-[5px] text-[8px] uppercase tracking-[0.3em] text-white">
          {imovel.tag}
        </span>
      </div>
      <div className="pt-4">
        <p className="mb-1.5 text-[11px] tracking-[0.06em] text-sand">
          {imovel.bairro}, Londrina
        </p>
        <h3 className="mb-2.5 text-base font-normal leading-[1.3] tracking-[0.01em] text-navy">
          {imovel.titulo}
        </h3>
        <div className="flex items-baseline justify-between gap-4 border-t border-navy/10 pt-2.5">
          <span className="text-[11px] text-sand">
            {area(imovel.area)}
            {imovel.suites && imovel.suites > 0 ? ` · ${imovel.suites} suítes` : ""}
            {imovel.vagas && imovel.vagas > 0 ? ` · ${imovel.vagas} vagas` : ""}
          </span>
          <span className="shrink-0 text-[17px] text-navy">{currency(price)}</span>
        </div>
      </div>
    </Link>
  );
}

export function BuscaImoveisClient({ initialImoveis, bairros, tipos }: Props) {
  const [imoveis, setImoveis] = useState(initialImoveis);
  const [negocio, setNegocio] = useState<(typeof NEGOCIO_OPTIONS)[number]>("Comprar");
  const [bairro, setBairro] = useState("Todos os bairros");
  const [tipo, setTipo] = useState("Todos os tipos");
  const [valor, setValor] = useState("Não definido");
  const [suites, setSuites] = useState("Não definido");
  const [order, setOrder] = useState<NonNullable<ImovelSearchFilters["order"]>>("relevancia");
  const [naturalQuery, setNaturalQuery] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const bairroOptions = useMemo(() => ["Todos os bairros", ...bairros], [bairros]);
  const tipoOptions = useMemo(() => ["Todos os tipos", ...tipos], [tipos]);
  const valorOption = VALOR_OPTIONS.find((item) => item.label === valor) ?? VALOR_OPTIONS[0];
  const suitesOption = SUITES_OPTIONS.find((item) => item.label === suites) ?? SUITES_OPTIONS[0];

  const currentFilters: ImovelSearchFilters = {
    bairro,
    tipo,
    negocio,
    valorMinimo: valorOption.valorMinimo,
    valorMaximo: valorOption.valorMaximo,
    suitesMinimas: suitesOption.value,
    order,
  };

  async function runSearch(filters: ImovelSearchFilters) {
    const response = await fetch("/api/imoveis/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });
    const data = await response.json();
    setImoveis(Array.isArray(data.imoveis) ? data.imoveis : []);
  }

  function updateFilters(nextFilters: ImovelSearchFilters) {
    startTransition(() => {
      void runSearch(nextFilters);
    });
  }

  function onBairroChange(value: string) {
    setBairro(value);
    updateFilters({ ...currentFilters, bairro: value });
  }

  function onTipoChange(value: string) {
    setTipo(value);
    updateFilters({ ...currentFilters, tipo: value });
  }

  function onNegocioChange(value: string) {
    const next = value === "Alugar" ? "Alugar" : "Comprar";
    setNegocio(next);
    updateFilters({ ...currentFilters, negocio: next });
  }

  function onValorChange(value: string) {
    const option = VALOR_OPTIONS.find((item) => item.label === value) ?? VALOR_OPTIONS[0];
    setValor(value);
    updateFilters({
      ...currentFilters,
      valorMinimo: option.valorMinimo,
      valorMaximo: option.valorMaximo,
    });
  }

  function onSuitesChange(value: string) {
    const option = SUITES_OPTIONS.find((item) => item.label === value) ?? SUITES_OPTIONS[0];
    setSuites(value);
    updateFilters({ ...currentFilters, suitesMinimas: option.value });
  }

  function onOrderChange(value: string) {
    const next = value as NonNullable<ImovelSearchFilters["order"]>;
    setOrder(next);
    updateFilters({ ...currentFilters, order: next });
  }

  function limparBusca() {
    setBairro("Todos os bairros");
    setTipo("Todos os tipos");
    setValor("Não definido");
    setSuites("Não definido");
    setNegocio("Comprar");
    setOrder("relevancia");
    setAiNote("");
    updateFilters({ negocio: "Comprar", order: "relevancia" });
  }

  async function runNaturalSearch(query = naturalQuery) {
    if (!query.trim()) return;
    setAiNote("");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/imoveis/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });
          const data = await response.json();

          if (!data.ok || !data.filters) {
            setAiNote("Busca inteligente indisponível no momento. Use os filtros rápidos.");
            await runSearch(currentFilters);
            return;
          }

          const filters = data.filters as ImovelSearchFilters;
          const nextBairro = filters.bairro ?? "Todos os bairros";
          const nextTipo = filters.tipo ?? "Todos os tipos";
          const nextNegocio = filters.negocio ?? negocio;

          setBairro(nextBairro);
          setTipo(nextTipo);
          setNegocio(nextNegocio === "Alugar" ? "Alugar" : "Comprar");
          setSuites(
            SUITES_OPTIONS.find((item) => item.value === filters.suitesMinimas)?.label ??
              "Não definido"
          );
          setValor("Não definido");
          await runSearch({ ...filters, order });
        } catch {
          setAiNote("Busca inteligente indisponível no momento. Use os filtros rápidos.");
          await runSearch(currentFilters);
        }
      })();
    });
  }

  return (
    <main className="bg-offwhite text-navy">
      <section className="pt-24 md:pt-32">
        <div className="mb-7 px-5 md:mb-10 md:px-16">
          <p className="mb-4 text-[11px] text-sand">Início / Imóveis / Comprar</p>
          <h1 className="mb-3.5 max-w-[720px] text-[clamp(26px,8vw,34px)] font-light leading-[1.1] tracking-[0.02em] text-navy md:text-[clamp(34px,4vw,52px)]">
            Imóveis de Alto Padrão à Venda em Londrina
          </h1>
          <p className="max-w-[520px] text-sm leading-[1.7] text-sand">
            Seleção curada de casas, apartamentos e coberturas nos bairros mais valorizados da cidade — Gleba Palhano, Bela Suíça, Aurora, Nova Prochet, Jardim Higienópolis e Terra Bonita.
          </p>
        </div>
      </section>

      <div className="border-y border-navy/10">
        <div className="flex items-center gap-3 overflow-x-auto px-5 py-4 md:flex-wrap md:gap-3.5 md:overflow-visible md:px-16 md:py-3.5">
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
          <PillSelect label="Valor" onChange={onValorChange} options={VALOR_OPTIONS.map((item) => item.label)} value={valor} />
          <PillSelect label="Suítes" onChange={onSuitesChange} options={SUITES_OPTIONS.map((item) => item.label)} value={suites} />

          <button
            className="shrink-0 rounded-[24px] border-0 bg-navy px-[26px] py-[13px] text-xs font-medium text-white"
            onClick={() => updateFilters(currentFilters)}
            type="button"
          >
            {isPending ? "Buscando" : "Buscar"}
          </button>

          <div className="hidden shrink-0 gap-2 md:ml-auto md:flex">
            <button aria-label="Filtros avançados" className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-navy/10 bg-transparent" type="button">
              <IconFiltros />
            </button>
            <button aria-label="Salvar busca" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-navy" type="button">
              <IconSalvar />
            </button>
          </div>
        </div>
      </div>

      <section className="border-b border-navy/10 px-5 py-5 md:px-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-0">
          <div className="md:flex-1">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-terra" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-terra">
                Busca inteligente · Inglaterra AI
              </span>
            </div>
            <form
              className="flex flex-col gap-2 border-b border-navy/10 pb-3 md:max-w-[720px] md:flex-row md:gap-0 md:pb-0"
              onSubmit={(event) => {
                event.preventDefault();
                void runNaturalSearch();
              }}
            >
              <input
                className="flex-1 border-0 bg-transparent py-1 text-[15px] italic text-navy outline-none placeholder:text-navy/45 md:py-2.5 md:text-[19px]"
                onChange={(event) => setNaturalQuery(event.target.value)}
                placeholder="Descreva o imóvel que você procura..."
                value={naturalQuery}
              />
              <button className="py-1 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-terra md:py-2.5 md:pl-5 md:text-right" type="submit">
                Perguntar →
              </button>
            </form>
            {aiNote ? <p className="mt-2 text-[11px] text-sand">{aiNote}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {[
              "Apartamento na Gleba Palhano até R$ 4 milhões",
              "Casa com 4 suítes no Terra Bonita",
            ].map((example) => (
              <button
                className="rounded-full border border-navy/10 px-3 py-1.5 text-[10.5px] text-sand"
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

      <section className="px-5 py-7 md:px-16 md:py-10">
        <div className="mb-7 flex flex-col items-start justify-between gap-2.5 border-b border-navy/10 pb-5 md:mb-10 md:flex-row md:items-baseline md:gap-0">
          <p className="text-lg font-medium text-navy md:text-xl">
            Resultados da busca{" "}
            <span className="text-sm font-normal text-sand">
              {imoveis.length} imóveis encontrados
            </span>
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-sand">Ordenar por</span>
            <select
              className="cursor-pointer border-0 bg-transparent text-xs font-medium text-navy outline-none"
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
              <ListingCard imovel={imovel} key={imovel.codigo} />
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="mb-4 text-[15px] text-sand">
              Nenhum imóvel encontrado com esses critérios.
            </p>
            <button
              className="border border-navy bg-transparent px-7 py-3 text-[10px] uppercase tracking-[0.2em] text-navy transition hover:bg-navy hover:text-white"
              onClick={limparBusca}
              type="button"
            >
              Ver todos os imóveis
            </button>
          </div>
        )}

        <div className="mt-10 flex justify-center md:mt-16">
          <button
            className="border border-navy bg-transparent px-9 py-3.5 text-[10px] uppercase tracking-[0.2em] text-navy transition hover:bg-navy hover:text-white"
            type="button"
          >
            Carregar mais imóveis
          </button>
        </div>
      </section>
    </main>
  );
}
