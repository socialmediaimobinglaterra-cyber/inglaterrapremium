import * as tipos from "../lib/tipos-imovel";
import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("filter options reuse public rows, expire, respect rule changes and recover from failures", async (t) => {
  const globals = globalThis as any;
  const previousCache = globals.__incrementalCache;
  const previousStorage = globals.AsyncLocalStorage;
  globals.AsyncLocalStorage = AsyncLocalStorage;
  const require = createRequire(import.meta.url);
  const nextCache = require("next/cache");
  const entries = new Map<string, any>();
  let now = 0, reads = 0, rule = "active-rule", fail = false;
  globals.__incrementalCache = {
    generateSimpleCacheKey: async (key: string) => key,
    get: async (key: string) => {
      const entry = entries.get(key);
      return entry && { value: entry.value, isStale: now - entry.time >= entry.value.revalidate * 1000 };
    },
    set: async (key: string, value: any) => { assert.equal(value.revalidate, 60); entries.set(key, { value, time: now }); },
  };
  t.after(() => { globals.__incrementalCache = previousCache; globals.AsyncLocalStorage = previousStorage; });
  const module = { exports: {} as any };
  const code = ts.transpileModule(readFileSync("lib/queries/imoveis.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require(name: string) {
      if (name === "next/cache") return nextCache;
      if (name === "react") return { cache: (fn: unknown) => fn };
      if (name === "@/lib/sanity") return {
        projectId: "test", dataset: "test", sanity: { fetch: async (query: string) => {
          reads++;
          if (fail) throw new Error("unavailable");
          assert(query.includes(rule));
          assert(!query.includes("images"));
          return [{ neighborhood: "Terra Bonita", type: "casa", cond: "Alphaville II", condId: "alpha" }];
        } },
      };
      if (name === "@/lib/premium-rule") return { premiumFilter: async () => rule, getPremiumConfig: async () => ({ condominioIds: ["alpha"] }) };
      if (name === "@/lib/cep-bairros") return { bairrosPremiumDe: () => [], bairroDaLinha: (row: any) => row.neighborhood };
      if (name === "@/lib/tipos-imovel") return tipos;
      return {};
    },
  });
  const getOptions = module.exports.getImoveisFilterOptions;
  const first = await getOptions();
  assert.equal(first.bairros[0], "Terra Bonita");
  assert.equal(first.condominios[0], "Alphaville II");
  assert.equal(reads, 1);
  assert.deepEqual(await getOptions(), first);
  assert.equal(reads, 1, "warm request must not fetch option rows again");
  now = 61000;
  await getOptions();
  assert.equal(reads, 2, "expired entry refreshes");
  rule = "changed-rule";
  await getOptions();
  assert.equal(reads, 3, "changed premium rule never reuses prior option rows");
  entries.clear();
  fail = true;
  await assert.rejects(getOptions(), /unavailable/);
  assert.equal(entries.size, 0);
  fail = false;
  assert.deepEqual(await getOptions(), first);
});
