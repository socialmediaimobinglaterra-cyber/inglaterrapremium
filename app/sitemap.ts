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

const ACCENTED_CHARS =
  "ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç";
const UNACCENTED_CHARS =
  "AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc";

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
      with premium_config as (
        select array(
          select lower(translate(unnest(bairros_permitidos), '${ACCENTED_CHARS}', '${UNACCENTED_CHARS}'))
          from configuracoes_premium
          where chave = 'criterios_premium'
        ) as bairros_normalizados
      )
      select slug, updated_at
      from bairros
      cross join premium_config
      where ativo = true
        and lower(translate(nome, '${ACCENTED_CHARS}', '${UNACCENTED_CHARS}')) =
          any(premium_config.bairros_normalizados)
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
