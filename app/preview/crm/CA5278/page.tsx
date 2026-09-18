import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LancamentoGallery } from "@/components/lancamentos/LancamentoGallery";
import { createCrmCatalogClient } from "@/lib/crm-catalog";
import { formatCrmDecimal } from "@/lib/crm-preview";
import { canAccessCrmPreview } from "@/lib/crm-preview-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "CA5278 | Previa CRM",
  robots: { index: false, follow: false },
};

export default async function CrmPropertyPreview() {
  if (!await canAccessCrmPreview()) notFound();
  let property;
  try { property = await createCrmCatalogClient().detail("CA5278"); }
  catch {
    return <main className="site-container py-16"><h1 className="text-2xl font-light">Catálogo temporariamente indisponível</h1><p className="mt-4">Não foi possível carregar o imóvel. Tente novamente em instantes.</p></main>;
  }
  if (!property) notFound();
  const ordered = [...property.media].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.order - b.order);
  const images = ordered.map((image, index) => ({ url: image.url, alt: `${property.title} - foto ${index + 1}` }));
  const areaUnit = property.areas.unit === "m2" ? "m²" : property.areas.unit === "ha" ? "ha" : "";
  const areaFacts = [
    ["Área privativa", property.areas.private], ["Área útil", property.areas.usable], ["Área total", property.areas.total],
  ].filter(([, value]) => value !== null).map(([label, value]) => ({ label, value: `${formatCrmDecimal(value!)} ${areaUnit}`.trim() }));
  const facts = [
    ...areaFacts,
    { label: "Dormitórios", value: property.rooms.bedrooms }, { label: "Suítes", value: property.rooms.suites },
    { label: "Banheiros", value: property.rooms.bathrooms }, { label: "Salas", value: property.rooms.livingRooms },
    { label: "Vagas", value: property.rooms.parkingSpaces },
  ].filter(fact => fact.value !== null);
  return (
    <main className="min-h-screen bg-offwhite text-navy">
      <header className="site-container flex items-center justify-between gap-4 border-b border-navy/10 py-5">
        <img src="/images/logo-navy.png" alt="Inglaterra Premium" className="h-12 w-auto max-w-[180px] object-contain" />
        <Link href="/preview/crm/conversa" className="text-xs underline">Voltar à busca</Link>
      </header>
      <section className="site-container pt-6 [&_button]:min-h-0 [&_div]:min-h-0" aria-label="Fotos do imóvel">
        {images.length ? <LancamentoGallery images={images} nome={property.title} /> : <p className="py-16 text-center">Fotos indisponíveis.</p>}
      </section>
      <div className="site-container grid gap-8 py-8 md:grid-cols-[1.6fr_1fr] md:gap-16 md:py-14">
        <div className="min-w-0">
          <p className="mb-3 text-sm capitalize text-terra">{property.taxonomy.normalizedType} · {property.negotiation === "venda_locacao" ? "Venda e locação" : property.negotiation === "locacao" ? "Locação" : "Venda"}</p>
          <h1 className="mb-4 break-words text-3xl font-light leading-tight md:text-4xl">{property.title}</h1>
          <p className="mb-3 text-sm">Referência: {property.publicCode}</p>
          <p className="mb-8 text-sm">{property.location.officialNeighborhood}, {property.location.city} / {property.location.state}</p>
          <dl className="mb-10 grid grid-cols-2 gap-4 border-y border-navy/10 py-6 sm:grid-cols-3">
            {facts.map(fact => <div key={fact.label} className="min-w-0"><dt className="text-xs">{fact.label}</dt><dd className="mt-1 break-words text-xl font-light">{fact.value}</dd></div>)}
          </dl>
          {property.description ? <section><h2 className="mb-4 text-lg font-medium">Sobre o imóvel</h2><p className="whitespace-pre-line break-words text-sm leading-7">{property.description}</p></section> : null}
        </div>
        <aside className="min-w-0 border-t border-navy/10 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0" aria-label="Valores do imóvel">
          <dl className="space-y-6">
            {[["Venda", property.prices.sale], ["Locação", property.prices.rent], ["Condomínio", property.prices.condominium], ["IPTU", property.prices.iptu]].filter(([, value]) => value !== null).map(([label, value]) => (
              <div key={label}><dt className="text-sm">{label}</dt><dd className="mt-1 break-words text-2xl font-light">R$ {formatCrmDecimal(value!, 2)}</dd></div>
            ))}
          </dl>
        </aside>
      </div>
    </main>
  );
}
