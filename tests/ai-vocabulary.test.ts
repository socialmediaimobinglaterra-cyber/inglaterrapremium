import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

test("vocabulary projects condominium names before deduplication and keeps premium filters", async () => {
  const queries: string[] = [];
  const module = { exports: {} as { getSearchVocabulary: () => Promise<unknown> } };
  const code = ts.transpileModule(readFileSync("lib/ai-search-support.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: (name: string) => {
      if (name === "node:crypto" || name === "./db" || name === "./search-state") return {};
      if (name === "next/cache") return { unstable_cache: (fn: unknown) => fn };
      if (name === "./premium-rule") return { premiumFilter: async () => "premium == true", getPremiumConfig: async () => ({}) };
      if (name === "./cep-bairros") return { bairrosPremiumDe: () => [], bairroDaLinha: (row: {neighborhood: string}) => row.neighborhood };
      if (name === "./sanity") return { sanity: { fetch: async (query: string) => {
        queries.push(query);
        assert(query.includes('premium == true'));
        assert(!query.includes('].coalesce('), 'GROQ cannot call a function as an attribute');
        if (query.includes('"nome": coalesce')) {
          assert(query.endsWith('}.nome)'));
          return ['Residencial Maanaim'];
        }
        if (query.endsWith('.type)')) return ['Casa'];
        return [{neighborhood:'Terra Bonita'},{neighborhood:'Terra Bonita'}];
      } } };
      throw new Error(name);
    },
  });
  const result = JSON.parse(JSON.stringify(await module.exports.getSearchVocabulary()));
  assert.deepEqual(result, {bairro:['Terra Bonita'],tipo:['Casa'],condominio:['Residencial Maanaim']});
  assert.equal(queries.length,3);
});
