import type { BreadcrumbTrailItem } from "@boilerplate/shared-ui/components/a11y"

/**
 * Libellés du fil d’Ariane de l’admin (D15), par chemin. Une nouvelle page
 * ajoute ici son chemin ; un chemin inconnu affiche le dernier niveau connu.
 */
export const BREADCRUMB_LABELS: Record<string, string> = {
  "/espaces": "Modules",
  "/admin": "Administration",
  "/admin/role": "Rôles",
  "/admin/member": "Membres",
  "/admin/citizens": "Comptes citoyens",
  "/admin/security": "Journal de sécurité",
  "/admin/journal": "Journal des actions",
  "/contenus": "Contenus de la ville",
  "/contenus/alertes": "Alertes",
  "/contenus/services": "Services et transports",
  "/pilotage": "Pilotage",
  "/pilotage/tableau-de-bord": "Tableau de bord",
  "/demandes": "Demandes des habitants",
  "/demandes/rendez-vous": "Rendez-vous",
  "/demandes/inquietudes": "Inquiétudes",
}

/** « Modules » puis chaque niveau connu du chemin ; le dernier est la page courante. */
export function breadcrumbFor(pathname: string): BreadcrumbTrailItem[] {
  const clean = pathname.replace(/\/+$/, "") || "/"
  const segments = clean.split("/").filter(Boolean)
  const trail: BreadcrumbTrailItem[] = [{ label: "Modules", href: "/espaces" }]
  segments.forEach((_, index) => {
    const path = `/${segments.slice(0, index + 1).join("/")}`
    const label = BREADCRUMB_LABELS[path]
    if (label && path !== "/espaces") trail.push({ label, href: path })
  })
  return trail
}
