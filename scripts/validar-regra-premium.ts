/**
 * Valida a regra Premium contra o Sanity de verdade (somente leitura):
 *   npx tsx scripts/validar-regra-premium.ts
 * 1) conta os imóveis que o filtro GROQ deixa passar; 2) reimplementa a regra em JavaScript,
 * sobre os mesmos dados, e exige que o resultado seja IDÊNTICO; 3) abre a contagem por motivo
 * e mostra amostras de dentro e de fora.
 */
import fs from "node:fs";
import path from "node:path";
import { PUBLISHED_FILTER, buildPremiumFilter, normalizeConfig, normalizeText, resolveBairrosExatos } from "../lib/premium-rule-core";

function env(name: string) {
  const file = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  const line = file.split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).replace(/^"|"$/g, "").trim() : "";
}

async function query<T>(groq: string): Promise<T> {
  const res = await fetch(`https://xpdl3i95.api.sanity.io/v2024-01-01/data/query/production?query=${encodeURIComponent(groq)}`, {
    headers: { Authorization: `Bearer ${env("SANITY_API_TOKEN")}` },
  });
  if (!res.ok) throw new Error(`Sanity ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { result: T }).result;
}

type Row = {
  _id: string; codigoImovel: string | null; neighborhood: string | null; cep: string | null; cidade: string | null;
  price: number | null; rentPrice: number | null; condRef: string | null; condNome: string | null; condRefNome: string | null; title: string | null;
};

// Prova no GROQ de verdade (documentos de exemplo dentro da própria consulta, nada é gravado):
// publicarPremium definido manda; sem ele vale a regra provisória.
async function autoTesteCrmManda() {
  const cfg = { ...normalizeConfig({ bairrosPremium: ["Terra Bonita"], vendaMinima: 1000000, locacaoMinima: 4000 }), bairrosExatos: ["Terra Bonita"] };
  const f = buildPremiumFilter(cfg);
  const base = { status: "ativo", publicarSite: true };
  const docs = [
    { id: "crm-true-fora-da-regra", ...base, neighborhood: "Centro", price: 100000, publicarPremium: true },
    { id: "crm-false-dentro-da-regra", ...base, neighborhood: "Terra Bonita", price: 2000000, publicarPremium: false },
    { id: "sem-campo-dentro-da-regra", ...base, neighborhood: "Terra Bonita", price: 2000000 },
    { id: "sem-campo-fora-da-regra", ...base, neighborhood: "Centro", price: 2000000 },
    { id: "crm-true-mas-inativo", status: "inativo", publicarSite: true, neighborhood: "Centro", publicarPremium: true },
  ];
  const passam = await query<string[]>(`${JSON.stringify(docs)}[${f}].id`);
  const esperado = ["crm-true-fora-da-regra", "sem-campo-dentro-da-regra"];
  const ok = JSON.stringify([...passam].sort()) === JSON.stringify([...esperado].sort());
  console.log(`Auto-teste GROQ (CRM manda): passam ${JSON.stringify(passam)} | esperado ${JSON.stringify(esperado)} -> ${ok ? "OK" : "FALHOU"}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  await autoTesteCrmManda();
  const base0 = normalizeConfig(
    await query(`*[_id == "premiumConfig"][0] { bairrosPremium, "condominioIds": condominiosPremium[]._ref, vendaMinima, locacaoMinima, forcarPremium, forcarMatriz }`)
  );
  const existentes = await query<string[]>(`array::unique(*[_type == "property" && ${PUBLISHED_FILTER} && defined(neighborhood)].neighborhood)`);
  const config = { ...base0, bairrosExatos: resolveBairrosExatos(base0.bairrosPremium, existentes) };
  console.log(`Grafias de bairro premium encontradas nos imóveis: ${config.bairrosExatos.join(" | ")}`);
  console.log(`Config: ${config.bairrosPremium.length} bairros, ${config.condominioIds.length} condomínios, venda>=${config.vendaMinima}, locação>=${config.locacaoMinima}, forçar+ ${config.forcarPremium.length}, forçar- ${config.forcarMatriz.length}`);

  const filter = buildPremiumFilter(config);
  const base = `_type == "property" && status == "ativo" && publicarSite == true`;
  const FIELDS = `{ _id, codigoImovel, neighborhood, cep, cidade, price, rentPrice, title, "condRef": condominioRef._ref, "condNome": condominioNome, "condRefNome": condominioRef->nome }`;
  const [todos, groq] = await Promise.all([
    query<Row[]>(`*[${base}] ${FIELDS}`),
    query<string[]>(`*[_type == "property" && ${filter}]._id`),
  ]);

  // Reimplementação independente (JavaScript puro, sem GROQ).
  const bairros = new Set(config.bairrosPremium.map(normalizeText));
  const condos = new Set(config.condominioIds);
  const forcar = new Set(config.forcarPremium);
  const excluir = new Set(config.forcarMatriz);
  const motivo = (r: Row) => {
    const code = (r.codigoImovel ?? "").toUpperCase();
    if (excluir.has(code)) return "fora:curadoria";
    if (forcar.has(code)) return "dentro:curadoria";
    const porBairro = bairros.has(normalizeText(r.neighborhood ?? ""));
    const porCondo = r.condRef ? condos.has(r.condRef) : false;
    const valor = (r.price ?? 0) >= config.vendaMinima && r.price != null || (r.rentPrice != null && r.rentPrice >= config.locacaoMinima);
    if (!(porBairro || porCondo)) return "fora:local";
    if (!valor) return "fora:valor";
    return `dentro:${porBairro && porCondo ? "bairro+condomínio" : porBairro ? "bairro" : "condomínio"}`;
  };
  const js = todos.filter((r) => motivo(r).startsWith("dentro"));
  const setGroq = new Set(groq);
  const setJs = new Set(js.map((r) => r._id));
  const soGroq = [...setGroq].filter((id) => !setJs.has(id));
  const soJs = [...setJs].filter((id) => !setGroq.has(id));

  console.log(`\nImóveis publicados pelo CRM: ${todos.length}`);
  console.log(`Passam pela regra — filtro GROQ: ${groq.length} | reimplementação JS: ${js.length}`);
  console.log(soGroq.length || soJs.length ? `DIVERGÊNCIA! só GROQ: ${soGroq.slice(0, 5)} | só JS: ${soJs.slice(0, 5)}` : "Conferência: os dois métodos dão EXATAMENTE os mesmos imóveis.");

  const porMotivo = new Map<string, number>();
  for (const r of todos) porMotivo.set(motivo(r), (porMotivo.get(motivo(r)) ?? 0) + 1);
  console.log("\nPor motivo:");
  for (const [m, n] of [...porMotivo].sort()) console.log(`  ${m.padEnd(24)} ${n}`);

  const dentro = js;
  const venda = dentro.filter((r) => (r.price ?? 0) >= config.vendaMinima).length;
  const loc = dentro.filter((r) => (r.rentPrice ?? 0) >= config.locacaoMinima).length;
  console.log(`\nDentro: ${venda} com venda >= mínimo, ${loc} com locação >= mínimo (um imóvel pode ter os dois).`);
  const porBairro = new Map<string, number>();
  for (const r of dentro) porBairro.set(r.neighborhood ?? "(sem bairro)", (porBairro.get(r.neighborhood ?? "(sem bairro)") ?? 0) + 1);
  console.log("Dentro por bairro do CRM (top 12):", [...porBairro].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([b, n]) => `${b}=${n}`).join("; "));
  const porCondo = new Map<string, number>();
  for (const r of dentro) if (r.condRef && condos.has(r.condRef)) porCondo.set(r.condRefNome ?? r.condRef, (porCondo.get(r.condRefNome ?? r.condRef) ?? 0) + 1);
  console.log("Dentro por condomínio premium:", [...porCondo].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}=${n}`).join("; "));

  // O que as hipóteses ainda em aberto acrescentariam (NÃO estão na regra).
  const extraGleba = todos.filter((r) => /fazenda palhano/i.test(r.neighborhood ?? "") && motivo(r).startsWith("fora:") && ((r.price ?? 0) >= config.vendaMinima || (r.rentPrice ?? 0) >= config.locacaoMinima));
  console.log(`\nHipótese em aberto: bairro "Gleba Fazenda Palhano" tratado como Gleba Palhano acrescentaria ${extraGleba.length} imóveis.`);
  const semRefComNome = todos.filter((r) => !r.condRef && r.condNome && motivo(r).startsWith("fora:local"));
  console.log(`Imóveis com nome de condomínio mas SEM vínculo (condominioRef) fora da regra por local: ${semRefComNome.length} (a regra só reconhece condomínio vinculado).`);

  const amostra = (lista: Row[], n: number) => lista.filter((_, i) => i % Math.max(1, Math.floor(lista.length / n)) === 0).slice(0, n);
  console.log("\nAMOSTRA DENTRO (10):");
  for (const r of amostra(dentro, 10)) console.log(`  ${r.codigoImovel} | ${r.neighborhood} | cond:${r.condRefNome ?? "-"} | venda ${r.price ?? "-"} | loc ${r.rentPrice ?? "-"} | ${motivo(r)}`);
  const fora = todos.filter((r) => !motivo(r).startsWith("dentro"));
  console.log("\nAMOSTRA FORA (10):");
  for (const r of amostra(fora, 10)) console.log(`  ${r.codigoImovel} | ${r.neighborhood} | cond:${r.condRefNome ?? r.condNome ?? "-"} | venda ${r.price ?? "-"} | loc ${r.rentPrice ?? "-"} | ${motivo(r)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
