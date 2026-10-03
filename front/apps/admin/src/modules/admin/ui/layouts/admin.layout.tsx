import { SidebarProvider } from "@boilerplate/shared-ui/components"
import { AdminContent } from "@/modules/shared/ui/layout/admin-content"
import { AdminSidebar } from "./admin.sidebar"

export function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <AdminContent />
    </SidebarProvider>
  )
}
