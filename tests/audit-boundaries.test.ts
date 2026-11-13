import * as policy from "../lib/runtime-policy";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash, webcrypto } from "node:crypto";
import * as cryptoModule from "node:crypto";
import vm from "node:vm";
import ts from "typescript";

// Integration boundaries use synthetic secrets, mocked database and mocked transports.
function load(path: string, modules: Record<string, unknown>, env: Record<string, string | undefined> = { VERCEL_ENV: "production", ADMIN_SESSION_SECRET: "synthetic-admin-test-key" }, extras = {}) {
  const module = { exports: {} as any };
  const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, Buffer, Response, Request, URL, TextEncoder,
    Uint8Array, btoa, atob, crypto: webcrypto, process: { env },
    require(name: string) {
      if (name === "server-only") return {};
      if (name.endsWith("/runtime-policy")) return { ...policy, adminSessionSecret: () => policy.adminSessionSecret(env), productionEffectsAllowed: () => policy.productionEffectsAllowed(env), requireProductionEffect: () => policy.requireProductionEffect(env) };
      if (name in modules) return modules[name];
      throw new Error(`Unexpected dependency: ${name}`);
    }, ...extras,
  });
  return module.exports;
}
const next = { NextResponse: { json: (value: unknown, init?: ResponseInit) => Response.json(value, init) } };


test("configured production sessions round-trip; tampered and extra-segment tokens fail", async () => {
  const session = load("lib/admin/session.ts", { "next/headers": {} });
  const token = await session.createAdminSessionToken({ userId: "synthetic", email: "test@example.invalid", role: "admin" });
  assert.equal((await session.verifyAdminSessionToken(token)).userId, "synthetic");
  assert.equal(await session.verifyAdminSessionToken(token + ".ignored"), null);
  assert.equal(await session.verifyAdminSessionToken(token + "wrong"), null);
  const absent = load("lib/admin/session.ts", { "next/headers": {} }, { KENLO_SYNC_SECRET: "synthetic-sync" });
  await assert.rejects(absent.createAdminSessionToken({ userId: "synthetic", email: "test@example.invalid", role: "admin" }));
});

test("Preview refuses OTP before looking up users, writing codes or sending email", async () => {
  const unexpected = () => { throw new Error("Side effect must not run"); };
  const auth = load("lib/admin/login-codes.ts", {
    "node:crypto": cryptoModule, "@/lib/admin/auth": { getAdminUserByEmail: unexpected, normalizeAdminEmail: unexpected },
    "@/lib/db": { getPool: unexpected },
  }, { VERCEL_ENV: "preview", RESEND_API_KEY: "synthetic" }, { fetch: unexpected });
  await assert.rejects(auth.requestLoginCode("test@example.invalid"), /bloqueada/);
  await assert.rejects(auth.verifyLoginCode("test@example.invalid", "123456"), /bloqueada/);
});

test("BTS is blocked in Preview even with a key; valid production sends through mocked Resend", async () => {
  for (const environment of ["preview", "production"]) {
    let calls = 0;
    const route = load("app/api/bts/contact/route.ts", {
      "next/server": next, "@/lib/site": { organization: { email: "test@example.invalid" } },
    }, { VERCEL_ENV: environment, RESEND_API_KEY: "synthetic" }, {
      fetch: async () => { calls++; return Response.json({ id: "synthetic" }); },
    });
    const body = new FormData();
    for (const [key, value] of Object.entries({ perfil: "empresa", nome: "Teste", whatsapp: "43000000000" })) body.set(key, value);
    const response = await route.POST(new Request("https://example.invalid/api/bts/contact", { method: "POST", body }));
    assert.equal(response.status, environment === "production" ? 200 : 503);
    assert.equal(calls, environment === "production" ? 1 : 0);
  }
});



test("private Blob proxy refuses Preview before attempting SDK access", async () => {
  let calls = 0;
  const route = load("app/api/blob-image/route.ts", {
    "next/server": { NextResponse: Response }, "@/lib/db": {}, "@/lib/admin/auth": {}, "@/lib/blob-policy": {},
    "@vercel/blob": { get: async () => { calls++; throw new Error("Unexpected SDK access"); } },
  }, { VERCEL_ENV: "preview", BLOB_READ_WRITE_TOKEN: "synthetic" });
  assert.equal((await route.GET({ nextUrl: new URL("https://example.invalid/api/blob-image") })).status, 403);
  assert.equal(calls, 0);
});

test("session rejects a token signed with the removed fallback secret", async () => {
  const session = load("lib/admin/session.ts", { "next/headers": {} }, {} as any);
  const payload = Buffer.from(JSON.stringify({ userId: "synthetic", email: "test@example.invalid", role: "admin", exp: Math.floor(Date.now()/1000)+60 })).toString("base64url");
  const signature = cryptoModule.createHmac("sha256", "dev-admin-session-secret-change-me").update(payload).digest("base64url");
  assert.equal(await session.verifyAdminSessionToken(`${payload}.${signature}`), null);
});


