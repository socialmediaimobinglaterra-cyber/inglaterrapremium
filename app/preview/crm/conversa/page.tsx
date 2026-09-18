import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { BuscaImoveisClient } from "@/components/search/BuscaImoveisClient";
import { conversationResults, conversationVocabulary } from "@/lib/crm-conversation";
import { canAccessCrmPreview } from "@/lib/crm-preview-access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Busca | Prévia CRM", robots: { index: false, follow: false } };

export default async function Conversation({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  if (!await canAccessCrmPreview()) notFound();
  const { q } = await searchParams;
  try {
    const initial = await conversationResults({ negocio: "Comprar" });
    const vocabulary = await conversationVocabulary();
    return <><header className="site-container py-5"><Link href="/preview/crm"><img src="/images/logo-navy.png" alt="Inglaterra Premium" className="h-12 w-auto" /></Link></header><BuscaImoveisClient crmPreview initialSearchPage={initial} initialNaturalQuery={typeof q === "string" ? q : undefined} bairros={vocabulary.bairro} tipos={vocabulary.tipo} /></>;
  } catch {
    return <main className="site-container py-16"><p role="alert">Não foi possível consultar o CRM. Tente novamente em instantes.</p><Link href="/preview/crm">Voltar</Link></main>;
  }
}
