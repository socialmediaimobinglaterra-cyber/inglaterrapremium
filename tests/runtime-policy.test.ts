import { test } from "node:test";
import assert from "node:assert/strict";
import { adminSessionSecret, databaseSafetyOptions, productionEffectsAllowed, runtimeEnvironment } from "../lib/runtime-policy";
import { assertScriptWriteTarget } from "../lib/script-safety";

test("environment defaults deny effects; NODE_ENV production alone is insufficient", () => {
  for (const env of [{}, { NODE_ENV: "production" }, { VERCEL_ENV: "preview" }, { VERCEL_ENV: "staging" }, { VERCEL_ENV: "production", VERCEL_TARGET_ENV: "preview" }]) {
    assert.equal(productionEffectsAllowed(env), false);
  }
  assert.equal(runtimeEnvironment({ NODE_ENV: "development" }), "development");
  assert.equal(productionEffectsAllowed({ VERCEL_ENV: "production", VERCEL_TARGET_ENV: "production" }), true);
});
test("admin secret never falls back to sync secret or a public default", () => {
  assert.equal(adminSessionSecret({ KENLO_SYNC_SECRET: "synthetic" }), null);
  assert.equal(adminSessionSecret({ ADMIN_SESSION_SECRET: " " }), null);
  assert.equal(adminSessionSecret({ ADMIN_SESSION_SECRET: "dev-admin-session-secret-change-me" }), null);
  assert.equal(adminSessionSecret({ ADMIN_SESSION_SECRET: " synthetic " }), "synthetic");
});
test("preview database requires exact approved host and forces read-only defaults", () => {
  const url = "postgres://synthetic:synthetic@preview.example.invalid/test";
  assert.throws(() => databaseSafetyOptions(url, { VERCEL_ENV: "preview" }));
  assert.throws(() => databaseSafetyOptions(url, { VERCEL_ENV: "preview", PREVIEW_DATABASE_HOST: "production.example.invalid" }));
  assert.match(databaseSafetyOptions(url, { VERCEL_ENV: "preview", PREVIEW_DATABASE_HOST: "preview.example.invalid", PRODUCTION_DATABASE_HOSTS: "production.example.invalid", PREVIEW_DATABASE_ROLE: "synthetic" })!, /default_transaction_read_only=on/);
  assert.throws(() => databaseSafetyOptions(url + "?options=-c%20default_transaction_read_only=off", { VERCEL_ENV: "preview", PREVIEW_DATABASE_HOST: "preview.example.invalid", PRODUCTION_DATABASE_HOSTS: "production.example.invalid", PREVIEW_DATABASE_ROLE: "synthetic" }));
  assert.throws(() => databaseSafetyOptions(url + "?host=production.example.invalid", { VERCEL_ENV: "preview", PREVIEW_DATABASE_HOST: "preview.example.invalid", PRODUCTION_DATABASE_HOSTS: "production.example.invalid", PREVIEW_DATABASE_ROLE: "synthetic" }));
  assert.equal(databaseSafetyOptions(url, { VERCEL_ENV: "production" }), undefined);
});
test("write scripts require both environment and exact destination confirmation", () => {
  const env = { VERCEL_ENV: "production", DATABASE_URL: "postgres://synthetic:synthetic@db.example.invalid/test" };
  const args = ["--confirm-environment=production", "--confirm-database=db.example.invalid/test"];
  assert.throws(() => assertScriptWriteTarget([], env));
  assert.throws(() => assertScriptWriteTarget([args[0]], env));
  assert.throws(() => assertScriptWriteTarget([args[0], "--confirm-database=wrong/test"], env));
  assert.throws(() => assertScriptWriteTarget(args, { ...env, VERCEL_ENV: "preview" }));
  assert.throws(() => assertScriptWriteTarget(args, { ...env, DATABASE_URL: env.DATABASE_URL + "?host=other.example.invalid" }));
  assert.doesNotThrow(() => assertScriptWriteTarget(args, env));
});
