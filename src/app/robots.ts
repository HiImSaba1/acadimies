import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/admin/", "/api/admin/", "/article-preview"] },
    sitemap: ["https://acadimies.gr/sitemap.xml", "https://acadimies.gr/news-sitemap.xml"],
    host: "https://acadimies.gr",
  };
}
