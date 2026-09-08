import { getPool } from "@/lib/db";
import { ensureInstagramPostsTable } from "@/lib/admin/instagram-schema";

export type InstagramPost = {
  id: string;
  url: string;
  imagem: string | null;
  legenda: string | null;
  ordem: number;
  ativo: boolean;
  createdAt: Date;
};

function mapInstagramPost(row: Record<string, any>): InstagramPost {
  return {
    id: row.id,
    url: row.url,
    imagem: typeof row.imagem === "string" && row.imagem.trim() ? row.imagem.trim() : null,
    legenda: typeof row.legenda === "string" && row.legenda.trim() ? row.legenda.trim() : null,
    ordem: Number(row.ordem ?? 0),
    ativo: Boolean(row.ativo),
    createdAt: row.created_at,
  };
}

export async function getActiveInstagramPosts() {
  const pool = getPool();
  try {
    await ensureInstagramPostsTable(pool);
    const result = await pool.query(`
      select id, url, imagem, legenda, ordem, ativo, created_at
      from instagram_posts
      where ativo = true
        and imagem is not null
        and btrim(imagem) <> ''
      order by ordem asc, created_at asc
      limit 4
    `);

    return result.rows.map(mapInstagramPost);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "42P01"
    ) {
      return [];
    }

    throw error;
  }
}
