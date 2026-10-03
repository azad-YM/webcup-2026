import { useEffect, useRef, type ReactNode } from "react"
import { Link, Outlet, useLocation } from "react-router"
import { SidebarInset, SidebarTrigger } from "@boilerplate/shared-ui/components"
import { BreadcrumbTrail, DisplayPreferencesButton } from "@boilerplate/shared-ui/components/a11y"
import { NavUser } from "@/modules/shared/ui/components/sidebar/nav-user"
import { breadcrumbFor } from "./breadcrumbs"

export const MAIN_CONTENT_ID = "contenu"

/**
 * Zone principale commune aux espaces de l’admin (L4) : barre d’en-tête
 * (menu, fil d’Ariane D15, bouton « Affichage », compte), `main#contenu`
 * cible du lien d’évitement, titre du document et focus déplacé sur le
 * titre de la page après chaque navigation (annoncé par les lecteurs d’écran).
 */
export function AdminContent({ headerExtra }: { headerExtra?: ReactNode }) {
  const { pathname } = useLocation()
  const trail = breadcrumbFor(pathname)
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  const current = trail[trail.length - 1]?.label

  useEffect(() => {
    document.title = current ? `${current} — Administration Nova Terra` : "Administration Nova Terra"
  }, [current])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const main = mainRef.current
    if (!main) return
    const heading = main.querySelector<HTMLElement>("h1")
    const target = heading ?? main
    if (heading && !heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1")
    target.focus({ preventScroll: false })
  }, [pathname])

  return (
    <SidebarInset>
      <header className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <SidebarTrigger className="-ml-1 text-foreground" />
          {headerExtra}
          <BreadcrumbTrail
            items={trail}
            className="min-w-0"
            renderLink={(item, className) => <Link to={item.href} className={className}>{item.label}</Link>}
          />
        </div>
        <div className="flex items-center gap-2">
          <DisplayPreferencesButton className="text-foreground" />
          <NavUser />
        </div>
      </header>
      <main id={MAIN_CONTENT_ID} ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 bg-slate-50 p-4 outline-none sm:p-6">
        <Outlet />
      </main>
    </SidebarInset>
  )
}
