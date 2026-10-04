"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import Link from "@/modules/shared/ui/link"
import { AlertTriangle, BadgeCheck, Bus, CloudLightning, Droplets, HeartPulse, Info, Megaphone, Sun, WifiOff, ZapOff } from "@boilerplate/shared-ui/components/icon"
import { useSession } from "@/modules/shared/ui/store-provider"
import { isUnauthorized, toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { ErrorState, LoadingState } from "@/modules/shared/ui/components/states"
import {
  ALERTS_POLLING_MS,
  useListAlertsQuery,
  useMarkOfficialMessageReadMutation,
  useReadOfficialMessagesQuery,
  useMyAlertPreferenceQuery,
  useMyNotificationsQuery,
  useSetHealthConsentMutation,
  useChosenDistrictQuery,
  useSaveAlertsMutation
} from "../../core/application/rtk-api/alerts"
import { ALERT_KIND_LABELS, alertTiming, audienceLabel, concernsDistrict, formatDateTime, formatDelay, formatMoment, isOfficialMessage, mergeAlerts, nextAlertChange, SEVERITY_LABELS, type AlertKind, type CityAlert } from "../../core/domain/alert"
import { formatPublicationDate } from "../../core/domain/publication"
import { publicationHref } from "../components/content-cards"

const SEVERITY_STYLES: Record<CityAlert["severity"], string> = {
  critical: "border-red-700 bg-red-50 text-red-950",
  warning: "border-amber-500 bg-amber-50 text-amber-950",
  info: "border-teal-600 bg-teal-50 text-teal-950"
}

const KIND_ICONS: Record<AlertKind, typeof Info> = {
  general: Info,
  power: ZapOff,
  network: WifiOff,
  "solar-storm": Sun,
  transport: Bus,
  weather: CloudLightning,
  water: Droplets,
  health: HeartPulse
}

/**
 * Une alerte (D18, F29, F101, F104) lisible d’un coup d’œil : nature et gravité, où, jusqu’à quand,
 * ce qui se passe, puis ce qu’il faut faire — affiché d’emblée pour une urgence, repliable sinon.
 */
export function AlertNotice({ alert, headingLevel = 2, now = Date.now() }: { alert: CityAlert; headingLevel?: 2 | 3; now?: number }) {
  const Heading = headingLevel === 2 ? "h2" : "h3"
  const kind = alert.kind ?? "general"
  const Icon = kind === "general" ? (alert.severity === "info" ? Info : AlertTriangle) : KIND_ICONS[kind]
  const upcoming = alertTiming(alert, now) === "upcoming"
  const where = alert.area ? `${alert.area}${alert.audience === "district" ? ` (quartier ${alert.district})` : ""}` : audienceLabel(alert)
  const steps = alert.recommendations.length > 0 && (
    <ul className="mt-1 list-disc space-y-1 ps-6">
      {alert.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}
    </ul>
  )
  return (
    <article className={`rounded-xl border-l-4 p-4 ${SEVERITY_STYLES[alert.severity]}`} aria-labelledby={`alerte-${alert.id}`}>
      <div className="flex items-start gap-3">
        <Icon className="mt-1 size-6 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap gap-2 text-sm font-semibold uppercase tracking-wide">
            <span className="rounded bg-white/70 px-2 py-0.5">{SEVERITY_LABELS[alert.severity]}</span>
            {kind !== "general" && <span className="rounded bg-white/70 px-2 py-0.5">{ALERT_KIND_LABELS[kind]}</span>}
            {upcoming && <span className="rounded bg-slate-900 px-2 py-0.5 text-white">À venir</span>}
          </p>
          <Heading id={`alerte-${alert.id}`} className="mt-1 text-lg font-semibold">{alert.title}</Heading>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="font-semibold">Où</dt>
            <dd>{where}</dd>
            <dt className="font-semibold">{upcoming ? "À partir de" : "Jusqu’à"}</dt>
            <dd>
              {upcoming
                ? <><time dateTime={alert.startsAt}>{formatMoment(alert.startsAt, now)}</time> ({formatDelay(alert.startsAt, now)}) · jusqu’à <time dateTime={alert.endsAt}>{formatMoment(alert.endsAt, now)}</time></>
                : <time dateTime={alert.endsAt}>{formatMoment(alert.endsAt, now)}</time>}
            </dd>
          </dl>
          <p className="mt-2 whitespace-pre-line">{alert.message}</p>
          {steps && (alert.severity === "critical" || upcoming ? (
            <div className="mt-3 rounded-lg bg-white/70 p-3">
              <p className="font-semibold">{upcoming ? "À faire dès maintenant" : "Ce que vous devez faire"}</p>
              {steps}
            </div>
          ) : (
            <details className="mt-3">
              <summary className="cursor-pointer font-medium underline underline-offset-4">Ce que vous devez faire</summary>
              {steps}
            </details>
          ))}
        </div>
      </div>
    </article>
  )
}

/**
 * Horloge du bandeau (F101) : se réveille au prochain début ou fin d’alerte et toutes les 30 s
 * (« dans 25 min »), pour afficher chaque alerte au bon moment sans attendre un rechargement.
 */
function useAlertClock(alerts: CityAlert[]): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const next = nextAlertChange(alerts, now)
    const delay = Math.min(30_000, next === null ? 30_000 : Math.max(500, next - now + 250))
    const timer = window.setTimeout(() => setNow(Date.now()), delay)
    return () => window.clearTimeout(timer)
  }, [alerts, now])
  return now
}

