import { useState } from "react"
import { Activity, BookKey, Check, ChevronsUpDown, Inbox } from "@boilerplate/shared-ui/components/icon"
import { useNavigate } from "react-router"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@boilerplate/shared-ui/components"
import { useListSpacesQuery } from "@/modules/auth/core/application/rtk-api/auth"
import type { AuthSpace } from "@/modules/auth/core/application/dto/auth.dto"

type SpaceCode = AuthSpace["code"]

const SPACE_META: Record<SpaceCode, {
  label: string
  route: string
  icon: typeof BookKey
}> = {
  admin: { label: "Administration", route: "/admin", icon: BookKey },
  pilotage: { label: "Pilotage", route: "/pilotage", icon: Activity },
  requests: { label: "Demandes citoyennes", route: "/demandes", icon: Inbox },
}

export function ModuleSwitcher({
  currentSpaceCode,
  subtitle,
}: {
  currentSpaceCode: SpaceCode
  subtitle: string
}) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: spaces = [] } = useListSpacesQuery()
  const currentSpace = SPACE_META[currentSpaceCode]
  const CurrentIcon = currentSpace.icon

  const openSpace = (code: SpaceCode) => {
    setOpen(false)
    navigate(SPACE_META[code].route)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip="Changer d’espace"
              className="data-[state=open]:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <CurrentIcon className="size-4" aria-hidden="true" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{currentSpace.label}</span>
                <span className="truncate text-xs">{subtitle}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" aria-hidden="true" />
              <span className="sr-only">, changer d’espace</span>
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent align="start" side="right" className="w-72 p-2">
            <PopoverHeader className="px-2 py-1.5">
              <PopoverTitle>Espaces disponibles</PopoverTitle>
            </PopoverHeader>
            <div className="mt-1 space-y-1">
              {spaces.map((space) => {
                const meta = SPACE_META[space.code]
                const SpaceIcon = meta.icon
                const isCurrent = space.code === currentSpaceCode

                return (
                  <button
                    key={space.code}
                    type="button"
                    onClick={() => openSpace(space.code)}
                    aria-current={isCurrent ? "page" : undefined}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                      <SpaceIcon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{space.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{space.description}</span>
                    </span>
                    {isCurrent && <><Check className="size-4 text-primary" aria-hidden="true" /><span className="sr-only">(espace actuel)</span></>}
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
