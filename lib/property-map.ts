import Supercluster from "supercluster";

export type MapProperty = { id: string; latitude: number; longitude: number };
export type MapDataset = { version: string; points: MapProperty[] };
export const MAP_MAX_ZOOM = 18;

export function createPropertyIndex(points: MapProperty[]) {
  return new Supercluster<{ id: string }>({ radius: 60, maxZoom: MAP_MAX_ZOOM }).load(
    points.map((point) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [point.longitude, point.latitude] },
      properties: { id: point.id },
    }))
  );
}

// `p<id>` carries a Sanity document _id (e.g. "gaia-AP1234"), not a UUID —
// changed when the map switched from Postgres rows to Sanity documents.
export function validMapSelection(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{16}:(?:[0-9]|1[0-8]):(?:c\d{1,12}|p[A-Za-z0-9_-]{1,128})$/.test(value);
}

export function resolveMapSelection(data: MapDataset, selection: string): string[] {
  if (!validMapSelection(selection)) return [];
  const [version, zoom, key] = selection.split(":");
  if (version !== data.version) return [];
  const index = createPropertyIndex(data.points);
  const feature = index.getClusters([-180, -85, 180, 85], Number(zoom)).find((item) =>
    "cluster" in item.properties
      ? key === `c${item.properties.cluster_id}`
      : key === `p${item.properties.id}`
  );
  if (!feature) return [];
  return "cluster" in feature.properties
    ? index.getLeaves(feature.properties.cluster_id, Infinity).map((item) => item.properties.id)
    : [feature.properties.id];
}
