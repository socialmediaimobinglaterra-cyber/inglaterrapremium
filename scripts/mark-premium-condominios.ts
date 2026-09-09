import { getPool } from "@/lib/db";

const PREMIUM_CONDOMINIOS = [
  "Malie Home Resort",
  "Condomínio Estância Cabral",
  "Alphaville Imbuias",
  "Sun Lake Residence",
  "The Euro Royal Residence & Resort",
  "Condomínio Residencial Graciosa",
  "Via Felice",
  "Maanaim",
  "Estância Cabral",
  "Condomínio Golden Hill",
  "Condomínio Terras de Canaã",
  "Condomínio Villa Noah",
  "Condomínio Santana Residence",
  "Residencial Via Bella",
  "Condomínio Residencial Tucanos",
  "Royal Park Residence & Resort",
  "Royal Tennis Residence & Resort",
  "Royal Golf Residence",
  "Royal Forest",
  "Acácia Imperial",
  "Alphaville II",
  "Condomínio Vila Florença",
  "Residencial Bélgica",
  "Recanto do Salto",
  "Residencial São Lourenço",
  "Royal Tennis",
  "Alphaville Jacarandás",
  "Condomínio Village Premium",
  "Pitanguá",
  "Condomínio Petit Ville",
  "Recanto Golfe Vile",
  "Condomínio Ilha de Creta",
  "Estância Santa Paula",
  "Sunset Dream Residence",
  "Alphaville I Imbuias",
  "Condomínio Royal Maison",
  "Artesano Londrina",
  "Catuaí Park Residence",
  "Residencial Atenas",
  "Condomínio Morada Imperial",
] as const;

function normalizeMatchKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^condominio\s+/i, "")
    .toLocaleLowerCase("pt-BR");
}

async function main() {
  const pool = getPool();

  try {
    const { rows } = await pool.query<{ id: string; nome: string }>(
      "select id, nome from condominios order by nome"
    );

    const exactByName = new Map(rows.map((row) => [row.nome, row]));
    const normalizedByKey = new Map<string, Array<{ id: string; nome: string }>>();

    for (const row of rows) {
      const key = normalizeMatchKey(row.nome);
      const current = normalizedByKey.get(key) ?? [];
      current.push(row);
      normalizedByKey.set(key, current);
    }

    const providedDuplicates = new Map<string, string[]>();
    for (const name of PREMIUM_CONDOMINIOS) {
      const key = normalizeMatchKey(name);
      const current = providedDuplicates.get(key) ?? [];
      current.push(name);
      providedDuplicates.set(key, current);
    }

    const exactMatches: string[] = [];
    const normalizedMatches: Array<{ informado: string; encontrado: string }> = [];
    const notFound: string[] = [];
    const ambiguous: Array<{ informado: string; candidatos: string[] }> = [];
    const idsToMark = new Set<string>();

    for (const name of PREMIUM_CONDOMINIOS) {
      const exact = exactByName.get(name);
      if (exact) {
        exactMatches.push(exact.nome);
        idsToMark.add(exact.id);
        continue;
      }

      const candidates = normalizedByKey.get(normalizeMatchKey(name)) ?? [];
      if (candidates.length === 1) {
        normalizedMatches.push({ informado: name, encontrado: candidates[0].nome });
        idsToMark.add(candidates[0].id);
        continue;
      }

      if (candidates.length > 1) {
        ambiguous.push({ informado: name, candidatos: candidates.map((item) => item.nome) });
        continue;
      }

      notFound.push(name);
    }

    if (idsToMark.size > 0) {
      await pool.query(
        "update condominios set premium = true, updated_at = now() where id = any($1::uuid[])",
        [[...idsToMark]]
      );
    }

    const duplicateNames = [...providedDuplicates.values()].filter((items) => items.length > 1);

    console.log(
      JSON.stringify(
        {
          totalInformados: PREMIUM_CONDOMINIOS.length,
          totalMarcados: idsToMark.size,
          correspondenciasExatas: exactMatches.sort((a, b) => a.localeCompare(b, "pt-BR")),
          correspondenciasNormalizadas: normalizedMatches.sort((a, b) =>
            a.informado.localeCompare(b.informado, "pt-BR")
          ),
          naoEncontrados: notFound.sort((a, b) => a.localeCompare(b, "pt-BR")),
          ambiguos: ambiguous,
          duplicatasNaListaInformada: duplicateNames,
        },
        null,
        2
      )
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
