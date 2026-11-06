import { unstable_cache } from "next/cache";
import { listBanners } from "@/lib/admin/banners";

const readBanners = unstable_cache(() => listBanners(true), ["admin-home-banners-v1"], {
  revalidate: 60, tags: ["home-banners"],
});

export async function getHomeBanners() {
  try { return await readBanners(); }
  catch (error) {
    // An optional banner must not take the public Home offline before setup.
    console.error("home_banners_unavailable", { code: (error as { code?: string }).code ?? "configuration" });
    return [];
  }
}
