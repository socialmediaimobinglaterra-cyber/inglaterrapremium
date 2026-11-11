import assert from "node:assert/strict";
import test from "node:test";
import { filtersFromSearchParams, filtersToSearchParams } from "../lib/search-url";

test("traditional search preserves purpose, location, type and price", () => {
  const filters = filtersFromSearchParams({ negocio: "Alugar", bairro: "Terra Bonita", tipo: "Casa", valorMinimo: "1000", valorMaximo: "4000" });
  assert.equal(filters.negocio, "Alugar");
  assert.equal(filters.bairro, "Terra Bonita");
  assert.equal(filters.tipo, "Casa");
  assert.equal(filters.valorMinimo, 1000);
  assert.equal(filters.valorMaximo, 4000);
  assert.equal(filtersFromSearchParams({ condominio: "Royal Park" }).condominio, "Royal Park");
});

test("all interpreted filters survive sharing and reload without replaying AI", () => {
  const state = {
    negocio: "Alugar" as const, bairro: "Gleba Palhano", condominio: "Royal Park", tipo: "Casa",
    valorMinimo: 4000, valorMaximo: 12000, quartosMinimos: 4, suitesMinimas: 3,
    vagasMinimas: 2, areaMinima: 150, areaMaxima: 500, mobiliado: true,
    order: "menor_valor" as const, mapSelection: "0123456789abcdef:12:c15",
  };
  const params = filtersToSearchParams(state, new URLSearchParams("q=frase+anterior&page=3&utm_source=test"));
  assert.equal(params.has("q"), false);
  assert.equal(params.has("page"), false);
  assert.equal(params.get("utm_source"), "test");
  const restored = filtersFromSearchParams(Object.fromEntries(params));
  assert.deepEqual(restored, state);
  const cleared = filtersToSearchParams({ negocio: "Alugar" }, params);
  assert.equal(cleared.has("bairro"), false);
  assert.equal(cleared.has("mobiliado"), false);
  assert.equal(cleared.has("mapa"), false);
  assert.equal(cleared.get("negocio"), "Alugar");
});

test("URL parsing rejects repeated and invalid extended filters", () => {
  const filters = filtersFromSearchParams({ suitesMinimas: "1.5", quartosMinimos: "-1", vagasMinimas: ["2", "3"], areaMaxima: "Infinity", order: "unsafe", mobiliado: "false" });
  assert.equal(filters.suitesMinimas, null);
  assert.equal(filters.quartosMinimos, null);
  assert.equal(filters.vagasMinimas, null);
  assert.equal(filters.areaMaxima, null);
  assert.equal(filters.order, "relevancia");
  assert.equal(filters.mobiliado, null);
});

test("invalid values and repeated parameters are not forwarded", () => {
  const filters = filtersFromSearchParams({ bairro: ["A", "B"], valorMinimo: "-1", valorMaximo: "Infinity", negocio: "invalid" });
  assert.equal(filters.bairro, null);
  assert.equal(filters.valorMinimo, null);
  assert.equal(filters.valorMaximo, null);
  assert.equal(filters.negocio, "Comprar");
});
