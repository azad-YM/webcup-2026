"use client"
import Link from "next/link"
import type { Route } from "next"
import type { ReactNode } from "react"
import { ArrowRight, CalendarClock, ClipboardList, HandHeart, Megaphone, MessageSquare, Newspaper, Search } from "@boilerplate/shared-ui/components/icon"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { greeting } from "../../core/domain/citizen-profile"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import { CitizenFirstVisitGuide } from "../sections/first-visit-guide"
import { NOTIFICATIONS_POLLING_MS, useListMyNotificationsQuery } from "../../core/application/rtk-api/notifications"
import { unreadOfKind, type NotificationKind } from "../../core/domain/notification"

type Shortcut = { title: string; text: string; href?: Route; icon: typeof Search; soon?: boolean; notifications?: NotificationKind }

const SHORTCUTS: Shortcut[] = [
  { title: "Contacter la mairie", text: "Posez une question ou adressez un message aux services municipaux.", href: "/espace/demandes/nouvelle?type=contact" as Route, icon: MessageSquare },
  { title: "Signaler un problème", text: "Voirie, éclairage, propreté, inondation… indiquez le lieu, la mairie s’en occupe.", href: "/espace/demandes/nouvelle?type=report" as Route, icon: Megaphone },
  { title: "Mes demandes", text: "Retrouvez vos demandes, leur état et chaque étape de leur traitement.", href: "/espace/demandes", icon: ClipboardList, notifications: "request.status_changed" },
  { title: "Mes rendez-vous", text: "Prenez rendez-vous avec un agent, déplacez-le ou annulez-le ; un rappel vous est envoyé.", href: "/espace/rendez-vous" as Route, icon: CalendarClock, notifications: "appointment.reminder" },
  { title: "Participer", text: "Soutenez les signalements de vos voisins, faites remonter une inquiétude et suivez la réponse.", href: "/espace/participation" as Route, icon: HandHeart, notifications: "concern.updated" },
  { title: "Trouver un service", text: "État civil, santé, transports, logement… tout ce que la ville peut faire pour vous.", href: "/services", icon: Search },
  { title: "Actualités de la ville", text: "Les dernières informations publiées par la mairie.", href: "/actualites", icon: Newspaper },
]

function ShortcutCard({ shortcut, unread = 0 }: { shortcut: Shortcut; unread?: number }) {
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <shortcut.icon className="size-7 text-teal-700" aria-hidden="true" />
        {unread > 0 && (
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-sm font-semibold text-slate-950">
            {unread}<span className="sr-only"> nouveauté{unread > 1 ? "s" : ""}</span>
          </span>
        )}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{shortcut.title}</h3>
      <p className="mt-2 flex-1 text-slate-700">{shortcut.text}</p>
      {shortcut.soon ? (
        <p className="mt-4 inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">Bientôt disponible</p>
      ) : (
        <span className="mt-4 inline-flex items-center gap-2 font-medium text-teal-800">Ouvrir <ArrowRight className="size-4" aria-hidden="true" /></span>
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
  // Pastilles des raccourcis : même cache que le centre de notifications (une seule requête).
  const inbox = useListMyNotificationsQuery(undefined, { skip: !profile, pollingInterval: NOTIFICATIONS_POLLING_MS })
  return (
    <>
      <PageHeader
        trail={[{ label: "Mon espace" }]}
        title={profile ? greeting(profile) : "Mon espace citoyen"}
        lead={profile ? "Bienvenue dans votre espace citoyen de Nova Terra." : undefined}
      />
      <PageBody>
        {!profile ? (
          <CitizenAccessState access={access} returnTo="/espace" nonCitizenFallback={spacesForNonCitizen} />
        ) : (
          <div className="space-y-10">
            <CitizenFirstVisitGuide profile={profile} />
            <section aria-labelledby="titre-raccourcis">
              <h2 id="titre-raccourcis" className="text-2xl font-semibold tracking-tight">Que souhaitez-vous faire ?</h2>
              <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {SHORTCUTS.map((shortcut) => (
                  <li key={shortcut.title}>
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
