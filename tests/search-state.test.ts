import { test } from "node:test";
import assert from "node:assert/strict";
import { applyChanges, sanitizeState, resolveName } from "../lib/search-state";
const vocabulary = { bairro: ["Gleba Palhano", "Bela Suíça", "Centro"], tipo: ["Apartamento", "Casa"], condominio: ["Residencial Maanaim"] };
const initial = { bairro: "Gleba Palhano", tipo: "Apartamento", negocio: "Comprar", valorMaximo: 2000000 };
const operation = (campo: string, acao: string, texto: string | null = null, numero: number | null = null) => ({ campo, acao, texto, numero });
const patch = (...alteracoes: ReturnType<typeof operation>[]) => ({ reiniciar: false, alteracoes, naoInterpretado: [] });
test("incremental suites preserve location, type and price", () => {
  const result = applyChanges(initial, patch(operation("suitesMinimas", "definir", null, 3)), vocabulary);
  assert.equal(result.filters.valorMaximo, 2000000);
  assert.equal(result.filters.bairro, "Gleba Palhano");
  assert.equal(result.filters.tipo, "Apartamento");
  assert.equal(result.filters.suitesMinimas, 3);
});
test("replace price and type; explicitly remove bairro", () => {
  const result = applyChanges(initial, patch(operation("valorMaximo", "definir", null, 2500000), operation("tipo", "definir", "Casa"), operation("bairro", "remover")), vocabulary);
  assert.equal(result.filters.valorMaximo, 2500000);
  assert.equal(result.filters.tipo, "Casa");
  assert.equal(result.filters.bairro, null);
});
test("all dimensions survive an empty patch", () => {
  const state = { ...initial, condominio: "Residencial Maanaim", quartosMinimos: 4, suitesMinimas: 3, vagasMinimas: 4, areaMinima: 120, areaMaxima: 300, valorMinimo: 1000000 };
  const result = applyChanges(state, patch(), vocabulary);
  for (const [key, value] of Object.entries(state)) assert.equal(result.filters[key as keyof typeof result.filters], value);
});
test("unknown locations do not silently replace valid locations", () => {
  const result = applyChanges(initial, patch(operation("bairro", "definir", "Inexistente")), vocabulary);
  assert.equal(result.filters.bairro, "Gleba Palhano");
  assert.deepEqual(result.naoInterpretado, ["Inexistente"]);
});
test("canonical names and condominium prefix", () => {
  assert.equal(resolveName("BELA SUICA", vocabulary.bairro), "Bela Suíça");
  assert.equal(resolveName("Maanaim", vocabulary.condominio), "Residencial Maanaim");
});
test("reset clears state only when requested", () => {
  const result = applyChanges(initial, { ...patch(), reiniciar: true }, vocabulary);
  assert.equal(result.filters.bairro, null);
  assert.equal(result.filters.valorMaximo, null);
});
test("ranges cannot be inverted", () => {
  assert.throws(() => applyChanges(initial, patch(operation("valorMinimo", "definir", null, 3000000)), vocabulary), /invalid_range/);
  assert.throws(() => applyChanges({ areaMinima: 400 }, patch(operation("areaMaxima", "definir", null, 300)), vocabulary), /invalid_range/);
});
test("untrusted state excludes histories, records and invalid numbers", () => {
  const result = sanitizeState({ history: "secret", fotos: ["url"], suitesMinimas: 1.5, quartosMinimos: -1, valorMaximo: Infinity, areaMaxima: 300 });
  assert.equal("history" in result, false);
  assert.equal("fotos" in result, false);
  assert.equal(result.suitesMinimas, null);
  assert.equal(result.quartosMinimos, null);
  assert.equal(result.valorMaximo, null);
  assert.equal(result.areaMaxima, 300);
});
