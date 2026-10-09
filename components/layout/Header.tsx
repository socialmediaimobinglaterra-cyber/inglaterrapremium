import { getSiteNavigation } from "@/lib/queries/navigation";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const { lancamentos, condominios } = await getSiteNavigation()
    .catch(() => ({ lancamentos: [], condominios: [] }));

  return <HeaderClient condominios={condominios} lancamentos={lancamentos} />;
}
