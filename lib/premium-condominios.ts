// Quais condomínios são premium NÃO fica mais aqui: vem do documento `premiumConfig` do Sanity
// (editável no Studio, regra da Eveline/Marketing). Este arquivo só monta o diretório público.
type DirectoryEntry = { _id: string; nome: string; slug: string | null; ativo?: boolean };

function slugify(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Imported CRM records have no public slug. Keep curated slugs when present;
// disambiguate duplicate names by document ID instead of merging different condominiums.
export function publicCondominioDirectory(rows: DirectoryEntry[], premiumIds: string[]) {
  const premium = new Set(premiumIds);
  const selected = rows.filter((row) => row.ativo !== false && premium.has(row._id))
    .map((row) => ({ ...row, slug: row.slug?.trim() || slugify(row.nome) }));
  const counts = new Map<string, number>();
  for (const row of selected) counts.set(row.slug, (counts.get(row.slug) ?? 0) + 1);
  return selected.map((row) => ({ ...row,
    slug: counts.get(row.slug)! > 1 ? `${row.slug}-${slugify(row._id)}` : row.slug,
  }));
}
