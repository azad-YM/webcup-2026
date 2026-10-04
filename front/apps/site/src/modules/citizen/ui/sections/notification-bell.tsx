"use client"
import { useEffect, useState } from "react"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import { usePathname } from "next/navigation"
import { Bell } from "@boilerplate/shared-ui/components/icon"
import { Popover, PopoverContent, PopoverTrigger } from "@boilerplate/shared-ui/components/shadcn/popover"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { useCitizenAccess } from "../components/citizen-access"
import { NOTIFICATIONS_POLLING_MS, useListMyNotificationsQuery } from "../../core/application/rtk-api/notifications"
import { NotificationCenter } from "./notification-center"

export function NotificationBell() {
  const { profile } = useCitizenAccess()
  const { logout } = useSession()
  const pathname = usePathname()
  const [openOn, setOpenOn] = useState<string | null>(null)
  const query = useListMyNotificationsQuery(undefined, { skip: !profile, ...polling(NOTIFICATIONS_POLLING_MS) })
  const unauthorized = toQueryError(query.error)?.status === 401
  useEffect(() => { if (unauthorized) logout() }, [unauthorized, logout])
  if (!profile || unauthorized) return null
  const count = query.data?.unreadCount ?? 0
  return (
    <Popover open={openOn === pathname} onOpenChange={(open) => setOpenOn(open ? pathname : null)}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`Mes notifications${count ? `, ${count} non lues` : ""}`} className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-800 hover:bg-slate-100">
          <Bell className="size-5" aria-hidden="true" />
          {count > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-slate-950">{count > 99 ? "99+" : count}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label="Mes notifications" className="max-h-[min(75dvh,var(--radix-popover-content-available-height))] w-[30rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-950">
        <NotificationCenter onNavigate={() => setOpenOn(null)} />
      </PopoverContent>
    </Popover>
  )
}
