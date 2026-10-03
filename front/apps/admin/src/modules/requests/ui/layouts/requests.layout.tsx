import { CalendarClock, Inbox, MessageCircleWarning } from "@boilerplate/shared-ui/components/icon"
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarRail } from "@boilerplate/shared-ui/components"
import { ModuleSwitcher } from "@/modules/shared/ui/components/sidebar/module-switcher"
import { NavMain } from "@/modules/shared/ui/components/sidebar/nav-main"
import { AdminContent } from "@/modules/shared/ui/layout/admin-content"

const navigation = [
  { title: "File des demandes", icon: Inbox, url: "/demandes" },
  { title: "Rendez-vous", icon: CalendarClock, url: "/demandes/rendez-vous" },
  { title: "Inquiétudes", icon: MessageCircleWarning, url: "/demandes/inquietudes" },
]

export function RequestsLayout() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <ModuleSwitcher currentSpaceCode="requests" subtitle="Messages et signalements des habitants" />
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
