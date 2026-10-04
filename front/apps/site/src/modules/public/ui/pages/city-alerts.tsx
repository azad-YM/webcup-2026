"use client"
import { useEffect, useState } from "react"
import Link from "@/modules/shared/ui/link"
import { Bell, Printer } from "@boilerplate/shared-ui/components/icon"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import { useSession } from "@/modules/shared/ui/store-provider"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { SelectField } from "@/modules/shared/ui/components/form-field"
import { EmptyState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import {
  ALERTS_POLLING_MS,
  useChooseDistrictMutation,
  useChosenDistrictQuery,
  useListAlertsQuery,
  useListDistrictsQuery,
  useMyNotificationsQuery,
  useSavedAlertsQuery
} from "../../core/application/rtk-api/alerts"
import { alertTiming, concernsDistrict, formatDateTime, isOfficialMessage, mergeAlerts, type CityAlert } from "../../core/domain/alert"
import { CRISIS_GUIDES } from "../../core/domain/crisis-guides"
import { AlertNotice, OfficialMessageNotice } from "../sections/alerts"

/** F104 : autorisation des notifications de l’appareil (alertes graves pendant la visite). */
function DeviceNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")
  useEffect(() => setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission), [])
  if (permission === "unsupported") return null
  return (
    <section aria-labelledby="titre-notifier" className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 id="titre-notifier" className="flex items-center gap-2 text-lg font-semibold"><Bell className="size-5 text-teal-700" aria-hidden="true" /> Être prévenu sur cet appareil</h2>
      {permission === "granted" ? (
        <p className="mt-2 text-slate-700">Activé : une nouvelle alerte grave s’affiche aussi en notification tant qu’une page du site est ouverte.</p>
      ) : permission === "denied" ? (
        <p className="mt-2 text-slate-700">Les notifications sont bloquées dans les réglages du navigateur. Le bandeau en haut de chaque page reste affiché.</p>
      ) : (
        <>
          <p className="mt-2 text-slate-700">Recevez une notification dès qu’une alerte grave est publiée, même si vous regardez un autre onglet.</p>
          <button type="button" onClick={() => void Notification.requestPermission().then(setPermission)} className="mt-3 rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
            Activer les notifications
          </button>
        </>
      )}
    </section>
  )
}

function AlertList({ title, alerts, now, empty }: { title: string; alerts: CityAlert[]; now: number; empty?: string }) {
  if (alerts.length === 0 && !empty) return null
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {alerts.length === 0 ? <p className="text-slate-700">{empty}</p> : alerts.map((alert) => isOfficialMessage(alert)
        ? <OfficialMessageNotice key={alert.id} alert={alert} read={false} />
        : <AlertNotice key={alert.id} alert={alert} now={now} />)}
    </section>
  )
}

/**
 * Alertes et consignes (F101, F104, F94) : toutes les alertes en cours et annoncées, filtrées par quartier
 * (choix mémorisé sur l’appareil), la copie enregistrée si le réseau est coupé, les consignes générales
 * par situation (statiques, lisibles hors ligne) et l’activation des notifications de l’appareil.
 */
export function CityAlertsPage() {
  const session = useSession()
  const connected = session.ready && session.hasToken
  const general = useListAlertsQuery(undefined, polling(ALERTS_POLLING_MS))
  const mine = useMyNotificationsQuery(undefined, { skip: !connected })
  const saved = useSavedAlertsQuery()
  const districts = useListDistrictsQuery()
  const chosen = useChosenDistrictQuery()
  const [chooseDistrict] = useChooseDistrictMutation()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  const district = chosen.data ?? null
  const offline = Boolean(general.error) && !general.data
  const source = offline ? saved.data?.alerts ?? [] : mergeAlerts(general.data ?? [], connected ? mine.data?.alerts ?? [] : [])
  const live = source.filter((alert) => alertTiming(alert, now) !== "ended")
  const relevant = live.filter((alert) => concernsDistrict(alert, district))
  const elsewhere = live.filter((alert) => !relevant.includes(alert))
  return (
    <>
      <PageHeader
        trail={[{ label: "Alertes et consignes" }]}
        title="Alertes et consignes"
        lead="Ce qui se passe maintenant dans la ville, ce qui est annoncé, et ce qu’il faut faire. Les consignes restent lisibles sur cet appareil si le réseau est coupé."
      >
        <div className="mt-5 flex flex-wrap items-end gap-4 print:hidden">
          <SelectField
            id="quartier-alertes"
            label="Mon quartier"
            hint="Mémorisé sur cet appareil seulement."
            placeholder="Tous les quartiers"
            options={(districts.data ?? []).map((value) => ({ value, label: value }))}
            value={district ?? ""}
            onChange={(event) => void chooseDistrict(event.target.value || null)}
            className="min-w-56"
          />
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100">
            <Printer className="size-4" aria-hidden="true" /> Imprimer les consignes
          </button>
          <Link href="/essentiel" className="rounded-lg px-3 py-2 font-medium text-teal-800 underline underline-offset-4">L’essentiel hors ligne</Link>
        </div>
      </PageHeader>
      <PageBody>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-10" aria-live="polite">
            {offline && (
              <p role="status" className="rounded-xl border-s-4 border-amber-500 bg-amber-50 p-4 text-amber-950">
                {saved.data
                  ? <>Réseau indisponible : voici les alertes enregistrées sur cet appareil le <strong>{formatDateTime(saved.data.savedAt)}</strong>. Elles peuvent avoir changé depuis.</>
                  : <>Réseau indisponible et aucune alerte enregistrée sur cet appareil. Les consignes générales ci-dessous restent valables.</>}
              </p>
            )}
            {!offline && !general.data ? (
              <LoadingState label="Chargement des alertes"><SkeletonCards count={2} /></LoadingState>
            ) : (
              <>
                <AlertList
                  title={district ? `En cours — quartier ${district} et toute la ville` : "En cours"}
                  alerts={relevant.filter((alert) => alertTiming(alert, now) === "active")}
                  now={now}
                  empty="Aucune alerte en cours pour le moment."
                />
                <AlertList title="Annoncées" alerts={relevant.filter((alert) => alertTiming(alert, now) === "upcoming")} now={now} />
                <AlertList title="Dans les autres quartiers" alerts={elsewhere} now={now} />
              </>
            )}
          </div>
          <div className="space-y-6">
            <DeviceNotifications />
            <section aria-labelledby="titre-guides" className="space-y-3">
              <h2 id="titre-guides" className="text-lg font-semibold">Que faire en cas de…</h2>
              {CRISIS_GUIDES.map((guide) => (
                <details key={guide.id} id={`consignes-${guide.id}`} className="rounded-xl border border-slate-200 bg-white p-4 open:shadow-sm print:open:shadow-none" open={live.some((alert) => alert.kind === guide.id)}>
                  <summary className="cursor-pointer font-semibold">{guide.title}</summary>
                  <p className="mt-2 text-sm text-slate-700">{guide.summary}</p>
                  <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
                    {guide.steps.map((step) => <li key={step}>{step}</li>)}
                  </ul>
                </details>
              ))}
            </section>
            {source.length === 0 && !offline && general.data && <EmptyState title="Rien à signaler dans la ville." />}
          </div>
        </div>
      </PageBody>
    </>
  )
}
