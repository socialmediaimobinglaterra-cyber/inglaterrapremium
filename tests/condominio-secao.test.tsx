import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  agruparComodidades,
  comodidadesDaUnidade,
  condominioSecaoAtiva,
  formatarPrevisaoEntrega,
  rotuloComodidade,
  type ItemCatalogo,
} from "../lib/condominio-secao";
import { CondominioSecao } from "../components/condominios/CondominioSecao";
import { UnidadesDisponiveis } from "../components/condominios/UnidadesDisponiveis";
import type { CondominioCompleto } from "../lib/queries/condominios";

const UUID = "30774bae-1111-4222-8333-444455556666";

const base: CondominioCompleto = {
  id: `condominio-${UUID}`,
  nome: "Residencial Sonance",
  href: null,
  descricao: null,
  endereco: null,
  complemento: null,
  bairro: null,
  cidade: null,
  estado: null,
  cep: null,
  fotos: [],
  comodidades: [],
  ficha: null,
  bookUrl: null,
  bookNome: null,
  plantas: [],
};
const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);
const secao = (c: Partial<CondominioCompleto>, props: { comCabecalho?: boolean; comGaleria?: boolean } = {}) =>
  html(createElement(CondominioSecao, { condominio: { ...base, ...c }, catalogo: new Map(), ...props }));

test("chave desligada por padrão", () => {
  const antes = process.env.CONDOMINIO_SECAO;
  delete process.env.CONDOMINIO_SECAO;
  assert.equal(condominioSecaoAtiva(), false);
  process.env.CONDOMINIO_SECAO = "ligado";
  assert.equal(condominioSecaoAtiva(), false, "só o valor exato 'on' liga");
  process.env.CONDOMINIO_SECAO = "on";
  assert.equal(condominioSecaoAtiva(), true);
  if (antes === undefined) delete process.env.CONDOMINIO_SECAO;
  else process.env.CONDOMINIO_SECAO = antes;
});

test("rótulo de comodidade: catálogo > embutido > slug formatado, nunca quebra", () => {
  const catalogo = new Map<string, ItemCatalogo>([["piscina", { value: "piscina", label: "Piscina aquecida" }]]);
  assert.equal(rotuloComodidade("piscina", catalogo), "Piscina aquecida");
  assert.equal(rotuloComodidade("salao_festas"), "Salão de festas");
  assert.equal(rotuloComodidade("slug_novo_do_crm"), "Slug novo do crm");
  assert.equal(rotuloComodidade(""), "");
});

test("agrupa por categoria quando o catálogo tem; senão um grupo só", () => {
  const catalogo = new Map<string, ItemCatalogo>([
    ["piscina", { value: "piscina", label: "Piscina", categoria: "Lazer" }],
    ["elevador", { value: "elevador", label: "Elevador", categoria: "Estrutura" }],
  ]);
  assert.deepEqual(agruparComodidades(["piscina", "elevador", "sauna", "piscina"], catalogo), [
    { titulo: "Lazer", itens: ["Piscina"] },
    { titulo: "Estrutura", itens: ["Elevador"] },
    { titulo: null, itens: ["Sauna"] },
  ]);
  assert.deepEqual(agruparComodidades(["piscina", "sauna"]), [{ titulo: null, itens: ["Piscina", "Sauna"] }]);
  assert.deepEqual(agruparComodidades([]), []);
});

test("comodidades da unidade = união menos as do condomínio", () => {
  assert.deepEqual(comodidadesDaUnidade(["piscina", "lavabo", "elevador"], ["piscina", "elevador"]), ["lavabo"]);
  assert.deepEqual(comodidadesDaUnidade(null, ["piscina"]), []);
  assert.deepEqual(comodidadesDaUnidade(["lavabo"], undefined), ["lavabo"]);
});

test("previsão de entrega YYYY-MM", () => {
  assert.equal(formatarPrevisaoEntrega("2027-03"), "mar/2027");
  assert.equal(formatarPrevisaoEntrega("2027-13"), "2027-13");
  assert.equal(formatarPrevisaoEntrega("em breve"), "em breve");
  assert.equal(formatarPrevisaoEntrega(null), null);
});

test("sem dado nenhum e sem cabeçalho: a seção não existe", () => {
  assert.equal(secao({}, { comCabecalho: false, comGaleria: false }), "");
});

