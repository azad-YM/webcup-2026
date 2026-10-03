import { Activity } from "@boilerplate/shared-ui/components/icon"
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarRail } from "@boilerplate/shared-ui/components"
import { ModuleSwitcher } from "@/modules/shared/ui/components/sidebar/module-switcher"
import { NavMain } from "@/modules/shared/ui/components/sidebar/nav-main"
import { AdminContent } from "@/modules/shared/ui/layout/admin-content"

const navigation = [
  { title: "Flux Nova Terra", icon: Activity, url: "/pilotage" },
]

export function PilotageLayout() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <ModuleSwitcher currentSpaceCode="pilotage" subtitle="Flux de l’API du concours" />
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
