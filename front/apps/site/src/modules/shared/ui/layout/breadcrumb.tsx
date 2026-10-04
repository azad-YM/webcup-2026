"use client"
import Link from "next/link"
import type { Route } from "next"
import { BreadcrumbTrail } from "@boilerplate/shared-ui/components/a11y"
import { useMessages } from "../i18n/i18n-provider"
import { COMMON_MESSAGES } from "../i18n/common-messages"

export type BreadcrumbItem = { label: string; href?: Route }

/**
 * Fil d’Ariane (D15) : indique où l’on se trouve et permet de revenir aux
 * niveaux précédents. « Accueil » est toujours le premier niveau ; le dernier
 * élément est la page courante (`aria-current="page"`, sans lien).
 * Rendu commun : `BreadcrumbTrail` de `@boilerplate/shared-ui` (aussi utilisé par l’admin).
 */
export function Breadcrumb({ trail, inverted = false }: { trail: BreadcrumbItem[]; inverted?: boolean }) {
  const t = useMessages(COMMON_MESSAGES)
  return (
    <BreadcrumbTrail
      items={[{ label: t.home, href: "/" }, ...trail]}
      inverted={inverted}
      renderLink={(item, className) => <Link href={item.href as Route} className={className}>{item.label}</Link>}
    />
  )
}
