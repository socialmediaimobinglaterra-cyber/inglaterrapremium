import type { Metadata } from "next";
import { BuscaImoveisClient } from "@/components/search/BuscaImoveisClient";
import { getImoveisFilterOptions, searchImoveis } from "@/lib/queries/imoveis";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imóveis para alugar em Londrina | Inglaterra Premium",
  description:
    "Encontre imóveis premium para locação em Londrina com filtros por bairro, tipo, valor e suítes.",
};

export default async function ImoveisAlugarPage() {
  const [options, initialImoveis] = await Promise.all([
    getImoveisFilterOptions(),
    searchImoveis({ negocio: "Alugar", order: "relevancia" }),
  ]);

  return (
    <BuscaImoveisClient
      bairros={options.bairros}
      initialImoveis={initialImoveis}
      initialNegocio="Alugar"
      tipos={options.tipos}
    />
  );
}
