import type { Pool } from "pg";

export async function ensureInstagramPostsTable(pool: Pool) {
  await pool.query(`
create table if not exists instagram_posts (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  imagem text,
  legenda text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
)
  `);

  await pool.query("alter table instagram_posts add column if not exists imagem text");
  await pool.query("alter table instagram_posts add column if not exists legenda text");

  await pool.query(`
    create index if not exists instagram_posts_ordem_idx
      on instagram_posts (ativo, ordem, created_at)
  `);
}
