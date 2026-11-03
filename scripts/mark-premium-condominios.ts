// APOSENTADO (nov/2026). Este script marcava condomínios premium na tabela `condominios` do
// Postgres a partir de uma lista fixa de 49 nomes. O site não lê mais isso: a regra Premium vive
// no documento `premiumConfig` do Sanity (Studio > "Regra do site Premium"), definida pela
// Eveline (Marketing).
//
// Para conferir ou refazer o mapeamento "nome da Eveline -> cadastro do CRM":
//   node scripts/premium-config.cjs            (só relatório)
//   node scripts/premium-config.cjs --apply    (grava o documento premiumConfig)
console.error(
  "mark-premium-condominios foi aposentado: a regra Premium agora é o documento premiumConfig no Sanity. " +
    "Veja scripts/premium-config.cjs."
);
process.exit(1);
