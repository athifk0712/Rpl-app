import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Halaman publik boleh diindeks; endpoint API dan riwayat permintaan penawaran tidak.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/permintaan"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
