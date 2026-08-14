import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mukhmall-69wnwkoh.manus.space";
  const now = new Date();
  return [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/#stories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/#videos`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/#shorts`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/#portfolio`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/#about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
