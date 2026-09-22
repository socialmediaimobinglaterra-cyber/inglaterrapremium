import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import type { Pool } from "pg";
import { syncKenlo } from "../lib/kenlo-sync";

const property = (code: string, extra = "") => `<Imovel><CodigoImovel>${code}</CodigoImovel>
  <TituloImovel>Casa teste</TituloImovel><Bairro>Gleba Palhano</Bairro>
  <PrecoVenda>1500000</PrecoVenda>${extra}</Imovel>`;

function database(options: { failBatch?: boolean; locked?: boolean } = {}) {
  const calls: Array<{ sql: string; values: unknown[] }> = [];
  let released = false;
  const client = {
    async query(sql: string, values: unknown[] = []) {
      calls.push({ sql, values });
      if (sql.includes("insert into sincronizacoes_log")) return { rows: [{ id: "log-test" }] };
      if (sql.includes("pg_try_advisory")) return { rows: [{ acquired: !options.locked }] };
      if (sql.includes("from configuracoes_premium")) return { rows: [{
        bairros_permitidos: ["Gleba Palhano"], valor_minimo_venda: 1000000,
        valor_minimo_locacao: 4000, valor_minimo_pendente: false,
      }] };
      if (sql.includes("insert into bairros")) return { rows: [{ id: "bairro-test" }] };
      if (sql.includes("where premium = true")) return { rows: [{ nome: "Sun Lake" }] };
      if (sql.includes("insert into imoveis") && options.failBatch) throw new Error("batch failure");
      return { rows: [] };
    },
    release() { released = true; },
  };
  return { pool: { connect: async () => client } as unknown as Pool, calls, released: () => released };
}

function source(t: TestContext, records: string) {
  t.mock.method(globalThis, "fetch", async (_url: unknown, options: RequestInit) => {
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal);
    return new Response(`<Carga><Imoveis>${records}</Imoveis></Carga>`);
  });
  t.mock.method(console, "info", () => {});
  t.mock.method(console, "error", () => {});
}

test("2221 properties use 23 bounded parameterized batches and preserve manual fields", async (t) => {
  source(t, Array.from({ length: 2221 }, (_, i) => property(`CA${i}`)).join(""));
  const db = database();
  const result = await syncKenlo(db.pool, "https://example.test/feed");
  assert.equal(result.totalXml, 2221);
  assert.equal(result.totalPremium, 2221);
  const writes = db.calls.filter(({ sql }) => sql.includes("insert into imoveis"));
  assert.equal(writes.length, 23);
  assert.equal(writes[0].values.length, 4200);
  assert.equal(writes[22].values.length, 21 * 42);
  for (const { sql, values } of writes) {
    assert.match(sql, /where imoveis.origem = 'kenlo'/);
    assert.doesNotMatch(sql, /inclusao_manual|is_premium_override/);
    const refs = [...sql.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));
    assert.equal(Math.max(...refs), values.length);
    assert.equal(new Set(refs).size, values.length);
    assert.equal(values[38], true);
  }
  const deactivate = db.calls.find(({ sql }) => sql.includes("set ativo = false,") && sql.includes("update imoveis"));
  assert.match(deactivate!.sql, /where origem = 'kenlo'/);
  assert.equal(db.calls.at(-1)?.sql, "commit");
  assert.equal(db.released(), true);
});

test("premium location and price rules remain unchanged", async (t) => {
  source(t, [
    property("A"),
    property("B").replace("1500000", "900000"),
    property("C", "<NomeCondominio>Sun Lake</NomeCondominio>").replace("Gleba Palhano", "Outro"),
    property("D", "<NomeCondominio>Sun Lake</NomeCondominio>").replace("Gleba Palhano", "Outro").replace("1500000", "900000"),
    property("E", "<PrecoLocacao>4000</PrecoLocacao>").replace("1500000", "0"),
  ].join(""));
  const db = database();
  const result = await syncKenlo(db.pool, "https://example.test/feed");
  assert.equal(result.totalPremium, 3);
  const values = db.calls.find(({ sql }) => sql.includes("insert into imoveis"))!.values;
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => values[i * 42 + 38]), [true, false, true, false, true]);
});

test("duplicate source codes keep the last occurrence without a batch conflict", async (t) => {
  source(t, property("A") + property("A").replace("Casa teste", "Ultima versao"));
  const db = database();
  await syncKenlo(db.pool, "https://example.test/feed");
  const write = db.calls.find(({ sql }) => sql.includes("insert into imoveis"))!;
  assert.equal(write.values.length, 42);
  assert.equal(write.values[3], "Ultima versao");
});

test("failed batch rolls back the catalog and records the failed stage", async (t) => {
  source(t, property("A"));
  const db = database({ failBatch: true });
  await assert.rejects(syncKenlo(db.pool, "https://example.test/feed"), /batch failure/);
  assert.equal(db.calls.filter(({ sql }) => sql === "commit").length, 1); // Log only.
  assert.equal(db.calls.at(-2)?.sql, "rollback");
  assert.equal(JSON.parse(db.calls.at(-1)!.values[2] as string).stage, "imoveis");
  assert.equal(db.released(), true);
});

test("empty XML cannot deactivate the catalog", async (t) => {
  source(t, "");
  const db = database();
  await assert.rejects(syncKenlo(db.pool, "https://example.test/feed"), /sem imoveis validos/);
  assert.equal(db.calls.some(({ sql }) => /update imoveis|insert into imoveis/.test(sql)), false);
});

test("overlapping sync is rejected before catalog writes", async (t) => {
  source(t, property("A"));
  const db = database({ locked: true });
  await assert.rejects(syncKenlo(db.pool, "https://example.test/feed"), /em andamento/);
  assert.equal(db.calls.some(({ sql }) => /insert into bairros|insert into imoveis/.test(sql)), false);
});
