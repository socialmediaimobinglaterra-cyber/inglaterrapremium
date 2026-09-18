import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";
import { canAccessCrmPreview } from "../lib/crm-preview-access";

async function run() {
  Object.assign(process.env, { NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "production", ADMIN_SESSION_SECRET: "", KENLO_SYNC_SECRET: "" });
  const url = "https://site.example/preview/crm/api/ai";
  const request = (origin = "https://site.example") => new Request(url, { method: "POST", headers: { origin } });
  let reads = 0;
  const admin = async () => { reads++; return { role: "admin" }; };
  assert.equal(await canAccessCrmPreview(request(), admin), false);
  assert.equal(reads, 0);
  process.env.ADMIN_SESSION_SECRET = "synthetic-preview-test-secret-not-a-real-credential";
  assert.equal(await canAccessCrmPreview(request("https://evil.example"), admin), false);
  assert.equal(await canAccessCrmPreview(new Request(url, { method: "POST" }), admin), false);
  assert.equal(reads, 0);
  assert.equal(await canAccessCrmPreview(request(), async () => null), false);
  assert.equal(await canAccessCrmPreview(request(), async () => ({ role: "editor" })), false);
  assert.equal(await canAccessCrmPreview(request(), async () => { throw new Error("db unavailable"); }), false);
  assert.equal(await canAccessCrmPreview(request(), admin), true);
  const token = (role: string, exp: number) => {
    const payload = Buffer.from(JSON.stringify({ userId: "synthetic", email: "test@example.invalid", role, exp })).toString("base64url");
    return payload + "." + createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(payload).digest("base64url");
  };
  const next = (path: string, cookie?: string) => new NextRequest("https://site.example" + path, { headers: cookie ? { cookie: `inglaterra_admin_session=${cookie}` } : {} });
  assert.equal((await middleware(next("/preview/crm/api/search"))).status, 404);
  assert.equal((await middleware(next("/preview/crm"))).headers.get("location"), "https://site.example/admin/login");
  for (const invalid of ["forged.token", token("admin", 1), token("editor", Math.floor(Date.now()/1000)+60)]) {
    assert.equal((await middleware(next("/preview/crm/api/ai", invalid))).status, 404);
  }
  const accepted = await middleware(next("/preview/crm", token("admin", Math.floor(Date.now()/1000)+60)));
  assert.equal(accepted.status, 200);
  assert.equal(accepted.headers.get("cache-control"), "no-store");
  assert.equal(accepted.headers.get("x-robots-tag"), "noindex, nofollow");
  console.log("PASS: preview auth fails closed, missing secret/user, editor, expired/forged session, cross-origin POST, database failure, admin and no-store/noindex");
}
run().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : "PREVIEW_ACCESS_TEST_FAILED"); process.exitCode = 1; });
