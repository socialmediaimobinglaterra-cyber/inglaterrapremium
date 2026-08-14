import { getHeaderLancamentos } from "@/lib/queries/lancamentos";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const lancamentos = await getHeaderLancamentos().catch(() => []);

  return <HeaderClient lancamentos={lancamentos} />;
}
