import type { MetadataRoute } from "next";
import { sanity } from "@/lib/sanity";
import { absoluteUrl } from "@/lib/site";
import { getPublicCondominios } from "@/lib/queries/condominios";

export const dynamic = "force-dynamic";

type SanitySlugRow = {
  slug: string;
  updatedAt: string | null;
};

function lastModified(value: string | null) {
  return value ? new Date(value) : new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [imoveis, bairros, condominios] = await Promise.all([
    sanity.fetch<SanitySlugRow[]>(
      `*[_type == "property" && status == "ativo" && publicarSite == true] {
        "slug": slug.current, "updatedAt": coalesce(dataAtualizacaoCRM, _updatedAt)
      } | order(updatedAt desc)`
    ),
    sanity.fetch<SanitySlugRow[]>(
      `*[_type == "bairro" && ativo == true] { "slug": slug.current, "updatedAt": _updatedAt } | order(slug asc)`
    ),
    getPublicCondominios(),
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

  const bairroRoutes: MetadataRoute.Sitemap = bairros
    .filter((bairro) => bairro.slug)
    .map((bairro) => ({
      url: absoluteUrl(`/bairros/${bairro.slug}`),
      lastModified: lastModified(bairro.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const imovelRoutes: MetadataRoute.Sitemap = imoveis
    .filter((imovel) => imovel.slug)
    .map((imovel) => ({
      url: absoluteUrl(`/imoveis/${imovel.slug}`),
      lastModified: lastModified(imovel.updatedAt),
      changeFrequency: "daily",
      priority: 0.75,
    }));

  const condominioRoutes: MetadataRoute.Sitemap = condominios.map((condominio) => ({
    url: absoluteUrl(`/condominios/${condominio.slug}`),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...bairroRoutes, ...imovelRoutes, ...condominioRoutes];
}
