import { getPool } from "@/lib/db";

export type InstagramPost = {
  id: string;
  url: string;
  ordem: number;
  ativo: boolean;
  createdAt: Date;
};

function mapInstagramPost(row: Record<string, any>): InstagramPost {
  return {
    id: row.id,
    url: row.url,
    ordem: Number(row.ordem ?? 0),
    ativo: Boolean(row.ativo),
    createdAt: row.created_at,
  };
}

export async function getActiveInstagramPosts() {
  const pool = getPool();
  try {
    const result = await pool.query(`
      select id, url, ordem, ativo, created_at
      from instagram_posts
      where ativo = true
      order by ordem asc, created_at asc
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
