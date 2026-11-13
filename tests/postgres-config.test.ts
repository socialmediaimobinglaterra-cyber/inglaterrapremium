import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "pg";
import { checkServerIdentity, type PeerCertificate } from "node:tls";
import { postgresConfig } from "../lib/postgres-config";

const production = { VERCEL_ENV: "production" };
const host = "ep-stage-pooler.eu-central-1.aws.neon.tech";
const preview = { VERCEL_ENV: "preview", PREVIEW_DATABASE_HOST: host,
  PRODUCTION_DATABASE_HOSTS: "ep-prod.eu-central-1.aws.neon.tech", PREVIEW_DATABASE_ROLE: "preview_reader" };
const url = `postgresql://preview_reader:synthetic-only@${host}/neondb`;

test("production Neon direct/pooled URLs keep identity and use verified TLS in actual pg configuration", () => {
  for (const hostname of [host, host.replace("-pooler", "")]) {
    for (const suffix of ["", "?sslmode=require", "?sslmode=verify-full&channel_binding=require", "?sslmode=require&uselibpqcompat=true"]) {
      const config = postgresConfig(`postgresql://synthetic:synthetic%40password@${hostname}:5432/neondb${suffix}`, production);
      assert.equal(config.connectionString, undefined);
      assert.equal(config.host, hostname);
      assert.equal(config.user, "synthetic");
      assert.equal(config.password, "synthetic@password");
      assert.equal(config.database, "neondb");
      assert.equal(config.port, 5432);
      assert.equal(config.options, undefined);
      const client = new Client(config); // Constructor only: never call connect/query.
      const ssl = client.ssl as unknown as { rejectUnauthorized: boolean; servername: string; checkServerIdentity?: unknown };
      assert.equal(ssl.rejectUnauthorized, true);
      assert.equal(ssl.servername, hostname);
      assert.equal(ssl.checkServerIdentity, undefined); // Node default verifier remains active.
      assert.equal(config.enableChannelBinding, suffix.includes("channel_binding=require"));
    }
  }
});

test("default TLS hostname verifier rejects wrong certificate identity without network", () => {
  const cert = { subjectaltname: `DNS:${host}`, subject: { CN: host } } as unknown as PeerCertificate;
  assert.equal(checkServerIdentity(host, cert), undefined);
  assert.ok(checkServerIdentity("ep-other.eu-central-1.aws.neon.tech", cert));
});

test("unsafe TLS, filesystem certificates and destination overrides fail without leaking URL", () => {
  for (const suffix of ["?sslmode=disable", "?sslmode=no-verify", "?ssl=false", "?ssl=0", "?host=other.invalid",
    "?user=owner", "?sslrootcert=/secret/file", "?sslkey=/secret/key", "?password=override"]) {
    assert.throws(() => postgresConfig(url + suffix, production), error => {
      assert.ok(error instanceof Error);
      assert.doesNotMatch(error.message, /synthetic-only|preview_reader|postgresql:\/\//);
      return true;
    });
  }
});

test("preview needs independent production denylist and dedicated role, and remains read-only", () => {
  assert.throws(() => postgresConfig(url, { ...preview, PRODUCTION_DATABASE_HOSTS: undefined }));
  assert.throws(() => postgresConfig(url, { ...preview, PREVIEW_DATABASE_ROLE: undefined }));
  assert.throws(() => postgresConfig(url.replace("preview_reader:", "owner:"), preview));
  const config = postgresConfig(url + "?sslmode=require", preview);
  assert.match(config.options!, /default_transaction_read_only=on/);
  assert.equal((config.ssl as { rejectUnauthorized: boolean }).rejectUnauthorized, true);
  assert.throws(() => postgresConfig(url + "?options=-c%20default_transaction_read_only=off", preview));
});

test("production denylist wins even if both preview URL and approved hostname are misconfigured", () => {
  for (const hostname of ["ep-prod.eu-central-1.aws.neon.tech", "ep-prod-pooler.eu-central-1.aws.neon.tech"]) {
    assert.throws(() => postgresConfig(url.replace(host, hostname), { ...preview, PREVIEW_DATABASE_HOST: hostname }), /Production/);
  }
  assert.throws(() => postgresConfig(url, { ...preview, PRODUCTION_DATABASE_HOSTS: host.replace("-pooler", "") }), /Production/);
});

test("production does not require new Preview variables and preserves explicit options", () => {
  assert.doesNotThrow(() => postgresConfig(url, production));
  assert.equal(postgresConfig(url + "?application_name=premium&options=-c%20statement_timeout=5000", production).options, "-c statement_timeout=5000");
  assert.throws(() => postgresConfig(url, {}));
});
