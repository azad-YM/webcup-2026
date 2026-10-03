import Link from "next/link"
import type { Route } from "next"
import { BreadcrumbTrail } from "@boilerplate/shared-ui/components/a11y"

export type BreadcrumbItem = { label: string; href?: Route }

/**
 * Fil d’Ariane (D15) : indique où l’on se trouve et permet de revenir aux
 * niveaux précédents. « Accueil » est toujours le premier niveau ; le dernier
 * élément est la page courante (`aria-current="page"`, sans lien).
 * Rendu commun : `BreadcrumbTrail` de `@boilerplate/shared-ui` (aussi utilisé par l’admin).
 */
export function Breadcrumb({ trail, inverted = false }: { trail: BreadcrumbItem[]; inverted?: boolean }) {
  return (
    <BreadcrumbTrail
      items={[{ label: "Accueil", href: "/" }, ...trail]}
      inverted={inverted}
      renderLink={(item, className) => <Link href={item.href as Route} className={className}>{item.label}</Link>}
    />
  )
}
