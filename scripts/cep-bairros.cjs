/**
 * Gera `data/cep-bairros.json`: CEP -> bairro oficial (ViaCEP) para os imóveis
 * ativos do Sanity. Serve SÓ para o filtro de bairros e para mostrar o bairro
 * certo no site; nada é gravado no Sanity (o CRM é dono do campo `neighborhood`).
 *
 *   node scripts/cep-bairros.cjs
 *
 * Uma consulta por CEP único (BrasilAPI, com AwesomeAPI e ViaCEP de reserva), com pausa e retomada: o que já está no arquivo
 * não é consultado de novo. CEP que o ViaCEP não resolve fica como `null`
 * (o site mantém o bairro original nesses casos).
 */
const fs = require("node:fs");
const path = require("node:path");

const SAIDA = path.join(__dirname, "..", "data", "cep-bairros.json");
const PAUSA_MS = 250;

function env(name) {
  const file = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  const line = file.split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).replace(/^"|"$/g, "").trim() : "";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ceps() {
  const groq = `array::unique(*[_type=="property" && status=="ativo" && publicarSite==true && defined(cep)].cep)`;
  const res = await fetch(`https://xpdl3i95.api.sanity.io/v2024-01-01/data/query/production?query=${encodeURIComponent(groq)}`, {
    headers: { Authorization: `Bearer ${env("SANITY_API_TOKEN")}` },
  });
  return ((await res.json()).result ?? []).map((c) => String(c).replace(/\D/g, "")).filter((c) => c.length === 8);
}

// Provedores em ordem: o ViaCEP bloqueia depois de umas centenas de consultas seguidas,
// então BrasilAPI (que agrega vários) e AwesomeAPI entram antes e como reserva.
const PROVEDORES = [
  ["brasilapi", (cep) => `https://brasilapi.com.br/api/cep/v1/${cep}`, (j) => ({ bairro: j.neighborhood, cidade: j.city, uf: j.state })],
  ["awesomeapi", (cep) => `https://cep.awesomeapi.com.br/json/${cep}`, (j) => ({ bairro: j.district, cidade: j.city, uf: j.state })],
  ["viacep", (cep) => `https://viacep.com.br/ws/${cep}/json/`, (j) => (j.erro ? null : { bairro: j.bairro, cidade: j.localidade, uf: j.uf })],
];

async function consultarCep(cep) {
  let algumFalhou = false;
  for (const [, url, ler] of PROVEDORES) {
    try {
      const res = await fetch(url(cep), { signal: AbortSignal.timeout(6000) });
      if (res.status === 404) continue; // este provedor não conhece o CEP; tenta o próximo
      if (!res.ok) { algumFalhou = true; continue; }
      const dados = ler(await res.json());
      const bairro = dados && typeof dados.bairro === "string" ? dados.bairro.trim() : "";
      if (bairro) return { bairro, cidade: dados.cidade || null, uf: dados.uf || null };
    } catch {
      algumFalhou = true;
    }
  }
  return algumFalhou ? undefined : null; // undefined = tenta de novo na próxima execução; null = nenhum provedor resolve
}

async function main() {
  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  const mapa = fs.existsSync(SAIDA) ? JSON.parse(fs.readFileSync(SAIDA, "utf8")) : {};
  // Aproveita o cache do script de condomínios (mesmo formato do ViaCEP).
  const antigo = path.join(__dirname, "..", "..", "studio", "cep-cache.json");
  if (fs.existsSync(antigo)) {
    for (const [cep, v] of Object.entries(JSON.parse(fs.readFileSync(antigo, "utf8")))) {
      if (!(cep in mapa) && v && v.bairro !== undefined) mapa[cep] = { bairro: (v.bairro || "").trim() || null, cidade: v.localidade || null, uf: v.uf || null };
    }
  }
  const todos = await ceps();
  const faltam = todos.filter((c) => !(c in mapa));
  console.log(`${todos.length} CEPs únicos nos imóveis; ${faltam.length} a consultar`);
  let n = 0;
  const LOTE = 4; // consultas em paralelo (cada CEP tenta os provedores em sequência)
  for (let i = 0; i < faltam.length; i += LOTE) {
    const lote = faltam.slice(i, i + LOTE);
    const respostas = await Promise.all(lote.map((cep) => consultarCep(cep)));
    lote.forEach((cep, k) => {
      if (respostas[k] !== undefined) mapa[cep] = respostas[k];
    });
    n += lote.length;
    if (Math.floor(n / 40) !== Math.floor((n - lote.length) / 40)) {
      fs.writeFileSync(SAIDA, JSON.stringify(mapa, null, 0));
      console.log(`${n}/${faltam.length}`);
    }
    await sleep(PAUSA_MS);
  }
  const ordenado = Object.fromEntries(Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(SAIDA, JSON.stringify(ordenado));
  const resolvidos = Object.values(ordenado).filter((v) => v && v.bairro).length;
  console.log(`pronto: ${Object.keys(ordenado).length} CEPs no arquivo, ${resolvidos} com bairro`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
