import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as state from "../lib/search-state";

function harness(options: { retry?: number; status?: number; timeout?: boolean } = {}) {
  const pending: (() => Promise<unknown>)[] = [];
  const usage: unknown[][] = [];
  const calls: any[] = [];
  const module = { exports: {} as { POST: (request: Request) => Promise<Response> } };
  const vocabulary = { bairro: ["Gleba Palhano"], tipo: ["Apartamento"], condominio: [] };
  const code = ts.transpileModule(readFileSync("app/api/imoveis/ai/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, Buffer, AbortController, setTimeout, clearTimeout, console,
    process: { env: { OPENAI_API_KEY: "test-only" } },
    require: (name: string) => {
      if (name === "next/server") return { after: (fn: () => Promise<unknown>) => pending.push(fn), NextResponse: { json: (value: unknown, init?: ResponseInit) => Response.json(value, init) } };
      if (name === "@/lib/search-state") return state;
      if (name === "@/lib/analytics") return { recordAnalyticsEvent: async () => {} };
      if (name === "@/lib/ai-search-support") return {
        consumeAiQuota: async () => options.retry ?? 0,
        getSearchVocabulary: async () => vocabulary,
        vocabularyHints: () => ({}),
        recordOpenAiUsage: async (...args: unknown[]) => { usage.push(args); },
      };
      throw new Error(name);
    },
    fetch: async (_url: string, init: RequestInit) => {
      calls.push(JSON.parse(init.body as string));
      if (options.timeout) throw new DOMException("aborted", "AbortError");
      return Response.json({ model: "gpt-4o-mini-test", usage: { prompt_tokens: 321, completion_tokens: 45, total_tokens: 366 }, choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ reiniciar: false, alteracoes: [{ campo: "suitesMinimas", acao: "definir", texto: null, numero: 3 }], naoInterpretado: [] }) } }] }, { status: options.status ?? 200 });
    },
  });
  return { calls, usage, async run(body: unknown) {
    const response = await module.exports.POST(new Request("https://example.com/api/imoveis/ai", { method: "POST", body: JSON.stringify(body) }));
    for (const fn of pending) await fn();
    return { status: response.status, headers: response.headers, data: await response.json() };
  } };
}
test("one OpenAI call, only structured state, real usage propagated", async () => {
  const h = harness();
  const result = await h.run({ query: "Agora com 3 suítes", state: { bairro: "Gleba Palhano", tipo: "Apartamento", valorMaximo: 2000000, fotos: ["private"], history: ["private"] } });
  assert.equal(result.data.filters.valorMaximo, 2000000);
  assert.equal(result.data.filters.suitesMinimas, 3);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].model, "gpt-4o-mini");
  assert.equal(h.calls[0].temperature, 0);
  assert.equal(h.calls[0].response_format.json_schema.strict, true);
  assert.equal(JSON.stringify(h.calls).includes("private"), false);
  assert.equal(h.usage[0][2], true);
  assert.equal((h.usage[0][1] as any).total_tokens, 366);
});
test("rate limited requests never reach OpenAI", async () => {
  const h = harness({ retry: 60 });
  const result = await h.run({ query: "Apartamento" });
  assert.equal(result.status, 429);
  assert.equal(result.headers.get("Retry-After"), "60");
  assert.equal(h.calls.length, 0);
});
test("oversized or invalid queries never reach OpenAI", async () => {
  for (const query of ["x".repeat(501), 42, null]) {
    const h = harness();
    assert.equal((await h.run({ query })).status, 400);
    assert.equal(h.calls.length, 0);
  }
  const h = harness();
  assert.equal((await h.run({ query: "x".repeat(9000) })).status, 413);
  assert.equal(h.calls.length, 0);
});
test("HTTP errors and timeouts record failure without query", async () => {
  for (const option of [{ status: 429 }, { timeout: true }]) {
    const h = harness(option);
    const result = await h.run({ query: "private input" });
    assert.equal(result.data.ok, false);
    assert.equal(h.usage[0][2], false);
    assert.equal(JSON.stringify(h.usage).includes("private input"), false);
  }
});
