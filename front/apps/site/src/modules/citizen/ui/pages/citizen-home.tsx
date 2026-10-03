"use client"
import Link from "next/link"
import type { Route } from "next"
import type { ReactNode } from "react"
import { ArrowRight, ClipboardList, Megaphone, MessageSquare, Newspaper, Search, Sparkles, UserRound } from "@boilerplate/shared-ui/components/icon"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { greeting, PREFERRED_LANGUAGES, type CitizenProfile } from "../../core/domain/citizen-profile"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import { NotificationCenter } from "../sections/notification-center"
import { NOTIFICATIONS_POLLING_MS, useListMyNotificationsQuery } from "../../core/application/rtk-api/notifications"
import { unreadOfKind, type NotificationKind } from "../../core/domain/notification"

type Shortcut = { title: string; text: string; href?: Route; icon: typeof Search; soon?: boolean; notifications?: NotificationKind }

const SHORTCUTS: Shortcut[] = [
  { title: "Contacter la mairie", text: "Posez une question ou adressez un message aux services municipaux.", href: "/espace/demandes/nouvelle?type=contact" as Route, icon: MessageSquare },
  { title: "Signaler un problème", text: "Voirie, éclairage, propreté, inondation… indiquez le lieu, la mairie s’en occupe.", href: "/espace/demandes/nouvelle?type=report" as Route, icon: Megaphone },
  { title: "Mes demandes", text: "Retrouvez vos demandes, leur état et chaque étape de leur traitement.", href: "/espace/demandes", icon: ClipboardList, notifications: "request.status_changed" },
  { title: "Trouver un service", text: "État civil, santé, transports, logement… toutes les démarches de la ville.", href: "/services", icon: Search },
  { title: "Actualités de la ville", text: "Les dernières informations publiées par la mairie.", href: "/actualites", icon: Newspaper },
  { title: "Mon profil", text: "Vos coordonnées, votre quartier et votre langue préférée.", href: "/espace/profil", icon: UserRound }
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

function ProfileSummary({ profile }: { profile: CitizenProfile }) {
  const language = PREFERRED_LANGUAGES.find((item) => item.code === profile.preferredLanguage)?.label ?? profile.preferredLanguage
  const rows: [string, string | null][] = [
    ["Nom", [profile.firstName, profile.lastName].filter(Boolean).join(" ") || null],
    ["Quartier", profile.district],
    ["Téléphone", profile.phone],
    ["Langue préférée", language]
  ]
  return (
    <section aria-labelledby="titre-mes-informations" className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 id="titre-mes-informations" className="text-lg font-semibold">Mes informations</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-slate-600">{label}</dt>
            <dd className="font-medium text-slate-900">{value ?? <span className="font-normal text-slate-600">Non renseigné</span>}</dd>
          </div>
        ))}
      </dl>
      <Link href="/espace/profil" className="mt-5 inline-flex font-medium text-teal-800 underline underline-offset-4">Modifier mes informations</Link>
    </section>
  )
}

/**
 * Accueil de l’espace citoyen (D03), avec l’invitation à compléter le profil (base D12).
 * `spaces` : liste des espaces IAM fournie par la composition (carte « Administration »).
 */
export function CitizenHomePage({ spaces, spacesForNonCitizen }: { spaces: ReactNode; spacesForNonCitizen: ReactNode }) {
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
            {!profile.profileCompleted && (
              <section aria-labelledby="titre-completer-profil" className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-4">
                  <Sparkles className="mt-1 size-6 shrink-0 text-amber-800" aria-hidden="true" />
                  <div>
                    <h2 id="titre-completer-profil" className="text-lg font-semibold text-slate-950">Complétez votre profil</h2>
                    <p className="mt-1 text-slate-800">Indiquez votre nom et votre quartier : les services pourront vous répondre plus facilement et vous serez informé de ce qui concerne votre quartier.</p>
                  </div>
                </div>
                <Link href="/espace/profil" className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-center font-medium text-white hover:bg-slate-800">Compléter mon profil</Link>
              </section>
            )}
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
            <NotificationCenter />
            <ProfileSummary profile={profile} />
            {spaces}
          </div>
        )}
      </PageBody>
    </>
  )
}
