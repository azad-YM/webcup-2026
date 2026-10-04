"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import { LogOut, Menu, Siren, UserRound, X } from "@boilerplate/shared-ui/components/icon"
import { Popover, PopoverTrigger, PopoverContent } from "@boilerplate/shared-ui/components"
import { useSession } from "../store-provider"
import { isCurrentSection, MAIN_NAVIGATION } from "../navigation"
import { NovaTerraWordmark } from "./nova-terra-logo"
import { DisplayPreferencesButton } from "@boilerplate/shared-ui/components/a11y"
import { useMessages } from "../i18n/i18n-provider"
import { COMMON_MESSAGES, navigationLabel } from "../i18n/common-messages"
import { LanguageSwitcher } from "../i18n/language-switcher"

const navLink = (active: boolean) =>
  `rounded-lg px-3 py-2 text-base font-medium transition ${active ? "bg-teal-50 text-teal-900" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`

function SessionActions({ notifications, spaces }: { notifications: ReactNode; spaces: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { ready, hasToken, logout } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const t = useMessages(COMMON_MESSAGES)
  if (!ready) return <span className="inline-block h-10 w-48" aria-hidden="true" />
  if (!hasToken)
    return (
      <>
        <Link href="/connexion" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100">{t.login}</Link>
        <Link href="/inscription" onClick={() => setOpen(false)} className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">{t.register}</Link>
      </>
    )
  return (
    <>
      <Link
        href="/espace"
        onClick={() => setOpen(false)}
        aria-current={isCurrentSection(pathname, "/espace") ? "page" : undefined}
        className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
      >
        <UserRound className="size-4" aria-hidden="true" /> {t.mySpace}
      </Link>
      {notifications}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={t.accountMenu} className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100">
            <UserRound className="size-5" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" aria-label={t.account} className="max-h-[70dvh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-slate-950" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setOpen(false) }}>
          <Link href="/espace/profil" className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100"><UserRound className="size-4" aria-hidden="true" /> {t.myProfile}</Link>
          {spaces}
          <button type="button" onClick={() => { setOpen(false); logout(); router.push("/") }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100">
            <LogOut className="size-4" aria-hidden="true" /> {t.logout}
          </button>
        </PopoverContent>
      </Popover>
    </>
  )
}

export function SiteHeader({ notifications, spaces }: { notifications: ReactNode; spaces: ReactNode }) {
  const pathname = usePathname()
  // Le menu mobile se referme de lui-même quand la page change.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const close = () => setOpenOn(null)
  const t = useMessages(COMMON_MESSAGES)
  const label = (href: string, fallback: string) => navigationLabel(t, href, fallback)
  return (
    <header className="sticky top-0 z-40 site-header border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="rounded-lg" aria-label={t.homeLink}>
          <NovaTerraWordmark />
        </Link>
        <nav aria-label={t.mainNavigation} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAVIGATION.map((item) => {
              const active = isCurrentSection(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link href={item.href} aria-current={active ? "page" : undefined} className={navLink(active)}>{label(item.href, item.label)}</Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="order-3 flex w-full flex-wrap items-center justify-end gap-2 md:order-none md:ms-auto md:w-auto">
          {/* F46 : les urgences en un clic depuis toutes les pages. */}
          <Link href="/urgences" aria-label={t.emergencyLabel} aria-current={isCurrentSection(pathname, "/urgences") ? "page" : undefined} className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-3 py-2 font-semibold text-white hover:bg-red-800">
            <Siren className="size-4" aria-hidden="true" /> {t.emergency}
          </Link>
          <LanguageSwitcher />
          <DisplayPreferencesButton showHintsReset className="text-slate-800 hover:bg-slate-100" />
          <SessionActions key={pathname} notifications={notifications} spaces={spaces} />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-medium md:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          {t.menu}
        </button>
      </div>
      <div id="menu-mobile" hidden={!open} className="border-t border-slate-200 px-4 pb-4 md:hidden">
        <nav aria-label={t.mobileNavigation}>
          <ul className="flex flex-col gap-1 pt-3">
            {MAIN_NAVIGATION.map((item) => {
              const active = isCurrentSection(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={close} aria-current={active ? "page" : undefined} className={`block ${navLink(active)}`}>{label(item.href, item.label)}</Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}
