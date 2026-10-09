import assert from "node:assert/strict";
import { test } from "node:test";
import { sanity } from "../lib/sanity";
import { isPremiumCondominio, publicCondominioDirectory, CONDOMINIO_PROPERTY_FILTER } from "../lib/premium-condominios";
import { getPublicCondominios, getHeaderCondominios, getCondominioBySlug, getCondominioImoveis, getRelatedCondominios } from "../lib/queries/condominios";
import sitemap from "../app/sitemap";

test("matches approved names and confirmed aliases, never approximate names", () => {
  for (const name of ["Alphaville Imbuias", "  CONDOMINIO ACACIA IMPERIAL ", "Sun Lake", "Residencial Athenas", "Residencial Terras de Canaã"])
    assert.equal(isPremiumCondominio(name), true, name);
  for (const name of ["Artesano", "Edifício Artesano", "Royal Maison Residence e Resort", "Alphaville III", "Atenas", "Via Bella"])
    assert.equal(isPremiumCondominio(name), false, name);
});

test("generates deterministic routes, preserves curated routes and separates duplicate records", () => {
  const rows = [
    { _id: "a", nome: "Sun Lake", slug: "sun-lake-original" },
    { _id: "b", nome: "Alphaville II", slug: null },
    { _id: "c", nome: "Residencial Terras de Canaã", slug: null },
    { _id: "d", nome: "Residencial Terras de Canaã", slug: null },
    { _id: "e", nome: "Royal Tennis", slug: null, ativo: false },
    { _id: "f", nome: "Edifício Artesano", slug: "artesano" },
  ];
  const result = publicCondominioDirectory(rows);
  assert.equal(result.length, 4);
  assert.equal(result[0].slug, "sun-lake-original");
  assert.equal(result[1].slug, "alphaville-ii");
  assert.equal(new Set(result.map((r) => r.slug)).size, 4);
  assert.deepEqual(publicCondominioDirectory([...rows].reverse()).reverse(), result);
});

test("menu, detail, related and sitemap share eligibility; property query keeps the value floor", async (t) => {
  const queries: string[] = [];
  t.mock.method(sanity, "fetch", async (query: string, params?: { ids?: string[]; id?: string; limit?: number }) => {
    queries.push(query);
    if (query.includes('_type == "bairro"')) return [];
    if (query.includes("_id, nome, ativo")) return [
      { _id: "sun", nome: "Sun Lake", slug: null },
      { _id: "empty", nome: "Via Felice", slug: null },
      { _id: "not-approved", nome: "Artesano", slug: "artesano" },
    ];
    if (query.includes("_id in $ids")) {
      assert.deepEqual(params?.ids, ["sun", "empty"]);
      assert(query.includes(CONDOMINIO_PROPERTY_FILTER));
      return [
        { _id: "sun", nome: "Sun Lake", cidade: "Londrina", bairro: "Sun Lake Residence", imoveisCount: 2,
          imagensUrls: [], imagensImoveis: ["https://cdn.sanity.io/property.jpg"], diferenciais: [] },
        { _id: "empty", nome: "Via Felice", imoveisCount: 0 },
      ];
    }
    if (query.includes("condominioRef._ref == $id")) {
      assert.equal(params?.id, "sun");
      assert(query.includes(CONDOMINIO_PROPERTY_FILTER));
      assert(query.includes("[0...$limit]"));
      return [];
    }
    return [];
  });
  const rows = await getPublicCondominios();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].image, "https://cdn.sanity.io/property.jpg");
  assert.equal(rows[0].imoveisCount, 2);
  assert.deepEqual(await getHeaderCondominios(), [{ label: "Sun Lake", href: "/condominios/sun-lake" }]);
  assert.equal(await getCondominioBySlug("artesano"), null);
  assert.equal(await getCondominioBySlug("via-felice"), null);
  const detail = await getCondominioBySlug("sun-lake");
  assert(detail);
  await getCondominioImoveis(detail);
  assert.deepEqual(await getRelatedCondominios("sun-lake"), []);
  const urls = (await sitemap()).map((row) => new URL(row.url).pathname);
  assert(urls.includes("/condominios/sun-lake"));
  assert(!urls.includes("/condominios/via-felice"));
  assert(!urls.includes("/condominios/artesano"));
  assert(queries.some((query) => query.includes("price >= 1000000 || rentPrice >= 4000")));
});
