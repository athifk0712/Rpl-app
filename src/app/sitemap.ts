import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const PUBLIC_PATHS = ["", "/suppliers", "/compare"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return PUBLIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));
}
