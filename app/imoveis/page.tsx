import type { Metadata } from "next";
import { BuscaImoveisClient } from "@/components/search/BuscaImoveisClient";
import { getImoveisFilterOptions, searchImoveis } from "@/lib/queries/imoveis";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Busca de imóveis de alto padrão em Londrina | Inglaterra Premium",
  description:
    "Encontre casas, apartamentos, terrenos e imóveis premium em Londrina com filtros por bairro, tipo, valor e suítes.",
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function ImoveisPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [options, initialSearchPage] = await Promise.all([
    getImoveisFilterOptions(),
    searchImoveis({ negocio: "Comprar", order: "relevancia" }),
  ]);

  return (
    <BuscaImoveisClient
      bairros={options.bairros}
      initialSearchPage={initialSearchPage}
      initialNaturalQuery={params.q}
      tipos={options.tipos}
    />
  );
}
