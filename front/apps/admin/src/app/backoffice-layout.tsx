import { useState } from "react"
import { Link, useLocation } from "react-router"
import { Menu, PanelLeftClose, PanelLeftOpen } from "@boilerplate/shared-ui/components/icon"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@boilerplate/shared-ui/components"
import { AccountMenu } from "@/modules/auth/ui/components/account-menu"
import { SessionExpiryNotice } from "@/modules/auth/ui/components/session-expiry-notice"
import { SecurityAlertNotice } from "@/modules/security/ui/components/security-alert-notice"
import { useListSpacesQuery } from "@/modules/auth/core/application/rtk-api/auth"
import { ModuleSwitcher } from "@/modules/shared/ui/components/sidebar/module-switcher"
import { NavMain } from "@/modules/shared/ui/components/sidebar/nav-main"
import { AdminContent } from "@/modules/shared/ui/layout/admin-content"
import { MODULES, MODULE_NAVIGATION, moduleForPath } from "@/modules/shared/ui/layout/workspace-navigation"

/** Composition : Auth fournit modules et compte ; le socle ne connaît que les slots et les routes. */
export function BackofficeLayout() {
  const { pathname } = useLocation()
  const [openOn, setOpenOn] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const modules = useListSpacesQuery()
  const current = moduleForPath(pathname)
  const close = () => setOpenOn(null)
  const rail = <ModuleSwitcher current={current} modules={(modules.data ?? []).map(item => item.code)} account={<AccountMenu />} onNavigate={close} />
  const secondary = <div className="flex min-w-0 flex-1 flex-col bg-white">
    <div className="border-b border-slate-200 px-6 py-6"><Link to="/espaces" onClick={close} className="text-lg font-semibold tracking-tight text-slate-950">Nova Terra</Link><p className="mt-1 text-xs text-slate-500">Espace administration</p></div>
    <div className="flex-1 overflow-y-auto">
      <div className="px-7 pb-2 pt-6"><p className="font-semibold text-slate-950">{current ? MODULES[current].title : "Bienvenue"}</p><p className="mt-1 text-xs leading-5 text-slate-600">{current ? MODULES[current].description : "Choisissez votre module de travail."}</p></div>
      {modules.isLoading && <p role="status" className="p-6 text-sm">Chargement des modules…</p>}
      {modules.isError && <div className="p-6 text-sm"><p role="alert">Impossible de charger les modules.</p><button onClick={() => void modules.refetch()} className="mt-2 text-teal-800 underline">Réessayer</button></div>}
      {current && <NavMain groups={MODULE_NAVIGATION[current]} onNavigate={close} />}
      {!current && <p className="px-7 py-4 text-sm leading-6 text-slate-600">Retrouvez ici les rubriques du module sélectionné.</p>}
    </div>
    <div className="border-t border-slate-200 p-5"><Link to="/espaces" onClick={close} className="text-sm font-medium text-teal-800 hover:underline">Tous les modules</Link></div>
  </div>
  return <div className="flex min-h-svh bg-slate-50 text-slate-950">
    <div className="sticky top-0 hidden h-svh shrink-0 lg:flex">{rail}<div id="navigation-desktop" hidden={!expanded} className="w-64 border-r border-slate-200 [&>div]:h-full">{secondary}</div></div>
    <AdminContent headerExtra={<>
      <SessionExpiryNotice />
      <SecurityAlertNotice />
      <button type="button" aria-label={expanded ? "Replier les rubriques" : "Afficher les rubriques"} aria-expanded={expanded} aria-controls="navigation-desktop" onClick={() => setExpanded(!expanded)} className="hidden rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:inline-flex">{expanded ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}</button>
      <Sheet open={openOn === pathname} onOpenChange={(open) => setOpenOn(open ? pathname : null)}>
        <SheetTrigger asChild><button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm lg:hidden"><Menu className="size-4" aria-hidden="true" /> Menu</button></SheetTrigger>
        <SheetContent side="left" className="w-[25rem] max-w-full gap-0 p-0 sm:max-w-[25rem]">
          <SheetHeader className="sr-only"><SheetTitle>Navigation de l’administration</SheetTitle><SheetDescription>Modules, rubriques et espaces disponibles.</SheetDescription></SheetHeader>
          <div className="flex h-full min-h-0">{rail}{secondary}</div>
        </SheetContent>
      </Sheet>
    </>} />
  </div>
}