/**
 * F104 : une notification de l’appareil pour une nouvelle alerte grave, si la personne l’a autorisée
 * (page « Alertes et consignes »). Seulement pour les alertes arrivées pendant la visite.
 */
function useDeviceNotifications(alerts: CityAlert[]) {
  const known = useRef<Set<string> | null>(null)
  useEffect(() => {
    const ids = new Set(alerts.map((alert) => alert.id))
    if (known.current === null) {
      known.current = ids
      return
    }
    const fresh = alerts.filter((alert) => !known.current?.has(alert.id) && alert.severity === "critical")
    known.current = ids
    if (fresh.length === 0 || typeof Notification === "undefined" || Notification.permission !== "granted") return
    for (const alert of fresh) {
      try {
        new Notification(`Alerte : ${alert.title}`, { body: alert.recommendations[0] ?? alert.message, tag: alert.id, lang: "fr" })
      } catch {
        /* Certains navigateurs mobiles exigent un service worker pour notifier : le bandeau suffit. */
      }
    }
  }, [alerts])
}

/**
 * F73 : message officiel du Haut Conseil — en-tête « Message officiel », date et heure, signataire, ce qu’il faut
 * savoir ou faire, accusé « J’ai lu » mémorisé dans ce navigateur. Une fois lu, il reste visible en une ligne.
 */
