import { createHmac } from "node:crypto";
import { unstable_cache } from "next/cache";
import { getPool } from "./db";
import { normalizeName, type Vocabulary } from "./search-state";

let schemaReady: Promise<unknown> | undefined;
// Additive setup follows the existing editorial-schema pattern; never rerun catalog seeds.
function ensureAiSchema() {
  if (!schemaReady) schemaReady = getPool().query(`
    create table if not exists openai_usage_log (
      id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
      modelo text not null, prompt_tokens integer, completion_tokens integer, total_tokens integer,
      sucesso boolean not null, erro text
    );
    create index if not exists openai_usage_log_created_idx on openai_usage_log(created_at desc);
    create table if not exists ai_search_rate_limits (
      chave text primary key, inicio timestamptz not null, tentativas integer not null, expira_em timestamptz not null
    );
  `).catch(error => { schemaReady = undefined; throw error; });
  return schemaReady;
}

export const getSearchVocabulary = unstable_cache(async (): Promise<Vocabulary> => {
  const result = await getPool().query(`
    select distinct 'bairro' as campo, bairro_nome as nome from imoveis where ativo and bairro_nome is not null
    union select distinct 'tipo', tipo from imoveis where ativo and tipo is not null
    union select distinct 'condominio', coalesce(nullif(nome_condominio, ''), nome_edificio)
      from imoveis where ativo
    order by campo, nome
  `);
  const vocabulary: Vocabulary = { bairro: [], tipo: [], condominio: [] };
  for (const row of result.rows) if (row.nome?.trim()) vocabulary[row.campo as keyof Vocabulary].push(row.nome);
  return vocabulary;
}, ["ai-search-vocabulary"], { revalidate: 600 });

// Only short, relevant names are sent, never property records or the entire vocabulary.
export function vocabularyHints(query: string, vocabulary: Vocabulary) {
  const words = normalizeName(query).split(/\W+/).filter(w => w.length >= 4 && !["quero", "apartamento", "condominio", "residencial", "agora"].includes(w));
  return Object.fromEntries(Object.entries(vocabulary).map(([field, names]) => [field,
    (field === "tipo" ? names : names.filter(name => words.some(word => normalizeName(name).includes(word)))).slice(0, 12),
  ]));
}

export async function consumeAiQuota(request: Request) {
  await ensureAiSchema();
  const now = Date.now();
  // Vercel supplies this header. Never trust a client-provided x-forwarded-for.
  const ip = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() || "unknown" : "local";
  const hash = createHmac("sha256", process.env.OPENAI_API_KEY!).update(`${Math.floor(now / 86400000)}:${ip}`).digest("hex");
  const buckets = [
    { key: `ip-minute:${hash}`, window: 60000, limit: 12 },
    { key: `ip-day:${hash}`, window: 86400000, limit: 100 },
    { key: "global-hour", window: 3600000, limit: 500 },
    { key: "global-day", window: 86400000, limit: 3000 },
  ].sort((a,b) => a.key.localeCompare(b.key));
  const client = await getPool().connect();
  try {
    await client.query("begin");
    for (const bucket of buckets) {
      const start = Math.floor(now / bucket.window) * bucket.window;
      const result = await client.query(`insert into ai_search_rate_limits(chave,inicio,tentativas,expira_em)
        values($1,$2,1,$3) on conflict(chave) do update set
        tentativas = case when ai_search_rate_limits.inicio = excluded.inicio then ai_search_rate_limits.tentativas + 1 else 1 end,
        inicio = excluded.inicio, expira_em = excluded.expira_em returning tentativas`,
        [bucket.key, new Date(start), new Date(start + bucket.window)]);
      if (result.rows[0].tentativas > bucket.limit) {
        await client.query("rollback");
        return Math.max(1, Math.ceil((start + bucket.window - now) / 1000));
      }
    }
    await client.query("delete from ai_search_rate_limits where expira_em < now() - interval '1 day'");
    await client.query("commit");
    return 0;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally { client.release(); }
}

export async function recordOpenAiUsage(modelo: string, usage: Record<string, unknown> | undefined, sucesso: boolean, erro: string | null) {
  const count = (key: string) => typeof usage?.[key] === "number" && Number.isInteger(usage[key]) && (usage[key] as number) >= 0 ? usage[key] : null;
  const record = { modelo, prompt_tokens: count("prompt_tokens"), completion_tokens: count("completion_tokens"), total_tokens: count("total_tokens"), sucesso, erro };
  try {
    await getPool().query(`insert into openai_usage_log(modelo,prompt_tokens,completion_tokens,total_tokens,sucesso,erro) values($1,$2,$3,$4,$5,$6)`, Object.values(record));
  } catch {
    console.error("openai_usage_log_unavailable", JSON.stringify({ ...record, created_at: new Date().toISOString() }));
  }
}
