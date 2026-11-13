import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as newsletter from "../lib/newsletter";

test("newsletter requires explicit consent and normalizes email without extra fields", () => {
  assert.deepEqual(newsletter.parseNewsletter({ email: " Teste@Example.com ", consent: true, phone: "ignored" }), { email: "teste@example.com" });
  for (const value of [null, [], {}, { email: "a@b.com" }, { email: "a@b.com", consent: "true" }, { email: "invalid", consent: true }, { email: `${'a'.repeat(255)}@b.com`, consent: true }]) {
    assert.throws(() => newsletter.parseNewsletter(value));
  }
  const payload = newsletter.newsletterPayload("teste@example.com");
  assert.equal(payload.payload.conversion_identifier, "inglaterra-premium-newsletter");
  assert.equal(payload.payload.legal_bases[0].status, "granted");
  assert(!JSON.stringify(payload).includes("salva-busca"));
});

function storeHarness(initialState?: string, limited = false, initiallyLocked = false) {
  let record = initialState ? { state: initialState } : undefined;
  let locked = initiallyLocked;
  let released = 0;
  const calls: unknown[] = [];
  let response = "sent";
  const client = { release() { released++; }, async query(sql: string, params: any[] = []): Promise<any> {
    if (sql.includes("insert into rd_contact_quota")) return { rows: [{ attempts: limited ? 999 : 1, retry: 600 }] };
    if (sql.includes("pg_try_advisory_lock")) { const acquired = !locked; locked = true; return { rows: [{ acquired }] }; }
    if (sql.includes("pg_advisory_unlock")) { locked = false; return { rows: [] }; }
    if (sql.includes("insert into rd_contact_delivery")) {
      assert(!params.includes("teste@example.com"));
      assert.equal(params[1], newsletter.NEWSLETTER_CONSENT_VERSION);
      assert.equal(params[2], newsletter.NEWSLETTER_CONSENT);
      record ??= { state: "pending" };
    }
    if (sql.includes("select state")) return { rows: [record] };
    if (sql.includes("update rd_contact_delivery set state=")) record!.state = params[1] ?? "uncertain";
    return { rows: [] };
  } };
  const mod = { exports: {} as any };
  vm.runInNewContext(ts.transpileModule(readFileSync("lib/rd-contact-store.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module: mod, exports: mod.exports, process: { env: {} }, console: { info() {} }, require(name: string) {
      if (name.endsWith("/runtime-policy")) return { productionEffectsAllowed: () => true, requireProductionEffect: () => {} };
      if (name === "node:crypto") return require("node:crypto");
      if (name === "./newsletter") return newsletter;
      if (name === "./db") return { getPool: () => ({ query: async () => ({}), connect: async () => client }) };
      if (name === "./saved-search-delivery") return { sendLead: async (destination: string, payload: unknown) => {
        assert.equal(record!.state, "uncertain", "persist before dispatch");
        assert.equal(destination, "rd"); calls.push(payload); return response;
      } };
      throw new Error(name);
    },
  });
  return { calls, released: () => released, setResponse(value: string) { response = value; },
    run: () => mod.exports.deliverRdContact(new Request("https://example.com/api/newsletter"), {
      fingerprint: `${newsletter.NEWSLETTER_CONSENT_VERSION}:teste@example.com`,
      consentVersion: newsletter.NEWSLETTER_CONSENT_VERSION, consent: newsletter.NEWSLETTER_CONSENT,
      payload: newsletter.newsletterPayload("teste@example.com"),
    }, "test-key") };
}

test("newsletter sends once and suppresses repeated confirmed subscriptions", async () => {
  const h = storeHarness();
  assert.equal((await h.run()).status, 200);
  assert.equal((await h.run()).status, 200);
  assert.equal(h.calls.length, 1);
  assert.equal(h.released(), 2);
});

test("newsletter avoids blind retries for ambiguous responses, but retries explicit rejection", async () => {
  const h = storeHarness();
  h.setResponse("uncertain");
  assert.equal((await h.run()).status, 202);
  assert.equal((await h.run()).status, 202);
  assert.equal(h.calls.length, 1);
  const rejected = storeHarness();
  rejected.setResponse("rejected");
  assert.equal((await rejected.run()).status, 502);
  rejected.setResponse("sent");
  assert.equal((await rejected.run()).status, 200);
});

test("newsletter quota and simultaneous lock prevent outbound calls", async () => {
  const limited = storeHarness(undefined, true);
  assert.equal((await limited.run()).status, 429);
  assert.equal(limited.calls.length, 0);
  const locked = storeHarness(undefined, false, true);
  assert.equal((await locked.run()).status, 409);
  assert.equal(locked.calls.length, 0);
});

function routeHarness(configured = true, status = 200) {
  const calls: unknown[] = [];
  const mod = { exports: {} as any };
  vm.runInNewContext(ts.transpileModule(readFileSync("app/api/newsletter/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module: mod, exports: mod.exports, Buffer, URL, SyntaxError, Error, console: { error() {} },
    process: { env: configured ? { RD_STATION_API_KEY: "test-only", DATABASE_URL: "test-only" } : {} },
    require(name: string) {
      if (name.endsWith("/runtime-policy")) return { productionEffectsAllowed: () => true, requireProductionEffect: () => {} };
      if (name === "next/server") return { NextResponse: { json: Response.json } };
      if (name === "@/lib/newsletter") return newsletter;
      if (name === "@/lib/newsletter-store") return { subscribeNewsletter: async (_request: Request, email: string, _key: string, attribution: unknown) => { calls.push({ email, attribution }); return { status, message: "test" }; } };
      throw new Error(name);
    },
  });
  return { calls, run: (body: string, headers: Record<string,string> = {}) => mod.exports.POST(new Request("https://example.com/api/newsletter", {
    method: "POST", headers: { origin: "https://example.com", "content-type": "application/json", ...headers }, body,
  })) as Promise<Response> };
}

test("newsletter endpoint rejects missing config, foreign origin, invalid consent and oversized body", async () => {
  const body = JSON.stringify({ email: "teste@example.com", consent: true });
  assert.equal((await routeHarness(false).run(body)).status, 503);
  const h = routeHarness();
  assert.equal((await h.run(body, { origin: "https://other.example" })).status, 403);
  assert.equal((await h.run(body, { "content-type": "text/plain" })).status, 415);
  assert.equal((await h.run('{')).status, 400);
  assert.equal((await h.run(JSON.stringify({email:"teste@example.com"}))).status, 400);
  assert.equal((await h.run('x'.repeat(2049))).status, 413);
  assert.equal(h.calls.length, 0);
  assert.equal((await h.run(body)).status, 200);
  assert.equal(h.calls.length, 1);
  const pending = await routeHarness(true, 202).run(body);
  assert.equal((await pending.json()).ok, false);
});

test("newsletter endpoint forwards only validated attribution to delivery", async () => {
  const h = routeHarness();
  const result = await h.run(JSON.stringify({ email: "teste@example.com", consent: true, attribution: {
    traffic_source: "instagram", traffic_medium: "paid_social", traffic_campaign: "premium",
    conversion_identifier: "site-matriz-newsletter", url: "https://private.example/",
  } }));
  assert.equal(result.status, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls)), [{ email: "teste@example.com", attribution: {
    traffic_source: "instagram", traffic_medium: "paid_social", traffic_campaign: "premium",
  } }]);
});
