import mapa from "@/data/cep-bairros.json";
import { normalizeText } from "@/lib/premium-rule-core";

// CEP -> bairro oficial (ViaCEP/BrasilAPI), gerado por `node scripts/cep-bairros.cjs`.
// Usado SÓ no filtro de bairros e para exibir o bairro certo: o campo `neighborhood`
// do Sanity é do CRM e vem poluído (muitos são nomes de condomínio).
//
// COERÊNCIA COM A REGRA PREMIUM: um imóvel que entra no Premium por estar num bairro premium
// (campo do CRM, ex.: "Gleba Palhano") mantém esse nome no filtro e no cartão, mesmo que o CEP
// diga outro bairro. Nos demais imóveis vale o bairro oficial do CEP.
type Entrada = { bairro: string | null; cidade: string | null; uf: string | null } | null;
const CEPS = mapa as Record<string, Entrada>;

/** Bairros premium da configuração: nomes (para exibir) e grafias exatas existentes nos dados (para o GROQ). */
export type BairrosPremium = { nomes: string[]; exatos: string[] };

export const bairrosPremiumDe = (config: { bairrosPremium: string[]; bairrosExatos: string[] }): BairrosPremium => ({
  nomes: config.bairrosPremium,
  exatos: config.bairrosExatos,
});

// Nome oficial dos Correios -> nome como a cidade (e a Marketing) chama o bairro.
const NOME_POPULAR: Record<string, string> = {
  "gleba fazenda palhano": "Gleba Palhano",
};
const popular = (bairro: string) => NOME_POPULAR[normalizeText(bairro)] ?? bairro;

const soDigitos = (cep: string | null | undefined) => (cep ?? "").replace(/\D/g, "");

/** Bairro oficial do CEP, ou null se o CEP é desconhecido/sem bairro (aí vale o bairro do CRM). */
export function bairroDoCep(cep: string | null | undefined): string | null {
  const bairro = CEPS[soDigitos(cep)]?.bairro;
  return bairro ? popular(bairro) : null;
}

/** Nome do bairro premium (como está na configuração) se o bairro do CRM é um deles. */
function bairroPremiumDoCrm(neighborhood: string | null | undefined, premium?: BairrosPremium): string | null {
  const crm = neighborhood?.trim();
  if (!crm || !premium) return null;
  const chave = normalizeText(crm);
  return premium.nomes.find((nome) => normalizeText(nome) === chave) ?? null;
}

/** Bairro a mostrar: premium do CRM se for um deles; senão o oficial pelo CEP; senão o do CRM. */
export function bairroExibicao(
  cep: string | null | undefined,
  neighborhood: string | null | undefined,
  premium?: BairrosPremium
): string | null {
  return bairroPremiumDoCrm(neighborhood, premium) ?? bairroDoCep(cep) ?? (neighborhood?.trim() || null);
}

const CEPS_RESOLVIDOS = Object.entries(CEPS).filter(([, v]) => v?.bairro).map(([cep]) => cep);

let porBairro: Map<string, string[]> | null = null;
function cepsPorBairro() {
  if (!porBairro) {
    porBairro = new Map();
    for (const cep of CEPS_RESOLVIDOS) {
      const chave = normalizeText(popular(CEPS[cep]!.bairro!));
      porBairro.set(chave, [...(porBairro.get(chave) ?? []), cep]);
    }
  }
  return porBairro;
}

/**
 * Cláusula GROQ "o imóvel está no bairro X", coerente com `bairroExibicao`:
 *  - bairro premium no CRM: vale o nome do CRM (qualquer grafia existente);
 *  - demais imóveis: bairro oficial pelo CEP; sem CEP resolvido, o escrito pelo CRM.
 * Preenche `params`.
 */
export function bairroClause(bairro: string, params: Record<string, unknown>, premium?: BairrosPremium): string {
  const chave = normalizeText(bairro);
  params.bairro = bairro;
  params.cepsDoBairro = cepsPorBairro().get(chave) ?? [];
  params.cepsResolvidos = CEPS_RESOLVIDOS;
  params.premiumExatos = premium?.exatos ?? [];
  params.exatosDoBairro = (premium?.exatos ?? []).filter((e) => normalizeText(e) === chave);
  return (
    "(neighborhood in $exatosDoBairro || (!(neighborhood in $premiumExatos) && " +
    "(cep in $cepsDoBairro || (neighborhood == $bairro && !(cep in $cepsResolvidos)))))"
  );
}

/** Nome de bairro para a lista do filtro, a partir de um imóvel. */
export function bairroDaLinha(row: { cep?: string | null; neighborhood?: string | null }, premium?: BairrosPremium): string | null {
  return bairroExibicao(row.cep, row.neighborhood, premium);
}
