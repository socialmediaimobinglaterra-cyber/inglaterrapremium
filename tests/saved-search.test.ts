import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { parseSavedSearch, searchProfile } from "../lib/saved-search";
import { leadPayloads, sendLead } from "../lib/saved-search-delivery";
import * as profile from "../lib/saved-search";

const input = { name: "Cliente Teste", email: "teste@example.com", phone: "(43) 99999-0000", consent: true,
  filters: { negocio: "Alugar", bairro: "Terra Bonita", condominio: "Royal Park", tipo: "casa", valorMinimo: 4000, valorMaximo: 9000, quartosMinimos: 3, suitesMinimas: 2, vagasMinimas: 2, areaMinima: 100, areaMaxima: 300, mobiliado: true } };
const secrets = { central: "test-only-central", rd: "test-only-rd" };

test("validates consent, contacts and intervals; only forwards structured filters", () => {
  const lead = parseSavedSearch({ ...input, filters: { ...input.filters, history: ["private"], fotos: ["private"] } });
  assert.equal(lead.phone, "+5543999990000");
  assert.equal(searchProfile(lead.filters).length, 12);
  assert(!JSON.stringify(lead).includes("private"));
  for (const patch of [{ consent: false }, { phone: "123" }, { email: "invalid" }, { name: "a" }, { filters: { valorMinimo: 10, valorMaximo: 1 } }, { filters: { suitesMinimas: -1 } }, { filters: { mapSelection: "cluster" } }]) {
    assert.throws(() => parseSavedSearch({ ...input, ...patch }));
  }
});

test("both payloads contain the profile; central has audit consent and RD uses standard fields", () => {
  const data = leadPayloads(parseSavedSearch(input), "2026-11-05T10:00:00Z", "protocol");
  assert.match(data.central.notes, /Consentimento: 2026/);
  assert.match(data.central.interest, /Terra Bonita/);
  assert.equal(data.rd.payload.tags.length, 14);
  assert.equal(data.rd.payload.legal_bases[0].status, "granted");
  assert.equal(data.rd.payload.conversion_identifier, "inglaterra-premium-salva-busca");
});

test("central secret is header-only and no redirects are followed", async () => {
  const state = await sendLead("central", {}, secrets, async (url, init) => {
    assert(!String(url).includes(secrets.central));
    assert.equal((init?.headers as Record<string, string>)["X-Integration-Token"], secrets.central);
    assert.equal(init?.redirect, "error");
    return Response.json({ ok: true, result: "created", reason: null, conversation_id: "test-id" });
  });
  assert.equal(state, "sent");
});

test("HTTP 200 rejection is not success; unknown responses and timeouts require verification", async () => {
  for (const body of [{ ok: false, result: "error", reason: "sem telefone" }, { ok: true, result: "ignored", reason: "integração desativada" }, { ok: false, result: "error", reason: "caixa não configurada" }]) {
    assert.equal(await sendLead("central", {}, secrets, async () => Response.json(body)), "rejected");
  }
  assert.equal(await sendLead("central", {}, secrets, async () => Response.json({})), "uncertain");
  assert.equal(await sendLead("rd", {}, secrets, async () => Response.json({ event_uuid: "test" })), "sent");
  assert.equal(await sendLead("central", {}, secrets, async () => Response.json({ ok: true, result: "updated", conversation_id: "test-id" })), "sent");
  assert.equal(await sendLead("central", {}, secrets, async () => Response.json({ ok: true, result: "created", conversation_id: null })), "uncertain");
  assert.equal(await sendLead("rd", {}, secrets, async () => Response.json({}, { status: 400 })), "rejected");
  assert.equal(await sendLead("rd", {}, secrets, async () => Response.json({}, { status: 500 })), "uncertain");
  assert.equal(await sendLead("rd", {}, secrets, async () => { throw new Error("network"); }), "uncertain");
});

