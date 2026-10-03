import { BookKey, Building2, Newspaper, Siren } from "@boilerplate/shared-ui/components/icon"
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarRail } from "@boilerplate/shared-ui/components"
import { ModuleSwitcher } from "@/modules/shared/ui/components/sidebar/module-switcher"
import { NavMain } from "@/modules/shared/ui/components/sidebar/nav-main"
import { AdminContent } from "@/modules/shared/ui/layout/admin-content"

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
      <AdminContent />
    </SidebarProvider>
  )
}
