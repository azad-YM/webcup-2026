import type { MetadataRoute } from "next"
import { siteEnv } from "@/config/env"

export const dynamic = "force-static"

export default function sitemap(): MetadataRoute.Sitemap {
  return [{
    url: siteEnv.siteUrl,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  }]
}
