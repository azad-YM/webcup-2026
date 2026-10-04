"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import { FileDown, LogOut, ShieldCheck, UserRound } from "@boilerplate/shared-ui/components/icon"
import { Popover, PopoverContent, PopoverTrigger } from "@boilerplate/shared-ui/components/shadcn/popover"
import { useSession } from "../store-provider"
import { useMessages } from "../i18n/i18n-provider"
import { COMMON_MESSAGES } from "../i18n/common-messages"

/**
 * Menu du compte (avatar) : profil, sécurité, données, espaces autorisés, déconnexion.
 * Chargé seulement pour une personne connectée (L17) : les visiteurs ne téléchargent pas la fenêtre surgissante.
 */
export default function AccountMenu({ spaces }: { spaces: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { logout } = useSession()
  const router = useRouter()
  const t = useMessages(COMMON_MESSAGES)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={t.accountMenu} className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100">
          <UserRound className="size-5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={t.account} className="max-h-[70dvh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-slate-950" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setOpen(false) }}>
        <Link href="/espace/profil" className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100"><UserRound className="size-4" aria-hidden="true" /> {t.myProfile}</Link>
        <Link href="/espace/securite" className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100"><ShieldCheck className="size-4" aria-hidden="true" /> Sécurité du compte</Link>
        <Link href="/espace/mes-donnees" className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100"><FileDown className="size-4" aria-hidden="true" /> Mes données</Link>
        {spaces}
        <button type="button" onClick={() => { setOpen(false); logout(); router.push("/") }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100">
          <LogOut className="size-4" aria-hidden="true" /> {t.logout}
        </button>
      </PopoverContent>
    </Popover>
  )
}
