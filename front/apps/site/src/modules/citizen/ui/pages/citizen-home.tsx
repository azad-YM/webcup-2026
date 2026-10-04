"use client"
import Link from "next/link"
import type { Route } from "next"
import type { ReactNode } from "react"
import { ArrowRight, CalendarClock, ClipboardList, Compass, HandHeart, ListChecks, Megaphone, MessageSquare, Newspaper, Search } from "@boilerplate/shared-ui/components/icon"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { format } from "@/modules/shared/core/i18n/locales"
import { CITIZEN_HOME_MESSAGES } from "../i18n/citizen-home-messages"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import { CitizenFirstVisitGuide } from "../sections/first-visit-guide"
import { NOTIFICATIONS_POLLING_MS, useListMyNotificationsQuery } from "../../core/application/rtk-api/notifications"
import { unreadOfKind, type NotificationKind } from "../../core/domain/notification"

type Messages = typeof CITIZEN_HOME_MESSAGES.fr
type ShortcutKey = "contact" | "report" | "requests" | "appointments" | "participate" | "contributions" | "newcomer" | "services" | "news"
type Shortcut = { key: ShortcutKey; href?: Route; icon: typeof Search; soon?: boolean; notifications?: NotificationKind }

const SHORTCUTS: Shortcut[] = [
  { key: "contact", href: "/espace/demandes/nouvelle?type=contact" as Route, icon: MessageSquare },
  { key: "report", href: "/espace/demandes/nouvelle?type=report" as Route, icon: Megaphone },
  { key: "requests", href: "/espace/demandes", icon: ClipboardList, notifications: "request.status_changed" },
  { key: "appointments", href: "/espace/rendez-vous" as Route, icon: CalendarClock, notifications: "appointment.reminder" },
  { key: "participate", href: "/espace/participation" as Route, icon: HandHeart, notifications: "concern.updated" },
  { key: "contributions", href: "/espace/contributions" as Route, icon: ListChecks, notifications: "idea.updated" },
  { key: "newcomer", href: "/bienvenue" as Route, icon: Compass },
  { key: "services", href: "/services", icon: Search },
  { key: "news", href: "/actualites", icon: Newspaper },
]

const shortcutText = (t: Messages, key: ShortcutKey) => ({ title: t[key], text: t[`${key}Text`] })

function ShortcutCard({ shortcut, unread = 0 }: { shortcut: Shortcut; unread?: number }) {
  const t = useMessages(CITIZEN_HOME_MESSAGES)
  const { title, text } = shortcutText(t, shortcut.key)
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <shortcut.icon className="size-7 text-teal-700" aria-hidden="true" />
        {unread > 0 && (
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-sm font-semibold text-slate-950">
            {unread}<span className="sr-only"> {t.newItems}</span>
          </span>
        )}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 flex-1 text-slate-700">{text}</p>
      {shortcut.soon ? (
        <p className="mt-4 inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{t.soon}</p>
      ) : (
        <span className="mt-4 inline-flex items-center gap-2 font-medium text-teal-800">{t.open} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></span>
      )}
    </>
  )
  const frame = "flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6"
  return shortcut.href
    ? <Link href={shortcut.href} className={`${frame} transition hover:border-teal-600 hover:shadow-md`}>{body}</Link>
    : <div className={`${frame} bg-slate-50`}>{body}</div>
}

/** Accueil citoyen ; les espaces IAM des comptes non citoyens sont fournis par composition. */
export function CitizenHomePage({ spacesForNonCitizen }: { spacesForNonCitizen: ReactNode }) {
  const access = useCitizenAccess()
  const profile = access.profile
  const t = useMessages(CITIZEN_HOME_MESSAGES)
  // Pastilles des raccourcis : même cache que le centre de notifications (une seule requête).
  const inbox = useListMyNotificationsQuery(undefined, { skip: !profile, pollingInterval: NOTIFICATIONS_POLLING_MS })
  return (
    <>
      <PageHeader
        trail={[{ label: t.trail }]}
        title={profile ? format(t.hello, { name: profile.firstName ?? "" }).trim() : t.title}
        lead={profile ? t.lead : undefined}
      />
      <PageBody>
        {!profile ? (
          <CitizenAccessState access={access} returnTo="/espace" nonCitizenFallback={spacesForNonCitizen} />
        ) : (
          <div className="space-y-10">
            <CitizenFirstVisitGuide profile={profile} />
            <section aria-labelledby="titre-raccourcis">
              <h2 id="titre-raccourcis" className="text-2xl font-semibold tracking-tight">{t.whatToDo}</h2>
              <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {SHORTCUTS.map((shortcut) => (
                  <li key={shortcut.key}>
                    <ShortcutCard shortcut={shortcut} unread={shortcut.notifications ? unreadOfKind(inbox.data, shortcut.notifications) : 0} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </PageBody>
    </>
  )
}
