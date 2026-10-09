import { cache } from "react";
import { unstable_cache } from "next/cache";
import { projectId, dataset } from "@/lib/sanity";
import { getHeaderCondominios } from "./condominios";
import { getHeaderLancamentos } from "./lancamentos";

// Public links only: no session, search history or private CRM data is cached.
export const getSiteNavigation = cache(unstable_cache(async () => {
  const [lancamentos, condominios] = await Promise.all([
    getHeaderLancamentos(), getHeaderCondominios(),
  ]);
  return { lancamentos, condominios };
}, ["public-navigation-v1", projectId, dataset], { revalidate: 60 }));
