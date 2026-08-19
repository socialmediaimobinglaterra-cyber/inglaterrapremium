import { getHeaderCondominios } from "@/lib/queries/condominios";
import { getHeaderLancamentos } from "@/lib/queries/lancamentos";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const [lancamentos, condominios] = await Promise.all([
    getHeaderLancamentos().catch(() => []),
    getHeaderCondominios().catch(() => []),
  ]);

  return <HeaderClient condominios={condominios} lancamentos={lancamentos} />;
}
