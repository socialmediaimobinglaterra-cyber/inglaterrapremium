import assert from "node:assert/strict";
import { test } from "node:test";
import { codigosDoTipo, tipoRotulo } from "../lib/tipos-imovel";

test("os 11 tipos novos do CRM têm rótulo certo", () => {
  const esperado: Record<string, string> = {
    chacara: "Chácara", sitio: "Sítio", fazenda: "Fazenda", area: "Área", barracao: "Barracão", edicula: "Edícula",
    flat: "Flat", loft: "Loft", hotel: "Hotel", loja: "Loja", ponto: "Ponto Comercial", kitnet: "Kitnet",
  };
  for (const [codigo, rotulo] of Object.entries(esperado)) assert.equal(tipoRotulo(codigo), rotulo, codigo);
});

test("códigos padrão do CRM e do Gaia viram o mesmo rótulo e o mesmo filtro", () => {
  assert.equal(tipoRotulo("sala_comercial"), tipoRotulo("sala"));
  assert.equal(tipoRotulo("predio_comercial"), tipoRotulo("predio"));
  assert.equal(tipoRotulo("estudio"), tipoRotulo("studio"));
  assert.deepEqual(codigosDoTipo("Sala").sort(), ["sala", "sala_comercial"]);
  assert.deepEqual(codigosDoTipo("sala_comercial").sort(), ["sala", "sala_comercial"]);
  assert.deepEqual(codigosDoTipo("Salão").sort(), ["salao", "salao_comercial"]);
});

test("tipo desconhecido não quebra: rótulo legível e filtro pelo próprio código", () => {
  assert.equal(tipoRotulo("casa_de_praia"), "Casa de praia");
  assert.equal(tipoRotulo(null), "Imóvel");
  assert.ok(codigosDoTipo("casa_de_praia").includes("casa_de_praia"));
});