test("concurrent OTP verifications only accept one conditional consumption", async () => {
  let selects = 0;
  let updates = 0;
  let unblock!: () => void;
  const barrier = new Promise<void>(resolve => { unblock = resolve; });
  const auth = load("lib/admin/login-codes.ts", {
    "node:crypto": cryptoModule,
    "@/lib/admin/auth": { normalizeAdminEmail: (s: string) => s.trim().toLowerCase(), getAdminUserByEmail: async () => ({ id: "synthetic" }) },
    "@/lib/db": { getPool: () => ({ query: async (sql: string) => {
      if (sql.includes("select ctid")) {
        if (++selects === 2) unblock();
        await barrier;
        return { rows: [{ ctid: "(0,1)", code: createHash("sha256").update("123456").digest("hex") }] };
      }
      updates++;
      assert.match(sql, /used_at is null and expires_at > now/);
      return { rows: [], rowCount: updates === 1 ? 1 : 0 };
    } }) },
  });
  const results = await Promise.all([auth.verifyLoginCode("test@example.invalid", "123456"), auth.verifyLoginCode("test@example.invalid", "123456")]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(updates, 2);
});

test("BTS rejects missing fields and missing provider key without sending email", async () => {
  const route = load("app/api/bts/contact/route.ts", {
    "next/server": next, "@/lib/site": { organization: { email: "test@example.invalid" } },
  }, { VERCEL_ENV: "production", ADMIN_SESSION_SECRET: "synthetic-admin-test-key" }, { fetch: () => { throw new Error("Unexpected network call"); } });
  const request = (fields: Record<string, string>) => {
    const body = new FormData();
    for (const [key, value] of Object.entries(fields)) body.set(key, value);
    return new Request("https://example.invalid/api/bts/contact", { method: "POST", body });
  };
  assert.equal((await route.POST(request({}))).status, 400);
  assert.equal((await route.POST(request({ perfil: "empresa", nome: "Teste", whatsapp: "43000000000" }))).status, 503);
});

// Current Sanity architecture: all transports/DBs below are fake and fail on unexpected use.
test("Preview and unknown environments block all public side-effect endpoints before I/O", async () => {
  for (const env of [{ VERCEL_ENV: "preview" }, {}]) {
    for (const path of ["app/api/imoveis/ai/route.ts", "app/api/imoveis/contato/route.ts", "app/api/imoveis/salvar-busca/route.ts", "app/api/newsletter/route.ts"]) {
      const dependencies: Record<string, unknown> = { "next/server": next };
      for (const name of ["search-state", "analytics", "crm-conversation", "crm-preview", "crm-preview-access", "ai-search-support", "property-inquiry", "rd-contact-store", "queries/imoveis", "saved-search", "saved-search-store", "newsletter", "newsletter-store"]) dependencies[`@/lib/${name}`] = {};
      const route = load(path, dependencies, env);
      assert.equal((await route.POST(new Request("https://example.invalid/test", { method: "POST" }))).status, 503);
    }
  }
});

test("Preview banner action refuses before auth, DDL, Blob or database", async () => {
  const action = load("app/admin/banners/actions.ts", {
    "node:crypto": cryptoModule, sharp: {}, "@vercel/blob": {}, "next/cache": {},
    "@/lib/admin/auth": {}, "@/lib/admin/banners": {}, "@/lib/db": {}, "@/lib/home-banners": {},
  }, { VERCEL_ENV: "preview" });
  assert((await action.saveBannerAction({}, new FormData())).error);
});

test("Preview analytics and banner schema do not write; delivery stores deny direct invocation", async () => {
  const env = { VERCEL_ENV: "preview" };
  await load("lib/analytics.ts", { "@/lib/db": {} }, env).recordAnalyticsEvent({tipoEvento:"busca_realizada"});
  await load("lib/admin/banners.ts", { "@/lib/db": {} }, env).ensureBannerSchema();
  const rd = load("lib/rd-contact-store.ts", { "node:crypto": cryptoModule, "./db": {}, "./saved-search-delivery": {} }, env);
  await assert.rejects(rd.deliverRdContact({}, {}, "synthetic"), /bloqueada/);
  const saved = load("lib/saved-search-store.ts", { "node:crypto": cryptoModule, "./db": {}, "./saved-search-delivery": {}, "./saved-search": {} }, env);
  await assert.rejects(saved.deliverSavedSearch({}, {}, {}), /bloqueada/);
  const delivery = load("lib/saved-search-delivery.ts", { "./saved-search": {} }, env);
  await assert.rejects(delivery.sendLead("rd", {}, {}, () => { throw new Error("Unexpected send"); }), /bloqueada/);
});
