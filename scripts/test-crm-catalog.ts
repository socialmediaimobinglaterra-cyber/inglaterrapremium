import assert from "node:assert/strict";
import { createCrmCatalogClient, parseCrmProperty, CrmCatalogError } from "../lib/crm-catalog";
import { formatCrmDecimal, isLocalCrmPreview } from "../lib/crm-preview";
import { parseCrmSearch, crmSearchPageHref } from "../lib/crm-search";

const fixture = {
  publicCode: "CA9999", unit: "premium", negotiation: "venda", title: "Imovel sintetico", description: null, usageCategory: "residencial",
  prices: { sale: "900719925474099.99", rent: null, condominium: null, iptu: null },
  taxonomy: { normalizedType: "casa", normalizedSubtype: null },
  location: { officialNeighborhood: "Bairro teste", neighborhoodAlias: null, city: "Cidade teste", state: "PR" },
  areas: { unit: "ha", total: "2.50", usable: null, private: null },
  rooms: { bedrooms: 0, suites: 0, bathrooms: 1, livingRooms: null, parkingSpaces: 0 },
  media: [{ kind: "photo", order: 0, isPrimary: true, url: "https://admin.inglaterrapremium.com.br/api/blob-image/public/premium/11111111-1111-4111-8111-111111111111" }],
  privateLocation: { street: "PRIVATE_SENTINEL" }, rawMetadata: { phone: "PRIVATE_SENTINEL" },
};

async function run() {
  const query = parseCrmSearch({ condominio: 'Edificio teste', areaMaxima: '20000', valorMinimo: "900719925474099.1", valorMaximo: "900719925474099.2", quartosMinimos: "0" });
  assert.equal(query.get("valorMinimo"), "900719925474099.1");
  assert.equal(query.get("condominio"), "Edificio teste");
  assert.equal(query.get("areaMaxima"), "20000");
  assert.equal(query.get("quartosMinimos"), "0");
  assert.equal(query.get("perPage"), "24");
  assert(crmSearchPageHref(query, 2).includes("page=2"));
  assert(!crmSearchPageHref(query, 2).includes("perPage"));
  for (const bad of [{ areaMinima: '101', areaMaxima: '100' }, { page: "0" }, { page: ["1", "2"] }, { quartosMinimos: "1.5" }, { valorMinimo: "10", valorMaximo: "9" }, { valorMinimo: "1e6" }, { unknown: "x" }]) assert.throws(() => parseCrmSearch(bad));
  assert.equal(formatCrmDecimal("900719925474099.99", 2), "900.719.925.474.099,99");
  assert.equal(formatCrmDecimal("2.500"), "2,5");
  assert.equal(formatCrmDecimal("12", 2), "12,00");
  assert(isLocalCrmPreview({ NODE_ENV: "development" }));
  assert(!isLocalCrmPreview({ NODE_ENV: "production" }));
  assert(!isLocalCrmPreview({ NODE_ENV: "development", VERCEL_ENV: "preview" }));
  const item = parseCrmProperty(fixture);
  assert.equal(item.prices.sale, fixture.prices.sale);
  assert.equal(item.areas.unit, "ha"); assert.equal(item.rooms.bedrooms, 0);
  assert(!JSON.stringify(item).includes("PRIVATE_SENTINEL"));
  for (const value of [-1, "-1", "0", "1e6", "NaN", "Infinity"]) assert.throws(() => parseCrmProperty({ ...fixture, prices: { ...fixture.prices, sale: value } }));
  assert.throws(() => parseCrmProperty({ ...fixture, unit: "matriz" }));
  assert.throws(() => parseCrmProperty({ ...fixture, negotiation: "locacao" }));
  assert.throws(() => parseCrmProperty({ ...fixture, media: [{ ...fixture.media[0], url: "http://example.invalid/image.jpg" }] }));
  assert.throws(() => parseCrmProperty({ ...fixture, media: [fixture.media[0], fixture.media[0]] }));
  let calls = 0;
  const client = createCrmCatalogClient(async (input, options) => {
    calls++; assert(String(input).startsWith("https://admin.inglaterrapremium.com.br/api/catalog/premium/"));
    assert.equal(options?.cache, "no-store"); assert.equal(options?.redirect, "error"); assert.equal(options?.method, "GET");
    assert.equal(options?.headers, undefined);
    return Response.json(fixture);
  });
  await client.detail("CA9999"); await client.detail("CA9999"); assert.equal(calls, 2);
  await assert.rejects(client.detail("../admin"));
  await assert.rejects(client.list(new URLSearchParams("unknown=Teste")));
  await assert.rejects(client.list(new URLSearchParams("page=1&page=2")));
  assert.equal(calls, 2);
  const missing = createCrmCatalogClient(async () => new Response(null, { status: 404 }));
  assert.equal(await missing.detail("CA9999"), null); await assert.rejects(missing.list());
  for (const status of [429, 500, 503]) await assert.rejects(createCrmCatalogClient(async () => new Response("PRIVATE_SENTINEL", { status })).detail("CA9999"), error => error instanceof CrmCatalogError && !error.message.includes("PRIVATE_SENTINEL"));
  await assert.rejects(createCrmCatalogClient(async () => new Response("not json")).detail("CA9999"));
  const list = await createCrmCatalogClient(async () => Response.json({ items: [fixture], total: 1, page: 1, perPage: 24, hasMore: false })).list();
  assert.equal(list.items.length, 1);
  console.log("PASS: decimal preservation, private-field projection, media gate, GET/no-store, missing versus failure, unsupported filters and response validation");
  if (process.argv.includes("--live")) {
    const real = await createCrmCatalogClient().detail("CA5278");
    assert(real); console.log(`LIVE: CA5278 parsed, ${real.media.length} photos; no property modified`);
  }
}
run().catch(() => { console.error("CRM_CATALOG_TEST_FAILED"); process.exitCode = 1; });
