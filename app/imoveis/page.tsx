import type { Metadata } from "next";
import { BuscaImoveisClient } from "@/components/search/BuscaImoveisClient";
import { getImoveisFilterOptions, searchImoveis } from "@/lib/queries/imoveis";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Busca de imóveis de alto padrão em Londrina | Inglaterra Premium",
  description:
    "Encontre casas, apartamentos, terrenos e imóveis premium em Londrina com filtros por bairro, tipo, valor e suítes.",
};

export default async function ImoveisPage() {
  const [options, initialImoveis] = await Promise.all([
    getImoveisFilterOptions(),
    searchImoveis({ negocio: "Comprar", order: "relevancia" }),
  ]);

  return (
    <BuscaImoveisClient
      bairros={options.bairros}
      initialImoveis={initialImoveis}
      tipos={options.tipos}
    />
  );
}
