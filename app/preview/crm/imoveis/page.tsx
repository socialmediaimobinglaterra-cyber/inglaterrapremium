import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CrmCatalogError, createCrmCatalogClient } from "@/lib/crm-catalog";
import { formatCrmDecimal, isLocalCrmPreview } from "@/lib/crm-preview";
import { CrmSearchInputError, crmSearchPageHref, parseCrmSearch } from "@/lib/crm-search";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Imóveis | Prévia CRM", robots: { index: false, follow: false } };
const fieldClass = "mt-1 w-full min-w-0 rounded border border-navy/20 bg-transparent px-3 py-2 text-sm";

export default async function CrmSearchPreview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isLocalCrmPreview()) notFound();
  const raw = await searchParams;
  // New filters are validated locally before any production API deployment.
  const api = createCrmCatalogClient(fetch, "http://127.0.0.1:3005");
  let query: URLSearchParams | undefined;
  let result: Awaited<ReturnType<typeof api.list>> | undefined;
  let options: Awaited<ReturnType<typeof api.filters>> = [];
  let error: string | undefined;
  try {
    query = parseCrmSearch(raw);
    result = await api.list(query);
    options = await api.filters();
  } catch (failure) {
    result = undefined;
    error = failure instanceof CrmSearchInputError ? failure.message
      : failure instanceof CrmCatalogError && failure.reason === "rate_limit" ? "Muitas consultas. Aguarde um minuto e tente novamente."
      : "Não foi possível consultar o catálogo. Tente novamente em instantes.";
  }
  const selected = (key: string) => typeof raw[key] === "string" ? raw[key] : "";
  const choices = (key: "bairro" | "cidade" | "tipo" | "condominio") => [...new Set([...options.map(option => option[key]), selected(key)].filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return <main className="min-h-screen bg-offwhite text-navy">
    <header className="site-container flex items-center justify-between gap-4 border-b border-navy/10 py-5">
      <img src="/images/logo-navy.png" alt="Inglaterra Premium" className="h-12 w-auto max-w-[180px] object-contain" />
      <span className="text-xs">Prévia local</span>
    </header>
    <section className="site-container py-8">
      <h1 className="mb-6 text-3xl font-light">Imóveis</h1>
      <form action="/preview/crm/imoveis" method="get" className="border-y border-navy/10 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs">Negociação<select className={fieldClass} name="negocio" defaultValue={selected("negocio") || "Comprar"}><option>Comprar</option><option>Alugar</option></select></label>
          {([['cidade', 'Cidade'], ['bairro', 'Bairro'], ['tipo', 'Tipo'], ['condominio', 'Condomínio / edifício']] as const).map(([key, label]) => <label key={key} className="text-xs">{label}<select className={fieldClass} name={key} defaultValue={selected(key)}><option value="">Todos</option>{choices(key).map(value => <option key={value} value={value}>{value}</option>)}</select></label>)}
          {[["valorMinimo", "Preço mínimo (R$)"], ["valorMaximo", "Preço máximo (R$)"], ["areaMinima", "Área mínima (m²)"], ["areaMaxima", "Área máxima (m²)"], ["quartosMinimos", "Dormitórios mínimos"], ["suitesMinimas", "Suítes mínimas"], ["vagasMinimas", "Vagas mínimas"]].map(([key, label]) => <label key={key} className="text-xs">{label}<input className={fieldClass} name={key} type="number" min="0" step={['quartosMinimos', 'suitesMinimas', 'vagasMinimas'].includes(key) ? "1" : "0.000001"} defaultValue={selected(key)} /></label>)}
          <label className="text-xs">Ordenação<select name="order" className={fieldClass} defaultValue={selected("order") || "relevancia"}><option value="relevancia">Relevância</option><option value="menor_valor">Menor preço</option><option value="maior_valor">Maior preço</option><option value="mais_recentes">Mais recentes</option></select></label>
        </div>
        <div className="mt-5 flex items-center gap-5"><button className="rounded bg-navy px-6 py-3 text-sm text-white" type="submit">Buscar imóveis</button><Link className="text-sm underline" href="/preview/crm/imoveis">Limpar filtros</Link></div>
      </form>
      {error ? <p role="alert" className="py-8 text-sm">{error}</p> : null}
      {result && query ? <>
        <p className="py-6 text-sm" aria-live="polite">{result.total} {result.total === 1 ? "imóvel encontrado" : "imóveis encontrados"}</p>
        {result.items.length === 0 ? <p className="pb-12">Nenhum imóvel nesta página para os filtros selecionados.</p> : null}
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map(item => {
            const image = item.media.find(image => image.isPrimary) ?? item.media[0];
            const price = query!.get("negocio") === "Alugar" ? item.prices.rent : item.prices.sale;
            const size = item.areas.usable ?? item.areas.total;
            return <article key={item.publicCode} className="min-w-0">
              <div className="aspect-[4/3] overflow-hidden bg-navy/5">{image ? <img className="h-full w-full object-cover" src={image.url} alt={item.title} loading="lazy" /> : <div className="flex h-full items-center justify-center text-sm">Foto indisponível</div>}</div>
              <p className="mt-4 text-xs">Ref. {item.publicCode}</p>
              <p className="mt-2 text-xs">{item.location.officialNeighborhood}, {item.location.city}</p>
              <h2 className="mt-2 break-words text-lg font-normal leading-snug">{item.publicCode === "CA5278" ? <Link className="underline decoration-navy/30 underline-offset-4" href="/preview/crm/CA5278">{item.title}</Link> : item.title}</h2>
              <p className="mt-3 text-xs">{size ? `${formatCrmDecimal(size)} ${item.areas.unit === "ha" ? "ha" : item.areas.unit === "m2" ? "m²" : ""}` : "Área não informada"}{item.rooms.bedrooms !== null ? ` · ${item.rooms.bedrooms} dormitórios` : ""}{item.rooms.parkingSpaces !== null ? ` · ${item.rooms.parkingSpaces} vagas` : ""}</p>
              <p className="mt-3 break-words text-xl">{price ? `R$ ${formatCrmDecimal(price, 2)}` : "Preço não informado"}</p>
            </article>;
          })}
        </div>
        <nav aria-label="Paginação" className="mt-10 flex flex-wrap items-center gap-6 border-t border-navy/10 py-6">
          {result.page > 1 ? <Link className="text-sm underline" href={crmSearchPageHref(query, result.page - 1)}>Anterior</Link> : null}
          <span className="text-sm">Página {result.page}</span>
          {result.hasMore && result.page < 10000 ? <Link className="text-sm underline" href={crmSearchPageHref(query, result.page + 1)}>Próxima</Link> : null}
        </nav>
      </> : null}
    </section>
  </main>;
}
