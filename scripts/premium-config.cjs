/**
 * Monta o documento `premiumConfig` (regra do site Premium) a partir da lista
 * de condomínios da Eveline (Marketing, nov/2026) e gera o relatório de conferência.
 *
 *   node scripts/premium-config.cjs            -> só relatório (não grava nada)
 *   node scripts/premium-config.cjs --apply    -> cria/atualiza o doc `premiumConfig`
 *
 * Lê SANITY_API_TOKEN e SANITY_WRITE_TOKEN do .env.local. Casamento por IGUALDADE
 * do nome do cadastro (sem acento/caixa) usando a tabela ALIAS abaixo: nunca por
 * substring. Para mudar quem é premium, edite esta tabela (ou o doc no Studio).
 */
const fs = require("node:fs");
const path = require("node:path");

const PROJECT = "xpdl3i95";
const DATASET = "production";
const API = `https://${PROJECT}.api.sanity.io/v2024-01-01`;

function env(name) {
  const file = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  const line = file.split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).replace(/^"|"$/g, "").trim() : "";
}

const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

// Nome na lista da Eveline -> nome(s) EXATO(S) do cadastro `condominio` no CRM.
// Cadastros com o mesmo nome em CEPs diferentes entram todos (ex.: Terras de Canaã).
const ALIAS = [
  ["Acácia Imperial", ["Acácia Imperial"]],
  ["Alphaville II", ["Alphaville II"]],
  ["Alphaville Imbuias", ["Alphaville Imbuias"]],
  ["Associação Golden Hill Residence", ["Associação Golden Hill Residence"]],
  ["Condomínio Bélgica", ["Condomínio Bélgica"]],
  ["Condomínio Estância Cabral", ["Estância Cabral"]],
  ["Condomínio Morada Imperial", ["Morada Imperial"]],
  ["Condomínio Petit Ville", ["Petit Ville"]],
  ["Condomínio Residencial Graciosa", ["Residencial Graciosa"]],
  ["Condomínio Residencial Tucanos", ["Condomínio Residencial Tucanos"]],
  ["Condomínio Santana Residence", ["Condomínio Santana Residence"]],
  ["Condomínio Village Premium", ["Village Premium"]],
  ["Condomínio Villa Noah", ["Villa Noah"]],
  ["Estância Cabral", ["Estância Cabral"]],
  ["Estância Santa Paula", ["Condomínio Estância Santa Paula"]],
  ["Pitanguá", ["Pitangua"]],
  ["Recanto do Salto", ["Recanto do Salto"]],
  ["Recanto Golf Ville", ["Recanto Golf Ville"]],
  ["Residencial Athenas", ["Residenc Ial Athenas"]],
  ["Residencial Maanaim", ["Residencial Maanaim"]],
  ["Residencial Terras de Canaã", ["Residencial Terras de Canaã"]],
  ["Royal Forest Residence & Resort", ["Royal Forest Residence & Resort"]],
  ["Royal Golf Residence", ["Royal Golf Residence"]],
  ["Royal Park Residence e Resort", ["Royal Park Residence e Resort"]],
  ["Royal Tennis", ["Royal Tennis"]],
  ["Sun Lake", ["Sun Lake"]],
  ["Sunset Dream Residence", ["Sunset Dream Residence"]],
  ["The Euro Royal Residence & Resort", ["The Euro Royal Residence & Resort"]],
  // Lançamentos que a Eveline confirmou como premium.
  ["Artesano Londrina", ["Artesano"]],
];

// Premium confirmado, mas SEM cadastro no CRM ainda.
const SEM_CADASTRO = ["Malie Home Resort"];

// Decisão explícita de ficar de fora (para o relatório mostrar que não foi esquecimento).
const FORA_DE_PROPOSITO = [
  ["Via Felice", "Eveline: não é premium"],
  ["Via Bella", "Eveline: não é premium"],
  ["Royal Maison Residence e Resort", "Eveline: Royal Maison não é premium"],
  ["Catuaí Residence", "Eveline: Catuaí Park não é premium"],
  ["Residencial Catuai", "Eveline: Catuaí Park não é premium"],
  ["Condomínio Residencial Alphaville", "Sem resposta sobre 'Alphaville Jacarandás' (não está na lista de 27): fica fora até confirmar"],
  ["Atenas", "Lista dela diz 'Residencial Athenas' (CEP 86047240); 'Atenas' (CEP 86046230) é outro cadastro: fica fora até confirmar"],
  ["Residencial Vale dos Tucanos", "Lista dela diz 'Condomínio Residencial Tucanos'; este é outro cadastro: fica fora até confirmar"],
  ["Solar dos Tucanos", "Não está na lista dela"],
  ["Reserva Santana", "Lista dela diz 'Condomínio Santana Residence'; este é outro cadastro"],
];

