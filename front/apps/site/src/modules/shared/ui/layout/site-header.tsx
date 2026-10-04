"use client"
import Link from "@/modules/shared/ui/link"
import { usePathname } from "next/navigation"
import { lazy, Suspense, useState, type ReactNode } from "react"
import { Menu, Siren, UserRound, X } from "@boilerplate/shared-ui/components/icon"
import { useSession } from "../store-provider"
import { isCurrentSection, MAIN_NAVIGATION } from "../navigation"
import { NovaTerraWordmark } from "./nova-terra-logo"
import { DisplayPreferencesButton } from "@boilerplate/shared-ui/components/a11y"
import { useMessages } from "../i18n/i18n-provider"
import { COMMON_MESSAGES, navigationLabel } from "../i18n/common-messages"
import { LanguageSwitcher } from "../i18n/language-switcher"

// L17 : le menu du compte (fenêtre surgissante) n’est téléchargé que pour une personne connectée.
const AccountMenu = lazy(() => import("./account-menu"))

// Le logo mène déjà à l’accueil : la barre principale ne répète pas « Accueil » (le menu mobile le garde).
const DESKTOP_NAVIGATION = MAIN_NAVIGATION.filter((item) => item.href !== "/")

const desktopLink = (active: boolean) =>
  `inline-flex min-h-16 items-center whitespace-nowrap border-b-2 px-3 font-medium transition ${active ? "border-teal-700 text-teal-900" : "border-transparent text-slate-700 hover:border-slate-300 hover:text-slate-950"}`

const mobileLink = (active: boolean) =>
  `block rounded-lg px-3 py-2.5 font-medium ${active ? "bg-teal-50 text-teal-900" : "text-slate-800 hover:bg-slate-100"}`

const primaryButton = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
const secondaryButton = "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 font-medium text-slate-800 hover:bg-slate-100"

/** Actions du compte dans la barre principale : liens d’accès (dès `sm`) ou Mon espace, cloche et avatar. */
function SessionActions({ notifications, spaces }: { notifications: ReactNode; spaces: ReactNode }) {
  const { ready, hasToken } = useSession()
  const pathname = usePathname()
  const t = useMessages(COMMON_MESSAGES)
  if (!ready) return <span className="inline-block h-10 w-24 sm:w-48" aria-hidden="true" />
  if (!hasToken)
    return (
      <div className="hidden items-center gap-1 sm:flex">
        <Link href="/connexion" className={secondaryButton}>{t.login}</Link>
        <Link href="/inscription" className={primaryButton}>{t.register}</Link>
      </div>
    )
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/espace"
        aria-current={isCurrentSection(pathname, "/espace") ? "page" : undefined}
        className={`${primaryButton} hidden sm:inline-flex`}
      >
        <UserRound className="size-4" aria-hidden="true" /> {t.mySpace}
      </Link>
      {notifications}
      <Suspense fallback={<span className="inline-block size-10 shrink-0 rounded-full border border-teal-200 bg-teal-50" aria-hidden="true" />}>
        <AccountMenu spaces={spaces} />
      </Suspense>
    </div>
  )
}

/** Accès au compte repris dans le menu mobile, quand la barre principale n’a plus la place (sous `sm`). */
function MobileSessionLinks({ onNavigate }: { onNavigate: () => void }) {
  const { ready, hasToken } = useSession()
  const t = useMessages(COMMON_MESSAGES)
  if (!ready) return null
  return (
    <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 sm:hidden">
      {hasToken ? (
        <Link href="/espace" onClick={onNavigate} className={primaryButton}>
          <UserRound className="size-4" aria-hidden="true" /> {t.mySpace}
        </Link>
      ) : (
        <>
          <Link href="/inscription" onClick={onNavigate} className={primaryButton}>{t.register}</Link>
          <Link href="/connexion" onClick={onNavigate} className={`${secondaryButton} border border-slate-300`}>{t.login}</Link>
        </>
      )}
    </div>
  )
}

/**
 * En-tête du site sur deux niveaux :
 * - barre utilitaire : urgences (F46, toujours visibles), langue (D14) et affichage (L4) ;
 * - barre principale : logo, rubriques (dès `lg`) et compte ; en dessous, un menu repliable.
 */
export function SiteHeader({ notifications, spaces }: { notifications: ReactNode; spaces: ReactNode }) {
  const pathname = usePathname()
  // Le menu mobile se referme de lui-même quand la page change.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const close = () => setOpenOn(null)
  const t = useMessages(COMMON_MESSAGES)
  const label = (href: string, fallback: string) => navigationLabel(t, href, fallback)
  return (
    <header className="site-header sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1 sm:px-6 lg:px-8">
          <Link
            href="/urgences"
            aria-label={t.emergencyLabel}
            aria-current={isCurrentSection(pathname, "/urgences") ? "page" : undefined}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-700 px-2.5 py-1 text-sm font-semibold text-white hover:bg-red-800"
          >
            <Siren className="size-4" aria-hidden="true" /> {t.emergency}
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher compact />
            <DisplayPreferencesButton showHintsReset showLightMode className="px-2.5 py-1 text-sm text-slate-800 hover:bg-slate-200/70" />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        <Link href="/" className="shrink-0 rounded-lg py-3" aria-label={t.homeLink}>
          <NovaTerraWordmark />
        </Link>
        <nav aria-label={t.mainNavigation} className="hidden lg:block">
          <ul className="flex flex-wrap items-center">
            {DESKTOP_NAVIGATION.map((item) => {
              const active = isCurrentSection(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link href={item.href} aria-current={active ? "page" : undefined} className={desktopLink(active)}>{label(item.href, item.label)}</Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="ms-auto flex items-center gap-2 py-3">
          <SessionActions key={pathname} notifications={notifications} spaces={spaces} />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center gap-2 rounded-lg border border-slate-300 font-medium text-slate-800 hover:bg-slate-100 sm:size-auto sm:px-3 sm:py-2 lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            <span className="sr-only sm:not-sr-only">{t.menu}</span>
          </button>
        </div>
      </div>

      <div id="menu-mobile" hidden={!open} className="border-t border-slate-200 px-4 pb-4 sm:px-6 lg:hidden">
        <nav aria-label={t.mobileNavigation}>
          <ul className="flex flex-col gap-1 pt-3">
            {MAIN_NAVIGATION.map((item) => {
              const active = isCurrentSection(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={close} aria-current={active ? "page" : undefined} className={mobileLink(active)}>{label(item.href, item.label)}</Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <MobileSessionLinks onNavigate={close} />
      </div>
    </header>
  )
}
