import { createClient } from "@sanity/client";

export const projectId = process.env.SANITY_PROJECT_ID || "xpdl3i95";
export const dataset = process.env.SANITY_DATASET || "production";
export const apiVersion = "2024-01-01";

export const sanity = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
});
