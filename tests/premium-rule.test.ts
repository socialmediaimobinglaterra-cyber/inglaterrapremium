import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_PREMIUM_CONFIG,
  PUBLISHED_FILTER,
  bairroVariants,
  buildPremiumFilter,
  normalizeConfig,
  normalizeText,
  resolveBairrosExatos,
} from "../lib/premium-rule-core";
import { bairroClause, bairroDoCep, bairroExibicao } from "../lib/cep-bairros";

test("normalizeText ignora acento, caixa e espaços repetidos", () => {
  assert.equal(normalizeText("  Bela   Suíça "), "bela suica");
  assert.equal(normalizeText("BELA SUICA"), "bela suica");
});

test("bairroVariants lista a grafia com e sem acento, em minúsculas", () => {
  assert.deepEqual(bairroVariants(["Bela Suíça", "Terra Bonita", "  "]).sort(), ["bela suica", "bela suíça", "terra bonita"]);
});

test("normalizeConfig aceita lixo do Sanity e devolve configuração válida", () => {
  assert.deepEqual(normalizeConfig(null), DEFAULT_PREMIUM_CONFIG);
  const cfg = normalizeConfig({
    bairrosPremium: [" Terra Bonita ", "", 7, null],
    condominioIds: ["drafts.abc", "def", 3],
    vendaMinima: "2000000",
    locacaoMinima: -5,
    forcarPremium: ["ap0104", " ca1 "],
    forcarMatriz: undefined,
  });
  assert.deepEqual(cfg.bairrosPremium, ["Terra Bonita"]);
  assert.deepEqual(cfg.condominioIds, ["abc", "def"]);
  assert.equal(cfg.vendaMinima, 2_000_000);
  assert.equal(cfg.locacaoMinima, 4_000, "valor inválido volta ao padrão");
  assert.deepEqual(cfg.forcarPremium, ["AP0104", "CA1"]);
  assert.deepEqual(cfg.forcarMatriz, []);
});

test("regra: publicado E (bairro OU condomínio) E (venda OU locação mínima)", () => {
  const f = buildPremiumFilter(normalizeConfig({ bairrosPremium: ["Bela Suíça"], condominioIds: ["c1", "c2"], vendaMinima: 1000000, locacaoMinima: 4000 }));
  assert(f.startsWith(PUBLISHED_FILTER));
  assert(f.includes('lower(neighborhood) in ["bela suíça","bela suica"]'));
  assert(f.includes('condominioRef._ref in ["c1","c2"]'));
  assert(f.includes("(price >= 1000000 || rentPrice >= 4000)"));
});

test("curadoria: 'nunca no Premium' vence; 'sempre no Premium' ignora bairro e valor", () => {
  const f = buildPremiumFilter(normalizeConfig({ bairrosPremium: ["X"], forcarPremium: ["AP1"], forcarMatriz: ["AP1", "CA2"] }));
  const excluir = f.indexOf('!(codigoImovel in ["AP1","CA2"])');
  const forcar = f.indexOf('codigoImovel in ["AP1"]');
  assert(excluir > -1 && forcar > -1 && excluir < forcar, "a exclusão é avaliada antes e vale para o 'sempre'");
  assert(f.includes(" && ("), "o OR fica entre parênteses para não vazar para os demais filtros");
});

test("sem bairros nem condomínios a regra não deixa passar nada (só a curadoria)", () => {
  const f = buildPremiumFilter(normalizeConfig({ bairrosPremium: [], condominioIds: [], forcarPremium: ["AP9"] }));
  assert(f.includes("(codigoImovel in [\"AP9\"] || false)"));
  const vazio = buildPremiumFilter(normalizeConfig({ bairrosPremium: [], condominioIds: [] }));
  assert(vazio.includes("(false || false)"));
});

test("valores com aspas ou barras não quebram o GROQ", () => {
  const f = buildPremiumFilter(normalizeConfig({ bairrosPremium: ['Jardim "Aurora"\\'], forcarPremium: ['A"B'] }));
  assert(f.includes('"jardim \\"aurora\\"\\\\"'));
  assert(f.includes('"A\\"B"'));
});

test("CEP: bairro oficial vence o do CRM; sem CEP conhecido vale o do CRM", () => {
  assert.equal(bairroExibicao("00000000", "Condomínio Qualquer"), "Condomínio Qualquer");
  assert.equal(bairroExibicao(null, null), null);
  assert.equal(bairroDoCep("not-a-cep"), null);
  const real = bairroDoCep("86030-030");
  if (real) assert.equal(bairroExibicao("86030030", "Condomínio X"), real);
});