function storeHarness(options: { limited?: boolean; locked?: boolean; central?: string } = {}) {
  let record: any;
  let locked = options.locked ?? false;
  const calls: string[] = [];
  let rdFails = true;
  const client = { release() {}, async query(sql: string, params: any[] = []): Promise<any> {
    if (sql.includes("insert into saved_search_quota")) return { rows: [{ attempts: options.limited ? 999 : 1, retry: 600 }] };
    if (sql.includes("pg_try_advisory_lock")) { const acquired = !locked; locked = true; return { rows: [{ acquired }] }; }
    if (sql.includes("pg_advisory_unlock")) { locked = false; return { rows: [] }; }
    if (sql.includes("insert into saved_search_delivery")) record ??= { reference: params[1], created_at: new Date(), central: "pending", rd: "pending" };
    if (sql.includes("select * from saved_search_delivery")) return { rows: [record] };
    if (sql.includes("update saved_search_delivery set")) { const key = sql.includes("set central") ? "central" : "rd"; record[key] = params[1] ?? "uncertain"; }
    return { rows: [] };
  } };
  const mod = { exports: {} as any };
  const code = ts.transpileModule(readFileSync("lib/saved-search-store.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module: mod, exports: mod.exports, Date, console: { info() {} }, process: { env: {} }, require(name: string) {
    if (name === "node:crypto") return require("node:crypto");
    if (name === "./db") return { getPool: () => ({ query: async () => ({}), connect: async () => client }) };
    if (name === "./saved-search") return profile;
    if (name === "./saved-search-delivery") return { leadPayloads, sendLead: async (destination: string) => { calls.push(destination); return destination === "central" && options.central ? options.central : destination === "rd" && rdFails ? "failed" : "sent"; } };
    throw new Error(name);
  } });
  return { calls, recover() { rdFails = false; }, run: () => mod.exports.deliverSavedSearch(new Request("https://example.com"), parseSavedSearch(input), secrets) };
}

test("retry sends only failed destination and duplicate successful request sends nothing", async () => {
  const h = storeHarness();
  assert.equal((await h.run()).status, 502);
  h.recover();
  assert.equal((await h.run()).status, 200);
  assert.deepEqual(h.calls, ["central", "rd", "rd"]);
  assert.equal((await h.run()).status, 200);
  assert.deepEqual(h.calls, ["central", "rd", "rd"]);
});

test("quotas and concurrent lock prevent dispatch", async () => {
  for (const [options, status] of [[{ limited: true }, 429], [{ locked: true }, 409]] as const) {
    const h = storeHarness(options);
    assert.equal((await h.run()).status, status);
    assert.equal(h.calls.length, 0);
  }
});

test("rejected and ambiguous deliveries are not resent on another submission", async () => {
  for (const central of ["rejected", "uncertain"]) {
    const h = storeHarness({ central }); h.recover();
    const first = await h.run();
    assert.equal(first.status, central === "rejected" ? 422 : 202);
    assert.equal((await h.run()).status, first.status);
    assert.deepEqual(h.calls, ["central", "rd"]);
  }
});

test("endpoint rejects foreign origins, oversized bodies and invalid inputs before delivery", async () => {
  const calls: unknown[] = [];
  const mod = { exports: {} as any };
  const code = ts.transpileModule(readFileSync("app/api/imoveis/salvar-busca/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module: mod, exports: mod.exports, Buffer, URL, Error, SyntaxError, console, process: { env: { CENTRAL_INTEGRATION_TOKEN: "test", RD_STATION_API_KEY: "test" } }, require(name: string) {
    if (name === "next/server") return { NextResponse: { json: Response.json } };
    if (name === "@/lib/saved-search") return profile;
    if (name === "@/lib/saved-search-store") return { deliverSavedSearch: async (...args: unknown[]) => { calls.push(args); return { status: 200, message: "ok" }; } };
    throw new Error(name);
  } });
  const request = (body: unknown, origin = "https://example.com") => new Request("https://example.com/api/imoveis/salvar-busca", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
  assert.equal((await mod.exports.POST(request(input, "https://other.test"))).status, 403);
  assert.equal((await mod.exports.POST(request({ name: "x".repeat(9000) }))).status, 413);
  assert.equal((await mod.exports.POST(request({ ...input, consent: false }))).status, 400);
  assert.equal(calls.length, 0);
  assert.equal((await mod.exports.POST(request(input))).status, 200);
  assert.equal(calls.length, 1);
});
