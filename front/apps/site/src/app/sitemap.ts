import type { MetadataRoute } from "next"
import { siteEnv } from "@/config/env"

export const dynamic = "force-static"

const PUBLIC_PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/services/", priority: 0.8 },
  { path: "/actualites/", priority: 0.8 },
  { path: "/projets/", priority: 0.7 },
  { path: "/participer/", priority: 0.7 },
  { path: "/participer/idees/", priority: 0.6 },
  { path: "/aide/glossaire/", priority: 0.4 },
  { path: "/vos-donnees/", priority: 0.4 },
  { path: "/vos-donnees/securite/", priority: 0.3 },
  { path: "/sobriete/", priority: 0.3 },
  { path: "/messages-officiels/", priority: 0.6 },
  { path: "/partenaires/", priority: 0.5 },
  { path: "/inscription/", priority: 0.5 },
  { path: "/connexion/", priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return PUBLIC_PAGES.map(({ path, priority }) => ({
    url: path === "/" ? siteEnv.siteUrl : `${siteEnv.siteUrl}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority,
  }))
}
