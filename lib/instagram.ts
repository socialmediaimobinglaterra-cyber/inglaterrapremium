type InstagramApiMedia = {
  id: string;
  caption?: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
};

export type InstagramPost = {
  id: string;
  imageUrl: string;
  permalink: string;
  alt: string;
};

function postImageUrl(post: InstagramApiMedia) {
  return post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url;
}

export async function getLatestInstagramPosts(limit = 3): Promise<InstagramPost[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) return [];

  const userId = process.env.INSTAGRAM_USER_ID?.trim() || "me";
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
  const url = new URL(`https://graph.instagram.com/${userId}/media`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", accessToken);

  try {
    const response = await fetch(url, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error("Instagram API retornou erro", response.status);
      return [];
    }

    const data = (await response.json()) as { data?: InstagramApiMedia[] };
    return (data.data ?? [])
      .map((post) => {
        const imageUrl = postImageUrl(post);
        if (!imageUrl || !post.permalink) return null;

        const caption = post.caption?.replace(/\s+/g, " ").trim();
        return {
          id: post.id,
          imageUrl,
          permalink: post.permalink,
          alt: caption
            ? `Post do Instagram da Inglaterra Premium: ${caption.slice(0, 120)}`
            : "Post do Instagram da Inglaterra Premium",
        };
      })
      .filter((post): post is InstagramPost => post !== null);
  } catch (error) {
    console.error("Erro ao buscar posts do Instagram", error);
    return [];
  }
}
