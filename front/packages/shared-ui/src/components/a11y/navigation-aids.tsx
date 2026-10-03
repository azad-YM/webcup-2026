import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@boilerplate/shared-ui/lib"

/** Lien d’évitement (F41) : premier élément focalisable, mène au contenu principal. */
export function SkipLink({ targetId = "contenu", children = "Aller au contenu" }: { targetId?: string; children?: ReactNode }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-lg bg-white px-4 py-3 font-medium text-slate-950 shadow-lg focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]"
    >
      {children}
    </a>
  )
}

export type BreadcrumbTrailItem = { label: string; href?: string }

/**
 * Fil d’Ariane (D15). Le dernier élément est la page courante
 * (`aria-current="page"`, sans lien). `renderLink` permet d’utiliser le
 * composant de lien du routeur de l’application.
 */
export function BreadcrumbTrail({ items, renderLink, inverted = false, className }: {
  items: BreadcrumbTrailItem[]
  renderLink?: (item: { label: string; href: string }, className: string) => ReactNode
  inverted?: boolean
  className?: string
}) {
  const linkClass = inverted
    ? "text-slate-200 underline-offset-4 hover:text-white hover:underline"
    : "text-teal-800 underline underline-offset-4 decoration-1 hover:decoration-2"
  const currentClass = inverted ? "font-medium text-white" : "font-medium text-foreground"
  return (
    <nav aria-label="Fil d’Ariane" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className={cn("size-4", inverted ? "text-slate-300" : "text-slate-600")} aria-hidden="true" />}
              {isCurrent || !item.href ? (
                <span aria-current={isCurrent ? "page" : undefined} className={currentClass}>{item.label}</span>
              ) : renderLink ? (
                renderLink({ label: item.label, href: item.href }, linkClass)
              ) : (
                <a href={item.href} className={linkClass}>{item.label}</a>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
