import { Outlet } from "react-router"
import { BookKey, Building2, Megaphone, Newspaper, Siren } from "@boilerplate/shared-ui/components/icon"
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider, SidebarRail, SidebarTrigger } from "@boilerplate/shared-ui/components"
import { ModuleSwitcher } from "@/modules/shared/ui/components/sidebar/module-switcher"
import { NavMain } from "@/modules/shared/ui/components/sidebar/nav-main"
import { NavUser } from "@/modules/shared/ui/components/sidebar/nav-user"

const navigation = [
  { title: "Publications", icon: Newspaper, url: "/contenus" },
  { title: "Alertes", icon: Siren, url: "/contenus/alertes" },
  { title: "Services et transports", icon: Building2, url: "/contenus/services" },
  { title: "Administration", icon: BookKey, url: "/admin" },
]

/** Espace des agents pour les contenus de la ville (services, publications, alertes). */
export function ContentLayout() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <ModuleSwitcher currentSpaceCode="admin" subtitle="Contenus de la ville" />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navigation} />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 shadow-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-black" />
            <Megaphone className="size-5 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">Contenus de la ville</span>
          </div>
          <NavUser />
        </header>
        <main className="min-w-0 flex-1 bg-slate-50 p-4 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
