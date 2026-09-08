import type { Pool } from "pg";

export async function ensureBairroEditorialColumns(pool: Pool) {
  await pool.query("alter table bairros add column if not exists imagem_capa text");
  await pool.query(
    "alter table bairros add column if not exists imagem_capa_alinhamento text not null default 'center center'"
  );
}
