import { test } from "node:test";
import assert from "node:assert/strict";
import { bannerLink } from "../lib/home-banners";

test("banners reject unsafe links and accept internal or HTTPS destinations", () => {
  for (const value of ["javascript:alert(1)", "//example.com", "/\\example.com", "http://example.com", "https://user:pass@example.com", ""]) assert.equal(bannerLink(value), null);
  assert.equal(bannerLink("/imoveis?negocio=Comprar"), "/imoveis?negocio=Comprar");
  assert.equal(bannerLink("https://example.com/campanha"), "https://example.com/campanha");
});
