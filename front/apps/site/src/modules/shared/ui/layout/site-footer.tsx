"use client"
import Link from "next/link"
import { MAIN_NAVIGATION } from "../navigation"
import { NovaTerraWordmark } from "./nova-terra-logo"
import { useMessages } from "../i18n/i18n-provider"
import { COMMON_MESSAGES, navigationLabel } from "../i18n/common-messages"

export function SiteFooter() {
  const t = useMessages(COMMON_MESSAGES)
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <NovaTerraWordmark inverted />
          <p className="mt-4 max-w-xs text-sm leading-6">
            {t.footerAbout}
          </p>
        </div>
        <nav aria-label={t.footerLinks}>
          <h2 className="text-sm font-semibold text-white">{t.footerSite}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {MAIN_NAVIGATION.map((item) => (
              <li key={item.href}><Link href={item.href} className="hover:text-white hover:underline">{navigationLabel(t, item.href, item.label)}</Link></li>
            ))}
            <li><Link href="/espace" className="hover:text-white hover:underline">{t.footerSpace}</Link></li>
            <li><Link href="/urgences" className="hover:text-white hover:underline">{t.emergencyLabel}</Link></li>
            <li><Link href="/bienvenue" className="hover:text-white hover:underline">{t.footerNewcomer}</Link></li>
            <li><Link href="/aide/glossaire" className="hover:text-white hover:underline">{t.footerGlossary}</Link></li>
            <li><Link href="/vos-donnees" className="hover:text-white hover:underline">{t.footerData}</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-semibold text-white">{t.townHall}</h2>
          <address className="mt-4 text-sm not-italic leading-6">
            {t.townHallAddress}<br />
            {t.townHallHours}
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm sm:px-6 lg:px-8">© {new Date().getFullYear()} {t.city}</p>
      </div>
    </footer>
  )
}
