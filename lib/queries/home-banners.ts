import { unstable_cache } from "next/cache";
import { sanity, projectId, dataset } from "@/lib/sanity";
import { normalizeHomeBanners, type HomeBannerRow } from "@/lib/home-banners";

export const getHomeBanners = unstable_cache(async () => {
  const rows = await sanity.fetch<HomeBannerRow[]>(
    `*[_type == "homeBanner" && ativo == true && !(_id in path("drafts.**")) && defined(imagem.asset)]
      | order(ordem asc, _createdAt asc) {
        _id, titulo, textoAlternativo, link, "imagemUrl": imagem.asset->url,
        "width": imagem.asset->metadata.dimensions.width,
        "height": imagem.asset->metadata.dimensions.height
      }`
  );
  return normalizeHomeBanners(rows);
}, ["home-banners-v1", projectId, dataset], { revalidate: 60 });
