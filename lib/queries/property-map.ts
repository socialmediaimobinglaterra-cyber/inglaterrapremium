import { createHash } from "node:crypto";
import { sanity } from "@/lib/sanity";
import type { MapDataset } from "@/lib/property-map";

export async function getPropertyMapData(negocio: "Comprar" | "Alugar"): Promise<MapDataset> {
  const priceField = negocio === "Alugar" ? "rentPrice" : "price";
  const rows = await sanity.fetch<Array<{ id: string; latitude: number; longitude: number }>>(
    `*[_type == "property" && status == "ativo" && publicarSite == true
        && defined(${priceField}) && defined(latitude) && defined(longitude)
        && latitude >= -85 && latitude <= 85
        && longitude >= -180 && longitude <= 180
        && !(latitude == 0 && longitude == 0)
      ] | order(_id asc) { "id": _id, latitude, longitude }`
  );
  // Version the location dataset so old links cannot resolve to a different cluster.
  const version = createHash("sha256").update(JSON.stringify(rows)).digest("hex").slice(0, 16);
  return { version, points: rows };
}
