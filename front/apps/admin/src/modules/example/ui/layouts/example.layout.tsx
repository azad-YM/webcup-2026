import { Outlet } from "react-router"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@boilerplate/shared-ui/components"
import { NavUser } from "@/modules/shared/ui/components/sidebar/nav-user"
import { ExampleSidebar } from "./example.sidebar"

export function ExampleLayout() {
  return (
    <SidebarProvider>
      <ExampleSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 shadow-sm">
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
