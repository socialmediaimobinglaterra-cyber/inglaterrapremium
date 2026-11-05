import assert from "node:assert/strict";
import test from "node:test";
import { filtersFromSearchParams } from "../lib/search-url";

test("traditional search preserves purpose, location, type and price", () => {
  const filters = filtersFromSearchParams({ negocio: "Alugar", bairro: "Terra Bonita", tipo: "Casa", valorMinimo: "1000", valorMaximo: "4000" });
  assert.equal(filters.negocio, "Alugar");
  assert.equal(filters.bairro, "Terra Bonita");
  assert.equal(filters.tipo, "Casa");
  assert.equal(filters.valorMinimo, 1000);
  assert.equal(filters.valorMaximo, 4000);
  assert.equal(filtersFromSearchParams({ condominio: "Royal Park" }).condominio, "Royal Park");
});

test("invalid values and repeated parameters are not forwarded", () => {
  const filters = filtersFromSearchParams({ bairro: ["A", "B"], valorMinimo: "-1", valorMaximo: "Infinity", negocio: "invalid" });
  assert.equal(filters.bairro, null);
  assert.equal(filters.valorMinimo, null);
  assert.equal(filters.valorMaximo, null);
  assert.equal(filters.negocio, "Comprar");
});
