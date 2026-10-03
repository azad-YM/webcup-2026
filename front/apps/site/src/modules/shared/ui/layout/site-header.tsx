"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { LogOut, Menu, UserRound, X } from "@boilerplate/shared-ui/components/icon"
import { useSession } from "../store-provider"
import { isCurrentSection, MAIN_NAVIGATION } from "../navigation"
import { NovaTerraWordmark } from "./nova-terra-logo"
import { DisplayPreferencesButton } from "@boilerplate/shared-ui/components/a11y"

const navLink = (active: boolean) =>
  `rounded-lg px-3 py-2 text-base font-medium transition ${active ? "bg-teal-50 text-teal-900" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`

function SessionActions({ onNavigate }: { onNavigate?: () => void }) {
  const { ready, hasToken, logout } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  if (!ready) return <span className="inline-block h-10 w-48" aria-hidden="true" />
  if (!hasToken)
    return (
      <>
        <Link href="/connexion" onClick={onNavigate} className="rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100">Connexion</Link>
        <Link href="/inscription" onClick={onNavigate} className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">Créer un compte</Link>
      </>
    )
  return (
    <>
      <Link
        href="/espace"
        onClick={onNavigate}
        aria-current={isCurrentSection(pathname, "/espace") ? "page" : undefined}
        className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
      >
        <UserRound className="size-4" aria-hidden="true" /> Mon espace
      </Link>
      <button
        type="button"
        onClick={() => { onNavigate?.(); logout(); router.push("/") }}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100"
      >
        <LogOut className="size-4" aria-hidden="true" /> Déconnexion
      </button>
    </>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  // Le menu mobile se referme de lui-même quand la page change.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const close = () => setOpenOn(null)
  return (
    <header className="sticky top-0 z-40 site-header border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="rounded-lg" aria-label="Nova Terra, retour à l’accueil">
          <NovaTerraWordmark />
        </Link>
        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAVIGATION.map((item) => {
              const active = isCurrentSection(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link href={item.href} aria-current={active ? "page" : undefined} className={navLink(active)}>{item.label}</Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <DisplayPreferencesButton showHintsReset className="text-slate-800 hover:bg-slate-100" />
          <SessionActions />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-medium md:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          Menu
        </button>
      </div>
      <div id="menu-mobile" hidden={!open} className="border-t border-slate-200 px-4 pb-4 md:hidden">
        <nav aria-label="Navigation principale (mobile)">
          <ul className="flex flex-col gap-1 pt-3">
            {MAIN_NAVIGATION.map((item) => {
              const active = isCurrentSection(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={close} aria-current={active ? "page" : undefined} className={`block ${navLink(active)}`}>{item.label}</Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
          <DisplayPreferencesButton showHintsReset className="text-slate-800 hover:bg-slate-100" />
          <SessionActions onNavigate={close} />
        </div>
      </div>
    </header>
  )
}
