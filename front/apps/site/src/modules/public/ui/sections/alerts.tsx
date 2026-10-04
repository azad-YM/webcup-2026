"use client"
import { useEffect } from "react"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import Link from "next/link"
import { AlertTriangle, Info, Megaphone } from "@boilerplate/shared-ui/components/icon"
import { useSession } from "@/modules/shared/ui/store-provider"
import { isUnauthorized, toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { ErrorState, LoadingState } from "@/modules/shared/ui/components/states"
import {
  ALERTS_POLLING_MS,
  useListAlertsQuery,
  useMyAlertPreferenceQuery,
  useMyNotificationsQuery,
  useSetHealthConsentMutation
} from "../../core/application/rtk-api/alerts"
import { audienceLabel, formatDateTime, mergeAlerts, SEVERITY_LABELS, type CityAlert } from "../../core/domain/alert"
import { formatPublicationDate } from "../../core/domain/publication"
import { publicationHref } from "../components/content-cards"

const SEVERITY_STYLES: Record<CityAlert["severity"], string> = {
  critical: "border-red-700 bg-red-50 text-red-950",
  warning: "border-amber-500 bg-amber-50 text-amber-950",
  info: "border-teal-600 bg-teal-50 text-teal-950"
}

/** Une alerte : gravité, audience, validité, message et recommandations rédigées par la ville. */
export function AlertNotice({ alert, headingLevel = 2 }: { alert: CityAlert; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3"
  const Icon = alert.severity === "info" ? Info : AlertTriangle
  return (
    <article className={`rounded-xl border-l-4 p-4 ${SEVERITY_STYLES[alert.severity]}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-1 size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <Heading className="font-semibold">
            <span className="mr-2 rounded bg-white/70 px-2 py-0.5 text-sm uppercase tracking-wide">{SEVERITY_LABELS[alert.severity]}</span>
            {alert.title}
          </Heading>
          <p className="mt-1 text-sm">
            {audienceLabel(alert)} · jusqu’au <time dateTime={alert.endsAt}>{formatDateTime(alert.endsAt)}</time>
          </p>
          <p className="mt-2 whitespace-pre-line">{alert.message}</p>
          {alert.recommendations.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer font-medium underline underline-offset-4">Recommandations de la ville</summary>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                {alert.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}
              </ul>
            </details>
          )}
        </div>
      </div>
    </article>
  )
}

/**
 * Bandeau d’alertes (D18, F29) sous l’en-tête de chaque page : alertes générales,
 * plus celles qui visent le citoyen connecté (quartier, alertes sanitaires).
 * Mis à jour en temps réel, avec un rafraîchissement de secours toutes les 60 s.
 */
export function AlertBanner() {
  const session = useSession()
  const general = useListAlertsQuery(undefined, polling(ALERTS_POLLING_MS))
  const connected = session.ready && session.hasToken
  const mine = useMyNotificationsQuery(undefined, { skip: !connected, ...polling(ALERTS_POLLING_MS) })
  const alerts = mergeAlerts(general.data ?? [], connected ? mine.data?.alerts ?? [] : [])
  if (alerts.length === 0) return null
  return (
    <aside aria-label="Alertes de la ville" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl space-y-3 px-4 py-4 sm:px-6 lg:px-8" aria-live="polite">
        {alerts.map((alert) => <AlertNotice key={alert.id} alert={alert} />)}
      </div>
    </aside>
  )
}

function HealthConsent() {
  const preference = useMyAlertPreferenceQuery()
  const [save, saving] = useSetHealthConsentMutation()
  if (preference.error) {
    return <ErrorState message={toQueryError(preference.error)?.data ?? "Préférences indisponibles."} onRetry={() => void preference.refetch()} retrying={preference.isFetching} />
  }
  if (!preference.data) return <LoadingState label="Chargement de vos préférences d’alerte" />
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold">Vos préférences d’alerte</h3>
      <p className="mt-2 text-slate-700">
        {preference.data.district
          ? <>Vous recevez les alertes du quartier <strong>{preference.data.district}</strong>.</>
          : <>Aucun quartier renseigné : <Link href="/espace/profil" className="font-medium text-teal-800 underline">indiquez votre quartier</Link> pour recevoir ses alertes.</>}
      </p>
      <label className="mt-4 flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-5"
          checked={preference.data.healthConsent}
          disabled={saving.isLoading}
          onChange={(event) => void save(event.target.checked)}
        />
        <span>
          Je souhaite recevoir les alertes sanitaires et les recommandations destinées aux personnes vulnérables (vague de chaleur, épidémie…).
          <span className="mt-1 block text-sm text-slate-600">Facultatif, révocable ici à tout moment. Aucune information médicale ne vous est demandée.</span>
        </span>
      </label>
      {saving.error && <p role="alert" className="mt-2 font-medium text-red-700">{toQueryError(saving.error)?.data}</p>}
    </div>
  )
}

/**
 * Notifications de l’espace citoyen (F29, F30, F31) : alertes qui le concernent,
 * annonces importantes et consentement explicite aux alertes sanitaires.
 */
export function CitizenNotifications() {
  const session = useSession()
  const skip = !session.ready || !session.hasToken
  const notifications = useMyNotificationsQuery(undefined, { skip, ...polling(ALERTS_POLLING_MS) })
  const error = toQueryError(notifications.error)
  const unauthorized = isUnauthorized(notifications.error)
  useEffect(() => {
    if (unauthorized) session.logout()
  }, [unauthorized, session])
  // Compte non citoyen (agent) : l’espace citoyen affiche déjà son propre message.
  if (skip || error?.status === 404) return null
  return (
    <section aria-labelledby="titre-notifications" className="mx-auto max-w-7xl space-y-5 px-4 pb-12 sm:px-6 lg:px-8">
      <h2 id="titre-notifications" className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <Megaphone className="size-6 text-teal-700" aria-hidden="true" /> Notifications de la ville
      </h2>
      {notifications.error ? (
        <ErrorState message={error?.data ?? "Notifications indisponibles."} onRetry={() => void notifications.refetch()} retrying={notifications.isFetching} />
      ) : !notifications.data ? (
        <LoadingState label="Chargement des notifications" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2" aria-live="polite">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Alertes qui vous concernent</h3>
            {notifications.data.alerts.length === 0
              ? <p className="text-slate-700">Aucune alerte en cours pour vous.</p>
              : notifications.data.alerts.map((alert) => <AlertNotice key={alert.id} alert={alert} headingLevel={3} />)}
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Annonces importantes</h3>
            {notifications.data.announcements.length === 0 ? (
              <p className="text-slate-700">Aucune annonce importante pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {notifications.data.announcements.map((announcement) => (
                  <li key={announcement.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <Link href={publicationHref(announcement.id)} className="font-semibold text-teal-800 underline underline-offset-4">{announcement.title}</Link>
                    <p className="mt-1 text-slate-700">{announcement.summary}</p>
                    {announcement.publishedAt && <p className="mt-1 text-sm text-slate-600">Publié le <time dateTime={announcement.publishedAt}>{formatPublicationDate(announcement.publishedAt)}</time></p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      <HealthConsent />
    </section>
  )
}
