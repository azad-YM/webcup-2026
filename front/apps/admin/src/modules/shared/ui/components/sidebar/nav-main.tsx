import type { LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@boilerplate/shared-ui/components"

type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  items?: { title: string; url: string }[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()

  return (
    <SidebarGroup>
      <SidebarGroupLabel id="titre-navigation-espace">Navigation</SidebarGroupLabel>
      <nav aria-labelledby="titre-navigation-espace">
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url ||
            item.items?.some((child) => pathname === child.url) === true
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                <Link to={item.url} aria-current={pathname === item.url ? "page" : undefined}>
                  {item.icon && <item.icon aria-hidden="true" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {!!item.items?.length && (
                <SidebarMenuSub>
                  {item.items.map((child) => (
                    <SidebarMenuSubItem key={child.url}>
                      <SidebarMenuSubButton asChild isActive={pathname === child.url}>
                        <Link to={child.url} aria-current={pathname === child.url ? "page" : undefined}>{child.title}</Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
      </nav>
    </SidebarGroup>
  )
}
