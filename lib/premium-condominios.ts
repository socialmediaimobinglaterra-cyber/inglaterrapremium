// Approved selection and explicitly confirmed name variants. Never use fuzzy matching.
export const PREMIUM_CONDOMINIOS = [
  "Malie Home Resort", "Condomínio Estância Cabral", "Alphaville Imbuias",
  "Sun Lake Residence", "The Euro Royal Residence & Resort", "Condomínio Residencial Graciosa",
  "Via Felice", "Maanaim", "Estância Cabral", "Condomínio Golden Hill",
  "Condomínio Terras de Canaã", "Condomínio Villa Noah", "Condomínio Santana Residence",
  "Residencial Via Bella", "Condomínio Residencial Tucanos", "Royal Park Residence & Resort",
  "Royal Tennis Residence & Resort", "Royal Golf Residence", "Royal Forest", "Acácia Imperial",
  "Alphaville II", "Condomínio Vila Florença", "Residencial Bélgica", "Recanto do Salto",
  "Residencial São Lourenço", "Royal Tennis", "Alphaville Jacarandás", "Condomínio Village Premium",
  "Pitanguá", "Condomínio Petit Ville", "Recanto Golfe Vile", "Condomínio Ilha de Creta",
  "Estância Santa Paula", "Sunset Dream Residence", "Alphaville I Imbuias", "Condomínio Royal Maison",
  "Artesano Londrina", "Catuaí Park Residence", "Residencial Atenas", "Condomínio Morada Imperial",
  "Sun Lake", "Royal Park Residence e Resort", "Royal Forest Residence & Resort",
  "Residencial Maanaim", "Associação Golden Hill Residence", "Residencial Athenas",
  "Condomínio Bélgica", "Residencial Terras de Canaã", "Recanto Golf Ville",
] as const;

export function normalizeCondominioName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ").trim().replace(/^condominio\s+/i, "").toLocaleLowerCase("pt-BR");
}

const approvedNames = new Set(PREMIUM_CONDOMINIOS.map(normalizeCondominioName));

export function isPremiumCondominio(nome: string) {
  return approvedNames.has(normalizeCondominioName(nome));
}

export const CONDOMINIO_PROPERTY_FILTER = `status == "ativo" && publicarSite == true
  && (price >= 1000000 || rentPrice >= 4000)`;

type DirectoryEntry = { _id: string; nome: string; slug: string | null; ativo?: boolean };

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Imported CRM records have no public slug. Keep curated slugs when present;
// disambiguate duplicate names by document ID instead of merging different condominiums.
export function publicCondominioDirectory(rows: DirectoryEntry[]) {
  const selected = rows.filter((row) => row.ativo !== false && isPremiumCondominio(row.nome))
    .map((row) => ({ ...row, slug: row.slug?.trim() || slugify(row.nome) }));
  const counts = new Map<string, number>();
  for (const row of selected) counts.set(row.slug, (counts.get(row.slug) ?? 0) + 1);
  return selected.map((row) => ({ ...row,
    slug: counts.get(row.slug)! > 1 ? `${row.slug}-${slugify(row._id)}` : row.slug,
  }));
}