test("bairroClause usa os CEPs do bairro e cai no nome do CRM só para CEP não resolvido", () => {
  const params: Record<string, unknown> = {};
  const clause = bairroClause("Bairro Que Nao Existe", params);
  assert.equal(
    clause,
    "(neighborhood in $exatosDoBairro || (!(neighborhood in $premiumExatos) && (cep in $cepsDoBairro || (neighborhood == $bairro && !(cep in $cepsResolvidos)))))"
  );
  assert.deepEqual(params.cepsDoBairro, []);
  assert.deepEqual(params.exatosDoBairro, []);
  assert.equal(params.bairro, "Bairro Que Nao Existe");
  assert(Array.isArray(params.cepsResolvidos));
});

const PREMIUM = { nomes: ["Gleba Palhano", "Bela Suíça"], exatos: ["Gleba Palhano", "Bela Suiça", "Bela Suíça"] };

test("coerência com a regra: bairro premium do CRM vence o CEP; 'Gleba Fazenda Palhano' vira 'Gleba Palhano'", () => {
  // CRM diz Bela Suiça (grafia do CRM), CEP aponta outro bairro: mantém o premium, com o nome da configuração.
  assert.equal(bairroExibicao("86055585", "Bela Suiça", PREMIUM), "Bela Suíça");
  // Sem ser premium no CRM, vale o oficial do CEP, já com o nome popular.
  assert.equal(bairroDoCep("86055585"), "Gleba Palhano");
  assert.equal(bairroExibicao("86055585", "Alphaville II", PREMIUM), "Gleba Palhano");
  // CEP desconhecido: fica o do CRM.
  assert.equal(bairroExibicao("00000000", "Alphaville II", PREMIUM), "Alphaville II");
});

test("bairroClause de bairro premium inclui as grafias do CRM e exclui das contas por CEP quem já é premium no CRM", () => {
  const params: Record<string, unknown> = {};
  const clause = bairroClause("Bela Suíça", params, PREMIUM);
  assert.deepEqual((params.exatosDoBairro as string[]).sort(), ["Bela Suiça", "Bela Suíça"]);
  assert.deepEqual(params.premiumExatos, PREMIUM.exatos);
  assert(clause.includes("!(neighborhood in $premiumExatos)"));
  const gleba: Record<string, unknown> = {};
  bairroClause("Gleba Palhano", gleba, PREMIUM);
  assert((gleba.cepsDoBairro as string[]).includes("86055585"), "CEPs de Gleba Fazenda Palhano contam como Gleba Palhano");
});

test("resolveBairrosExatos pega todas as grafias reais, inclusive 'Suiça' (cedilha sem acento no i)", () => {
  const achados = resolveBairrosExatos(["Bela Suíça", "Terra Bonita"], ["Bela Suiça", "Bela Suíça", "BELA SUICA", "Terra bonita", "Bela Vista", "Judith"]);
  assert.deepEqual(achados.sort(), ["BELA SUICA", "Bela Suiça", "Bela Suíça", "Terra bonita"]);
});

test("o filtro usa as grafias exatas dos dados além das variantes em minúsculas", () => {
  const f = buildPremiumFilter({ ...normalizeConfig({ bairrosPremium: ["Bela Suíça"] }), bairrosExatos: ["Bela Suiça"] });
  assert(f.includes('neighborhood in ["Bela Suiça"]'));
  assert(f.includes('lower(neighborhood) in ["bela suíça","bela suica"]'));
});

test("CRM manda: publicarPremium definido decide; sem ele vale a regra provisória do premiumConfig", () => {
  const f = buildPremiumFilter(normalizeConfig({ bairrosPremium: ["Terra Bonita"], forcarMatriz: ["AP1"] }));
  assert(f.startsWith(`${PUBLISHED_FILTER} && ((defined(publicarPremium) && publicarPremium == true) || (!defined(publicarPremium) && `));
  // publicarPremium == false não casa com nenhum dos dois ramos: sai, mesmo que a regra provisória o deixasse entrar.
  const [decidido, provisorio] = f.split("|| (!defined(publicarPremium) && ");
  assert(decidido.includes("publicarPremium == true") && !decidido.includes("Terra Bonita") && !decidido.includes("terra bonita"));
  assert(provisorio.includes('lower(neighborhood) in ["terra bonita"]') && provisorio.includes('!(codigoImovel in ["AP1"])'));
  assert(!provisorio.includes("publicarPremium == true"), "o ramo provisório só vale sem publicarPremium");
});
