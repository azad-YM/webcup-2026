import Link from "next/link"
import type { Route } from "next"
import { ChevronRight } from "@boilerplate/shared-ui/components/icon"

export type BreadcrumbItem = { label: string; href?: Route }

/**
 * Fil d’Ariane (D15) : indique où l’on se trouve et permet de revenir aux
 * niveaux précédents. « Accueil » est toujours le premier niveau ; le dernier
 * élément est la page courante (`aria-current="page"`, sans lien).
 */
export function Breadcrumb({ trail, inverted = false }: { trail: BreadcrumbItem[]; inverted?: boolean }) {
  const items: BreadcrumbItem[] = [{ label: "Accueil", href: "/" }, ...trail]
  const linkClass = inverted ? "text-slate-200 underline-offset-4 hover:text-white hover:underline" : "text-teal-800 underline-offset-4 hover:underline"
  const currentClass = inverted ? "font-medium text-white" : "font-medium text-slate-900"
  return (
    <nav aria-label="Fil d’Ariane">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className={`size-4 ${inverted ? "text-slate-400" : "text-slate-500"}`} aria-hidden="true" />}
              {isCurrent || !item.href ? (
                <span aria-current={isCurrent ? "page" : undefined} className={currentClass}>{item.label}</span>
              ) : (
                <Link href={item.href} className={linkClass}>{item.label}</Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
