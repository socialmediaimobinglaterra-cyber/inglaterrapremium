import { sanity } from "@/lib/sanity";

export type InstagramPost = {
  id: string;
  url: string;
  imagem: string | null;
  legenda: string | null;
  ordem: number;
  ativo: boolean;
  createdAt: Date;
};

export async function getActiveInstagramPosts() {
  const rows = await sanity.fetch<
    Array<{ _id: string; _createdAt: string; url: string; legenda: string | null; ordem: number | null; imagemUrl: string | null }>
  >(
    `*[_type == "instagramPost" && ativo == true && defined(imagem)] {
      _id, _createdAt, url, legenda, ordem, "imagemUrl": imagem.asset->url
    } | order(ordem asc, _createdAt asc) [0...4]`
  );

  return rows.map((row): InstagramPost => ({
    id: row._id,
    url: row.url,
    imagem: row.imagemUrl,
    legenda: row.legenda,
    ordem: row.ordem ?? 0,
    ativo: true,
    createdAt: new Date(row._createdAt),
  }));
}
