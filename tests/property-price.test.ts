import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync("app/imoveis/[slug]/page.tsx", "utf8");
const code = ts.transpileModule(source + "\nexport const testHelpers = { getPrice, jsonLd, SimilarCard, focoDaUrl };", {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const property = {
  id: "test", slug: "test", titulo: "Casa </script><script>test</script>", bairro: "Centro", cidade: "Londrina", estado: "PR",
  precoVenda: 2000000, precoLocacao: 8000, area: null, areaTotal: null, fotos: [], corretor: {},
};
const module = { exports: {} as any };
vm.runInNewContext(code, {
  module, exports: module.exports,
  require(name: string) {
    if (name === "react/jsx-runtime") return require(name);
    if (name === "next/server") return { after() {} };
    if (name === "next/navigation") return { notFound() { throw new Error("not found"); } };
    if (name === "@/lib/queries/imoveis") return { getImovelBySlug: async () => property, getSimilarImoveis: async () => [] };
    if (name === "@/lib/images") return { imageUrlOrFallback: (v: string) => v };
    if (name === "@/lib/site") return { absoluteUrl: (v: string) => `https://example.com${v}` };
    return new Proxy({}, { get: () => () => null });
  },
});
const { getPrice, jsonLd, SimilarCard, focoDaUrl } = module.exports.testHelpers;

test("detail price and structured offer agree on sale and rental", () => {
  for (const [focus, price, kind] of [[null, 2000000, "Sell"], ["sale", 2000000, "Sell"], ["rent", 8000, "LeaseOut"]] as const) {
    assert.equal(getPrice(property, focus), price);
    const offer = jsonLd(property, focus).offers;
    assert.equal(offer.price, price);
    assert(offer.businessFunction.endsWith(kind));
  }
  assert.equal(getPrice({ precoVenda: null, precoLocacao: 8000 }, "sale"), 8000);
  assert.equal(getPrice({ precoVenda: 2000000, precoLocacao: null }, "rent"), 2000000);
  assert.equal(getPrice({ precoVenda: null, precoLocacao: null }), null);
});

test("existing focus URLs and similar links preserve transaction", () => {
  assert.equal(focoDaUrl("locacao"), "rent");
  assert.equal(focoDaUrl(["venda"]), "sale");
  assert.equal(focoDaUrl("invalid"), null);
  assert.equal(SimilarCard({ imovel: property, foco: "rent" }).props.href, "/imoveis/test?foco=locacao");
  assert.equal(SimilarCard({ imovel: property, foco: "sale" }).props.href, "/imoveis/test?foco=venda");
});

test("catalog text cannot close the JSON-LD script element", async () => {
  const page = await module.exports.default({ params: Promise.resolve({ slug: "test" }), searchParams: Promise.resolve({ foco: "locacao" }) });
  const scripts = page.props.children.filter((node: any) => node?.type === "script");
  assert.equal(scripts.length, 2);
  for (const script of scripts) {
    const html = script.props.dangerouslySetInnerHTML.__html;
    assert(!html.includes("<"));
    JSON.parse(html);
  }
  assert.equal(JSON.parse(scripts[0].props.dangerouslySetInnerHTML.__html).offers.price, 8000);
});
