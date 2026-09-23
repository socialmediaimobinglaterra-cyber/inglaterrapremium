import { createHash } from "node:crypto";
import { getPool } from "@/lib/db";
import type { MapDataset } from "@/lib/property-map";

export async function getPropertyMapData(negocio: "Comprar" | "Alugar"): Promise<MapDataset> {
  const price = negocio === "Alugar" ? "preco_locacao" : "preco_venda";
  const { rows } = await getPool().query<{ id: string; latitude: number; longitude: number }>(`
    select id, latitude::float8 as latitude, longitude::float8 as longitude
    from imoveis
    where ativo = true and ativo_no_site = true and ${price} is not null
      and latitude between -85 and 85 and longitude between -180 and 180
      and not (latitude = 0 and longitude = 0)
    order by id
  `);
  // Version the location dataset so old links cannot resolve to a different cluster.
  const version = createHash("sha256").update(JSON.stringify(rows)).digest("hex").slice(0, 16);
  return { version, points: rows };
}
