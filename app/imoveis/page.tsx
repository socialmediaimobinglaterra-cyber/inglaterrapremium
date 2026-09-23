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
    mapa?: string;
    negocio?: string;
  }>;
};

export default async function ImoveisPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const negocio = params.negocio === "Alugar" ? "Alugar" : "Comprar";
  const mapSelection = typeof params.mapa === "string" ? params.mapa.slice(0, 120) : undefined;
  const [options, initialSearchPage] = await Promise.all([
    getImoveisFilterOptions(),
    searchImoveis({ negocio, order: "relevancia", mapSelection }),
  ]);

  return (
    <BuscaImoveisClient
      bairros={options.bairros}
      initialSearchPage={initialSearchPage}
      key={`${negocio}:${mapSelection ?? ""}`}
      initialNegocio={negocio}
      initialMapSelection={mapSelection}
      initialNaturalQuery={params.q}
      tipos={options.tipos}
    />
  );
}
