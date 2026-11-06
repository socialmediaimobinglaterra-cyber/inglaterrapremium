import "server-only";
import { getPool } from "@/lib/db";
import type { HomeBanner } from "@/lib/home-banners";

export type AdminBanner = HomeBanner & { ativo: boolean; ordem: number };
let ready: Promise<unknown> | undefined;
export function ensureBannerSchema() {
  if (!ready) ready = getPool().query(`create table if not exists home_banners (
    id uuid primary key, imagem text not null, alt text not null,
    link text, width int not null check(width > 0), height int not null check(height > 0),
    ordem int not null default 0 check(ordem >= 0), ativo boolean not null default false,
    created_at timestamptz not null default now()
  )`).catch(error => { ready = undefined; throw error; });
  return ready;
}

export async function listBanners(activeOnly = false): Promise<AdminBanner[]> {
  const { rows } = await getPool().query(`select id, imagem, alt, link, width, height, ordem, ativo
    from home_banners ${activeOnly ? "where ativo = true" : ""} order by ordem asc, created_at asc, id asc`);
  return rows.map(row => ({ id: row.id, image: `/api/blob-image?url=${encodeURIComponent(row.imagem)}`,
    alt: row.alt, href: row.link, width: row.width, height: row.height, ordem: row.ordem, ativo: row.ativo }));
}
