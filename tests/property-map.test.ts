import assert from "node:assert/strict";
import { test } from "node:test";
import { Pool } from "pg";
import { createPropertyIndex, resolveMapSelection, validMapSelection, type MapDataset } from "../lib/property-map";
import { getPropertyMapData } from "../lib/queries/property-map";
import { searchImoveis } from "../lib/queries/imoveis";

const data: MapDataset = {
  version: "0123456789abcdef",
  points: [0, 1, 2].map((i) => ({
    id: `00000000-0000-4000-8000-00000000000${i}`,
    latitude: -23.33 + i * 0.01, longitude: -51.18 + i * 0.01,
  })),
};
const world: [number, number, number, number] = [-180, -85, 180, 85];

test("zoom changes grouping; every pin resolves to its exact members", () => {
  const index = createPropertyIndex(data.points);
  assert.equal(index.getClusters(world, 3).length, 1);
  assert.equal(index.getClusters(world, 18).length, 3);
  for (const zoom of [3, 12, 18]) {
    const ids: string[] = [];
    for (const feature of index.getClusters(world, zoom)) {
      const p = feature.properties;
      const key = "cluster" in p ? `c${p.cluster_id}` : `p${p.id}`;
      const members = resolveMapSelection(data, `${data.version}:${zoom}:${key}`);
      assert.equal(members.length, "cluster" in p ? p.point_count : 1);
      ids.push(...members);
    }
    assert.deepEqual(ids.sort(), data.points.map((p) => p.id).sort());
  }
});

test("coincident coordinates stay grouped; stale or invalid links never broaden the search", () => {
  const same = { ...data, points: data.points.map((p) => ({ ...p, latitude: -23.33, longitude: -51.18 })) };
  const feature = createPropertyIndex(same.points).getClusters(world, 18)[0];
  assert.ok("cluster" in feature.properties);
  const selection = `${same.version}:18:c${feature.properties.cluster_id}`;
  assert.equal(resolveMapSelection(same, selection).length, 3);
  assert.deepEqual(resolveMapSelection({ ...same, version: "fedcba9876543210" }, selection), []);
  for (const value of [null, {}, "bad", `${data.version}:99:c1`, `${data.version}:3:c999999`]) {
    if (typeof value === "string") assert.deepEqual(resolveMapSelection(data, value), []);
    else assert.equal(validMapSelection(value), false);
  }
});

test("SQL limits pins to visible geolocated properties and preserves exact selection for count, sort and pagination", async (t) => {
  const originalUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/test";
  t.after(() => { if (originalUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = originalUrl; });
  const calls: { sql: string; values: unknown[] }[] = [];
  t.mock.method(Pool.prototype, "query", async (sql: string, values: unknown[] = []) => {
    calls.push({ sql, values });
    if (sql.includes("latitude::float8")) return { rows: data.points };
    if (sql.includes("count(*)")) return { rows: [{ total: 3 }] };
    return { rows: [] };
  });
  const dataset = await getPropertyMapData("Comprar");
  assert.match(calls[0].sql, /ativo = true and ativo_no_site = true and preco_venda is not null/);
  assert.match(calls[0].sql, /latitude between -85 and 85/);
  assert.match(calls[0].sql, /not \(latitude = 0 and longitude = 0\)/);
  const feature = createPropertyIndex(dataset.points).getClusters(world, 3)[0];
  assert.ok("cluster" in feature.properties);
  const selection = `${dataset.version}:3:c${feature.properties.cluster_id}`;
  const result = await searchImoveis({ mapSelection: selection, negocio: "Comprar", order: "menor_valor" }, { page: 2, perPage: 1 });
  assert.equal(result.total, 3);
  const count = calls.at(-2)!;
  const list = calls.at(-1)!;
  assert.match(count.sql, /id = any\(\$1::uuid\[\]\)/);
  assert.deepEqual(count.values[0], list.values[0]);
  assert.deepEqual([...(count.values[0] as string[])].sort(), data.points.map((p) => p.id).sort());
  assert.match(list.sql, /preco_venda asc nulls last, id asc/);
  assert.deepEqual(list.values.slice(-2), [1, 1]);
  await searchImoveis({ mapSelection: "invalid" });
  assert.deepEqual(calls.at(-1)!.values[0], []);
  await getPropertyMapData("Alugar");
  assert.match(calls.at(-1)!.sql, /preco_locacao is not null/);
});
