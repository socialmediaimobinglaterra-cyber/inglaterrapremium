import { test } from "node:test";
import assert from "node:assert/strict";
import { bannerLink, normalizeHomeBanners } from "../lib/home-banners";

test("banners reject unsafe links and accept internal or HTTPS destinations", () => {
  for (const value of ["javascript:alert(1)", "//example.com", "/\\example.com", "http://example.com", "https://user:pass@example.com", ""]) assert.equal(bannerLink(value), null);
  assert.equal(bannerLink("/imoveis?negocio=Comprar"), "/imoveis?negocio=Comprar");
  assert.equal(bannerLink("https://example.com/campanha"), "https://example.com/campanha");
});

test("only usable Sanity images render, preserving editorial order without fake content", () => {
  const row = { _id: "a", titulo: "Campanha", imagemUrl: "https://cdn.sanity.io/images/project/production/banner.jpg", width: 1600, height: 500 };
  assert.deepEqual(normalizeHomeBanners([]), []);
  assert.equal(normalizeHomeBanners([{ ...row, imagemUrl: undefined }, { ...row, width: 0 }, { ...row, imagemUrl: "https://example.com/photo.jpg" }]).length, 0);
  const result = normalizeHomeBanners([row, { ...row, _id: "b", textoAlternativo: "Outra campanha", link: "/contato" }]);
  assert.deepEqual(result.map(b => b.id), ["a", "b"]);
  assert.equal(result[0].href, null);
  assert.equal(result[1].alt, "Outra campanha");
});
