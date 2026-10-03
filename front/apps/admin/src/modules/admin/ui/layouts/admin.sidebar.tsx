import { LayoutDashboard, Megaphone, Settings } from "@boilerplate/shared-ui/components/icon"
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@boilerplate/shared-ui/components"
import { ModuleSwitcher } from "@/modules/shared/ui/components/sidebar/module-switcher"
import { NavMain } from "@/modules/shared/ui/components/sidebar/nav-main"
import { adminEntities } from "@/modules/admin/ui/data/entities"

const navigation = [
  {
    title: "Tableau de bord",
    icon: LayoutDashboard,
    url: "/admin",
  },
  {
    title: "Configuration",
    icon: Settings,
    url: "/admin/role",
    items: adminEntities.map((entity) => ({
      title: entity.title,
      url: `/admin/${entity.code}`,
    })),
  },
  {
    title: "Contenus de la ville",
    icon: Megaphone,
    url: "/contenus",
  },
]

export function AdminSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ModuleSwitcher currentSpaceCode="admin" subtitle="Rôles et membres" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigation} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