const BAIRROS = ["Terra Bonita", "Gleba Palhano", "Bela Suíça", "Nova Prochet"];

async function query(groq) {
  const url = `${API}/data/query/${DATASET}?query=${encodeURIComponent(groq)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${env("SANITY_API_TOKEN")}` } });
  if (!res.ok) throw new Error(`Sanity ${res.status}: ${await res.text()}`);
  return (await res.json()).result;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const docs = await query(
    `*[_type=="condominio"]{_id,nome,cep,bairro,cidade,"n":count(*[_type=="property"&&status=="ativo"&&publicarSite==true&&condominioRef._ref==^._id])}`,
  );
  const porNome = new Map();
  for (const d of docs) {
    const k = norm(d.nome);
    porNome.set(k, [...(porNome.get(k) ?? []), d]);
  }

  const escolhidos = new Map();
  const linhas = [];
  const problemas = [];
  for (const [nomeEveline, nomesDoc] of ALIAS) {
    const achados = nomesDoc.flatMap((n) => porNome.get(norm(n)) ?? []);
    if (!achados.length) problemas.push(`Sem cadastro para "${nomeEveline}" (${nomesDoc.join(" / ")})`);
    for (const d of achados) escolhidos.set(d._id, d);
    linhas.push({ nomeEveline, achados });
  }

  console.log("| Nome na lista da Eveline | Cadastro no CRM | CEP | Bairro no CRM | Imóveis ativos |");
  console.log("|---|---|---|---|---|");
  for (const { nomeEveline, achados } of linhas) {
    if (!achados.length) console.log(`| ${nomeEveline} | SEM CADASTRO | - | - | 0 |`);
    for (const d of achados) console.log(`| ${nomeEveline} | ${d.nome} | ${d.cep ?? "-"} | ${d.bairro ?? "-"} | ${d.n} |`);
  }
  for (const nome of SEM_CADASTRO) console.log(`| ${nome} | SEM CADASTRO no CRM (premium confirmado) | - | - | 0 |`);

  console.log("\nCadastros EXCLUÍDOS de propósito:");
  for (const [nome, motivo] of FORA_DE_PROPOSITO) {
    const ds = porNome.get(norm(nome)) ?? [];
    console.log(`- ${nome}${ds.length ? ` (${ds.map((d) => `CEP ${d.cep}, ${d.n} imóv.`).join("; ")})` : " (sem cadastro)"}: ${motivo}`);
  }
  if (problemas.length) console.log("\nPROBLEMAS:\n" + problemas.map((p) => `- ${p}`).join("\n"));

  const ids = [...escolhidos.keys()];
  console.log(`\n${ids.length} cadastros premium; soma de imóveis ativos nos cadastros: ${[...escolhidos.values()].reduce((s, d) => s + d.n, 0)}`);

  if (!apply) return console.log("\n(sem --apply: nada gravado)");

  const doc = {
    _id: "premiumConfig",
    _type: "premiumConfig",
    bairrosPremium: BAIRROS,
    condominiosPremium: ids.map((_ref) => ({ _type: "reference", _ref, _key: _ref.slice(-12) })),
    condominiosSemCadastro: SEM_CADASTRO,
    vendaMinima: 1000000,
    locacaoMinima: 4000,
    forcarPremium: [],
    forcarMatriz: [],
    observacoes:
      "Regra definida pela Eveline (Marketing) em novembro/2026. Pendências: confirmar 'Alphaville Jacarandás', 'Athenas x Atenas' e 'Residencial Tucanos'; cadastrar 'Malie Home Resort' no CRM.",
  };
  const res = await fetch(`${API}/data/mutate/${DATASET}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env("SANITY_WRITE_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mutations: [{ createOrReplace: doc }] }),
  });
  console.log(`\ncreateOrReplace premiumConfig -> HTTP ${res.status}`);
  if (!res.ok) throw new Error(await res.text());
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