export function OfficialMessageNotice({ alert, read, onRead, headingLevel = 2 }: { alert: CityAlert; read: boolean; onRead?: () => void; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3"
  const date = <time dateTime={alert.publishedAt ?? alert.startsAt}>{formatDateTime(alert.publishedAt ?? alert.startsAt)}</time>
  if (read && onRead) {
    return (
      <details className="rounded-xl border-2 border-blue-900 bg-blue-50 px-4 py-2 text-blue-950">
        <summary className="cursor-pointer text-sm">
          <BadgeCheck className="mr-2 inline size-4 align-text-bottom" aria-hidden="true" />
          <strong>Message officiel</strong> du {date} : {alert.title} <span className="text-blue-900">(lu)</span>
        </summary>
        <p className="mt-2 whitespace-pre-line">{alert.message}</p>
        {alert.signatory && <p className="mt-2 text-sm font-medium">— {alert.signatory}</p>}
      </details>
    )
  }
  return (
    <article className="rounded-xl border-2 border-blue-900 bg-blue-50 p-4 text-blue-950" aria-labelledby={`officiel-${alert.id}`}>
      <div className="flex items-start gap-3">
        <BadgeCheck className="mt-1 size-6 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wide">Message officiel du Haut Conseil</p>
          <Heading id={`officiel-${alert.id}`} className="mt-1 text-lg font-semibold">{alert.title}</Heading>
          <p className="mt-1 text-sm">Publié le {date}{alert.signatory ? <> · signé : <strong>{alert.signatory}</strong></> : null}</p>
          <p className="mt-2 whitespace-pre-line">{alert.message}</p>
          {alert.recommendations.length > 0 && (
            <div className="mt-3">
              <p className="font-semibold">Ce qu’il faut savoir ou faire</p>
              <ul className="mt-1 list-disc space-y-1 ps-6">
                {alert.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {onRead && <button type="button" onClick={onRead} className="rounded-md bg-blue-900 px-4 py-2 font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2">J’ai lu</button>}
            <Link href="/messages-officiels" className="text-sm font-medium underline underline-offset-4">Tous les messages officiels</Link>
          </div>
        </div>
      </div>
    </article>
  )
}

/** Messages officiels en cours, avec l’accusé « J’ai lu » de ce navigateur. */
function OfficialMessages({ messages }: { messages: CityAlert[] }) {
  const read = useReadOfficialMessagesQuery()
  const [markRead] = useMarkOfficialMessageReadMutation()
  const ids = read.data ?? []
  return (
    <>
      {messages.map((alert) => <OfficialMessageNotice key={alert.id} alert={alert} read={ids.includes(alert.id)} onRead={() => void markRead(alert.id)} />)}
    </>
  )
}

/**
 * Bandeau d’alertes (D18, F29, F101, F104) sous l’en-tête de chaque page : alertes générales et de quartier,
 * plus celles qui visent le citoyen connecté (quartier du profil, alertes sanitaires).
 * - Quartier connu (profil ou choix sur l’appareil) : ses alertes en entier, les autres quartiers en une ligne.
 * - Alertes annoncées (début dans les 12 h) : « À venir », avec les consignes à lire dès maintenant.
 * - Chaque alerte apparaît et disparaît à la minute près ; une copie est gardée sur l’appareil (coupure du réseau).
 * Mis à jour en temps réel, avec un rafraîchissement de secours toutes les 60 s.
 */
export function AlertBanner() {
  const session = useSession()
  const general = useListAlertsQuery(undefined, polling(ALERTS_POLLING_MS))
  const connected = session.ready && session.hasToken
  const mine = useMyNotificationsQuery(undefined, { skip: !connected, ...polling(ALERTS_POLLING_MS) })
  const chosen = useChosenDistrictQuery()
  const [saveAlerts] = useSaveAlertsMutation()
  const personal = useMemo(() => (connected ? mine.data?.alerts ?? [] : []), [connected, mine.data])
  const alerts = useMemo(() => mergeAlerts(general.data ?? [], personal), [general.data, personal])
  const now = useAlertClock(alerts)
  useDeviceNotifications(alerts)
  useEffect(() => {
    if (general.data) void saveAlerts(alerts)
  }, [general.data, alerts, saveAlerts])
  const district = chosen.data ?? null
  const mineIds = new Set(personal.map((alert) => alert.id))
  const live = alerts.filter((alert) => alertTiming(alert, now) !== "ended")
  const relevant = live.filter((alert) => mineIds.has(alert.id) || concernsDistrict(alert, district))
  const elsewhere = live.filter((alert) => !relevant.includes(alert) && alertTiming(alert, now) === "active")
  if (relevant.length === 0 && elsewhere.length === 0) return null
  // F73 : les messages officiels du Haut Conseil passent avant les alertes.
  const official = relevant.filter((alert) => isOfficialMessage(alert) && alertTiming(alert, now) === "active")
  const active = relevant.filter((alert) => !isOfficialMessage(alert) && alertTiming(alert, now) === "active")
  const upcoming = relevant.filter((alert) => alertTiming(alert, now) === "upcoming")
  return (
    <aside aria-label="Alertes de la ville" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl space-y-3 px-4 py-4 sm:px-6 lg:px-8" aria-live="polite">
        {official.length > 0 && <OfficialMessages messages={official} />}
        {active.map((alert) => <AlertNotice key={alert.id} alert={alert} now={now} />)}
        {upcoming.map((alert) => <AlertNotice key={alert.id} alert={alert} now={now} />)}
        {elsewhere.length > 0 && (
          <p className="text-sm text-slate-700">
            Aussi en cours : {elsewhere.map((alert) => `${alert.title}${alert.district ? ` (quartier ${alert.district})` : ""}`).join(" · ")}.{" "}
            <Link href="/alertes" className="font-medium text-teal-800 underline underline-offset-4">Voir toutes les alertes</Link>
          </p>
        )}
        {(active.length > 0 || upcoming.length > 0) && (
          <p className="text-sm">
            <Link href="/alertes" className="font-medium text-teal-800 underline underline-offset-4">Alertes et consignes</Link>
            {district === null && live.some((alert) => alert.audience === "district") ? " · indiquez votre quartier pour ne voir que ce qui vous concerne" : district ? ` · quartier ${district}` : ""}
          </p>
        )}
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
