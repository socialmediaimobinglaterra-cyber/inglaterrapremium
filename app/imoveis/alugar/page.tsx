import type { Metadata } from "next";
import { BuscaImoveisClient } from "@/components/search/BuscaImoveisClient";
import { getImoveisFilterOptions, searchImoveis } from "@/lib/queries/imoveis";
import { filtersFromSearchParams } from "@/lib/search-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imóveis para alugar em Londrina | Inglaterra Premium",
  description:
    "Encontre imóveis premium para locação em Londrina com filtros por bairro, tipo, valor e suítes.",
};

export default async function ImoveisAlugarPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialFilters = filtersFromSearchParams({ ...params, negocio: "Alugar" });
  const [options, initialSearchPage] = await Promise.all([
    getImoveisFilterOptions(),
    searchImoveis(initialFilters),
  ]);

  return (
    <BuscaImoveisClient
      bairros={options.bairros}
      condominios={options.condominios}
      initialSearchPage={initialSearchPage}
      initialNegocio="Alugar"
      initialFilters={initialFilters}
      initialMapSelection={initialFilters.mapSelection ?? undefined}
      initialNaturalQuery={typeof params.q === "string" ? params.q : undefined}
      key={JSON.stringify([initialFilters, params.q])}
      tipos={options.tipos}
    />
  );
}
