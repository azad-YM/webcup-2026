import type { MetadataRoute } from "next"
import { siteEnv } from "@/config/env"

export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
    sitemap: `${siteEnv.siteUrl}/sitemap.xml`,
  }
}
