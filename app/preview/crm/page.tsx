import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { HomeHeroSearch } from "@/components/search/HomeHeroSearch";
import { canAccessCrmPreview } from "@/lib/crm-preview-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inglaterra Premium | Prévia CRM", robots: { index: false, follow: false } };

export default async function PreviewHome() {
  if (!await canAccessCrmPreview()) notFound();
  return <main className="bg-offwhite text-navy">
    <section className="relative min-h-[90svh] overflow-hidden bg-[#1e1e1e]">
      <img alt="Imóvel de alto padrão em Londrina" src="/images/capa-hero.jpg" className="absolute inset-0 h-full w-full object-cover opacity-75" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/30 via-navy/20 to-navy/75" />
      <div className="site-container relative flex min-h-[90svh] flex-col justify-end pb-10 pt-28 md:pb-24">
        <img src="/images/logo-white.png" alt="Inglaterra Premium" className="absolute top-6 h-10 w-auto" />
        <h1 className="mb-4 text-4xl font-light leading-[1.05] text-white md:text-6xl">Imóveis de alto padrão<br />em Londrina</h1>
        <p className="mb-9 text-lg font-light italic text-white/75 md:text-[22px]">Onde visão se torna patrimônio.</p>
        <HomeHeroSearch searchPath="/preview/crm/conversa" />
      </div>
    </section>
  </main>;
}