test("sem nada além do nome: só cabeçalho, sem título solto nem 'não informado'", () => {
  const out = secao({});
  assert.match(out, /Residencial Sonance/);
  assert.ok(!out.includes("<a "), "sem página própria: o nome não vira link");
  assert.ok(secao({ href: "/condominios/residencial-sonance" }).includes("href=\"/condominios/residencial-sonance\""), "com página: vira link");
  for (const proibido of ["Ficha técnica", "Comodidades", "Plantas", "Baixar book", "Fotos do condomínio", "Sobre o condomínio", "não informado", "Não informado"]) {
    assert.ok(!out.includes(proibido), `não deveria aparecer: ${proibido}`);
  }
});

test("seção completa: tudo aparece, zero é exibido e planta liga ao tipo pela chave", () => {
  const out = secao({
    descricao: "Um condomínio de alto padrão.",
    endereco: "Rua X, 120",
    bairro: "Gleba Palhano",
    cidade: "Londrina",
    estado: "PR",
    fotos: [{ url: "https://cdn.sanity.io/images/a.jpg", alt: "fachada" }],
    comodidades: ["piscina", "slug_desconhecido"],
    ficha: {
      construtora: "Construtora Y",
      arquitetura: null,
      torres: 2,
      andares: null,
      elevadores: 0,
      totalUnidades: null,
      unidadesPorAndar: null,
      totalVagas: null,
      areaTerreno: null,
      areaConstruida: null,
      previsaoEntrega: "2027-03",
      tipologias: [
        { key: "t1", nome: "Tipo A", area: 52, dormitorios: 2, suites: 1, vagas: 0 },
        { key: "t2", nome: "Tipo B", area: null, dormitorios: null, suites: null, vagas: null },
      ],
    },
    bookUrl: "https://cdn.sanity.io/files/book.pdf",
    bookNome: "book.pdf",
    plantas: [
      { key: "p1", nome: "Planta A", tipologiaKey: "t1", imagemUrl: "https://cdn.sanity.io/images/pa.jpg", arquivoUrl: null },
      { key: "p2", nome: "Planta solta", tipologiaKey: null, imagemUrl: "https://cdn.sanity.io/images/ps.jpg", arquivoUrl: null },
      { key: "p3", nome: "Planta de tipo removido", tipologiaKey: "nao-existe", imagemUrl: "https://cdn.sanity.io/images/pr.jpg", arquivoUrl: null },
      { key: "p4", nome: "Planta antiga", tipologiaKey: null, imagemUrl: null, arquivoUrl: "https://cdn.sanity.io/files/antiga.pdf" },
    ],
  });
  for (const esperado of [
    "Rua X, 120", "Gleba Palhano", "Fotos do condomínio", "Um condomínio de alto padrão.", "Piscina", "Slug desconhecido",
    "Ficha técnica", "Construtora Y", "mar/2027", "Tipo A", "52 m² · 2 dormitórios · 1 suíte · 0 vagas", "Planta A",
    "Outras plantas", "Planta solta", "Planta de tipo removido", "Baixar planta — Planta antiga", "Baixar book — book.pdf",
  ]) {
    assert.ok(out.includes(esperado), `faltou: ${esperado}`);
  }
  assert.match(out, /<dd[^>]*>0<\/dd><dt[^>]*>Elevadores/, "elevadores = 0 deve aparecer");
  assert.ok(!out.includes("Arquitetura"), "campo ausente não aparece");
  assert.ok(!out.includes("Tipo B"), "tipo sem nenhum dado útil não vira bloco vazio");
});

test("na página do condomínio: sem cabeçalho nem galeria duplicados", () => {
  const out = secao(
    { fotos: [{ url: "https://cdn.sanity.io/images/a.jpg", alt: "x" }], comodidades: ["piscina"], endereco: "Rua X, 120" },
    { comCabecalho: false, comGaleria: false }
  );
  assert.ok(out.includes("Comodidades do condomínio"));
  assert.ok(!out.includes("Fotos do condomínio"));
  assert.ok(!out.includes("Rua X, 120"));
});

test("unidades: só disponíveis; preço zero vira 'Consulte'; nenhuma disponível = nada", () => {
  const unidade = (n: string, preco: number | null, disponivel: boolean) => ({
    key: n, numero: n, preco, dormitorios: 2, suites: 1, banheiros: 2, vagas: 1, area: 60, disponivel,
  });
  const out = html(createElement(UnidadesDisponiveis, { unidades: [unidade("101", 500000, true), unidade("102", null, true), unidade("103", 400000, false)] }));
  assert.ok(out.includes("101") && out.includes("102"));
  assert.ok(!out.includes("103"), "vendida não aparece");
  assert.ok(out.includes("Consulte"));
  assert.ok(out.includes("A partir de"));
  assert.equal(html(createElement(UnidadesDisponiveis, { unidades: [unidade("103", 400000, false)] })), "");
  assert.equal(html(createElement(UnidadesDisponiveis, { unidades: [] })), "");
});
