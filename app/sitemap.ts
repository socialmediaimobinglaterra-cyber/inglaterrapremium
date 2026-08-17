import type { MetadataRoute } from "next";
import { getPool } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type SitemapRow = {
  slug: string;
  updated_at: Date | string | null;
};

function lastModified(value: Date | string | null) {
  return value ? new Date(value) : new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pool = getPool();
  const [imoveisResult, bairrosResult] = await Promise.all([
    pool.query<SitemapRow>(`
      select slug, updated_at
      from imoveis
      where ativo = true
        and ativo_no_site = true
      order by updated_at desc nulls last, slug
    `),
    pool.query<SitemapRow>(`
      select slug, updated_at
      from bairros
      where ativo = true
      order by nome
    `),
  ]);

  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/imoveis"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/bairros"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const bairroRoutes: MetadataRoute.Sitemap = bairrosResult.rows.map((bairro) => ({
    url: absoluteUrl(`/bairros/${bairro.slug}`),
    lastModified: lastModified(bairro.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const imovelRoutes: MetadataRoute.Sitemap = imoveisResult.rows.map((imovel) => ({
    url: absoluteUrl(`/imoveis/${imovel.slug}`),
    lastModified: lastModified(imovel.updated_at),
    changeFrequency: "daily",
    priority: 0.75,
  }));

  return [...staticRoutes, ...bairroRoutes, ...imovelRoutes];
}
