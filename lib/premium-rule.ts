import { sanity } from "@/lib/sanity";
import { PUBLISHED_FILTER, buildPremiumFilter, normalizeConfig, resolveBairrosExatos, type PremiumConfig } from "@/lib/premium-rule-core";

export type { PremiumConfig } from "@/lib/premium-rule-core";

// A equipe edita a regra no Studio (documento `premiumConfig`) e o site acompanha em até 1 minuto.
// Cache em memória por instância (não usa o cache do Next para funcionar também em scripts e testes).
const TTL_MS = 60_000;
let atual: { em: number; valor: Promise<PremiumConfig> } | null = null;
let ultimaBoa: PremiumConfig | null = null;

async function carregar(): Promise<PremiumConfig> {
  const [raw, existentes] = await Promise.all([
    sanity.fetch(
      `*[_id == "premiumConfig"][0] {
        bairrosPremium, "condominioIds": condominiosPremium[]._ref,
        vendaMinima, locacaoMinima, forcarPremium, forcarMatriz
      }`
    ),
    // Grafias reais de bairro nos imóveis ("Bela Suiça" x "Bela Suíça"): o filtro usa as exatas.
    sanity.fetch<string[]>(
      `array::unique(*[_type == "property" && ${PUBLISHED_FILTER} && defined(neighborhood)].neighborhood)`
    ),
  ]);
  const config = normalizeConfig(raw);
  return (ultimaBoa = { ...config, bairrosExatos: resolveBairrosExatos(config.bairrosPremium, existentes ?? []) });
}

export function getPremiumConfig(): Promise<PremiumConfig> {
  const agora = Date.now();
  if (!atual || agora - atual.em > TTL_MS) {
    const valor = carregar().catch((error) => {
      atual = null; // tenta de novo na próxima chamada
      if (ultimaBoa) return ultimaBoa; // Sanity instável: segue com a última regra boa
      throw error;
    });
    atual = { em: agora, valor };
  }
  return atual.valor;
}

/** Filtro GROQ único de "o que aparece no site Premium". Use em TODA consulta pública de imóveis. */
export async function premiumFilter(): Promise<string> {
  return buildPremiumFilter(await getPremiumConfig());
}
