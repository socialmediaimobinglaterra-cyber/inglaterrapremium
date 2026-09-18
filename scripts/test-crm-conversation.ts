import assert from "node:assert/strict";
import { POST as ai } from "../app/preview/crm/api/ai/route";
import { POST as search } from "../app/preview/crm/api/search/route";
import { conversationResults } from "../lib/crm-conversation";

async function run() {
  Object.assign(process.env, { NODE_ENV: "development", VERCEL: "", VERCEL_ENV: "", DATABASE_URL: "", OPENAI_API_KEY: "synthetic-test-key" });
  const originalFetch = globalThis.fetch;
  let completion = 0;
  let crmQuery = new URLSearchParams();
  let crmFailed = false;
  const fixture = {
    publicCode: "CA5278", unit: "premium", negotiation: "venda", title: "Teste", description: null, usageCategory: "residencial",
    prices: { sale: "900719925474099.99", rent: null, condominium: null, iptu: null },
    taxonomy: { normalizedType: "casa", normalizedSubtype: null },
    location: { officialNeighborhood: "Bairro teste", neighborhoodAlias: null, city: "Londrina", state: "PR" },
    areas: { unit: "ha", total: "2.50", usable: null, private: null },
    rooms: { bedrooms: 0, suites: 5, bathrooms: 1, livingRooms: null, parkingSpaces: 0 }, media: [],
    rawMetadata: { street: "PRIVATE_SENTINEL" },
  };
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.origin === "https://api.openai.com") {
      completion++;
      const body = JSON.parse(String(init?.body));
      const context = JSON.parse(body.messages[1].content);
      assert(!JSON.stringify(context).includes("PRIVATE_SENTINEL"));
      if (completion === 2) assert.equal(context.estado.condominio, "Condominio teste");
      const changes = completion === 1
        ? [{ campo: "condominio", acao: "definir", texto: "Condominio teste", numero: null }]
        : completion === 2 ? [{ campo: "suitesMinimas", acao: "definir", texto: null, numero: 5 }]
        : [{ campo: "condominio", acao: "remover", texto: null, numero: null }];
      return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ reiniciar: false, alteracoes: changes, naoInterpretado: [] }) } }] });
    }
    assert.equal(url.origin, "http://127.0.0.1:3005");
    assert.equal(init?.method, "GET");
    assert.equal(init?.headers, undefined);
    if (crmFailed) return new Response(null, { status: 503 });
    if (url.pathname.endsWith("/filters")) return Response.json({ items: [{ bairro: "Bairro teste", cidade: "Londrina", estado: "PR", tipo: "casa", condominio: "Condominio teste" }] });
    crmQuery = url.searchParams;
    return Response.json({ items: [fixture], total: 1, page: Number(crmQuery.get("page")), perPage: 24, hasMore: false });
  };
  const request = (path: string, body: unknown) => new Request(`http://localhost:3004/preview/crm/api/${path}`, { method: "POST", body: JSON.stringify(body) });
  try {
    let state = {};
    for (const query of ["Casa no Condominio teste", "Agora com 5 suites", "Tirar condominio"]) {
      const response = await ai(request("ai", { query, state }));
      const data = await response.json();
      assert(data.ok); state = data.filters;
      const results = await conversationResults({ ...state, page: 1, perPage: 24 });
      assert.equal(results.imoveis[0].crmDisplay?.price, "R$ 900.719.925.474.099,99");
      assert.equal(results.imoveis[0].crmDisplay?.area, "2,5 ha");
      assert.equal(results.imoveis[0].crmDisplay?.href, "/preview/crm/CA5278");
      assert(!JSON.stringify(results).includes("PRIVATE_SENTINEL"));
      if (completion === 2) { assert.equal(crmQuery.get("condominio"), "Condominio teste"); assert.equal(crmQuery.get("suitesMinimas"), "5"); }
      if (completion === 3) { assert.equal(crmQuery.has("condominio"), false); assert.equal(crmQuery.get("suitesMinimas"), "5"); }
    }
    assert.equal((await ai(request("ai", { query: "Mais uma", state }))).status, 429);
    assert.equal(completion, 3);
    await assert.rejects(conversationResults({ areaMinima: 2, areaMaxima: 1 }));
    await assert.rejects(conversationResults({ unknown: "value" }));
    crmFailed = true;
    const failed = await search(request("search", {}));
    assert.equal(failed.status, 503); assert.equal((await failed.json()).ok, false);
    Object.assign(process.env, { NODE_ENV: "production" });
    assert.equal((await ai(request("ai", { query: "teste" }))).status, 404);
    assert.equal((await search(request("search", {}))).status, 404);
    await assert.rejects(conversationResults({}));
    console.log("PASS: shared AI handler, cumulative state/removal, CRM GET-only, exact decimals, privacy, local quota, explicit failure and production gates (mocked OpenAI/CRM, no credentials/network)");
  } finally { globalThis.fetch = originalFetch; }
}
run().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : "CRM_CONVERSATION_TEST_FAILED"); process.exitCode = 1; });
