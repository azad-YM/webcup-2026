import { Outlet } from "react-router"
import { CalendarClock, Inbox, MessageCircleWarning } from "@boilerplate/shared-ui/components/icon"
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider, SidebarRail, SidebarTrigger } from "@boilerplate/shared-ui/components"
import { ModuleSwitcher } from "@/modules/shared/ui/components/sidebar/module-switcher"
import { NavMain } from "@/modules/shared/ui/components/sidebar/nav-main"
import { NavUser } from "@/modules/shared/ui/components/sidebar/nav-user"

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
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 text-white shadow-sm">
          <SidebarTrigger className="-ml-1 text-black" />
          <NavUser />
        </header>
        <main className="min-w-0 flex-1 bg-slate-50 p-4 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
