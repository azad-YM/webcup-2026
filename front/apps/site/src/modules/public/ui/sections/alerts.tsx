"use client"
import { useEffect } from "react"
import { useSession } from "@/modules/shared/ui/store-provider"
import { isUnauthorized, toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { useAlertsQuery, useNotificationsQuery, useAlertPreferenceQuery, useSetAlertConsentMutation } from "../../core/application/rtk-api/alerts"
import type { CityNotice } from "../../core/domain/alert"
function Notice({ notice }: { notice: CityNotice }) { return <article className={`rounded-xl border p-4 ${notice.severity === "critical" ? "border-red-400 bg-red-50" : notice.severity === "warning" ? "border-amber-400 bg-amber-50" : "border-teal-300 bg-teal-50"}`}><h3 className="font-semibold">{notice.severity === "critical" ? "Urgence · " : notice.severity === "warning" ? "Vigilance · " : ""}{notice.title}</h3><p>{notice.summary}</p>{notice.body.map((p, i) => <p key={i} className="mt-2">{p}</p>)}{notice.recommendations && <div className="mt-3 whitespace-pre-line"><strong>Recommandations de la ville</strong><p>{notice.recommendations}</p></div>}</article> }
export function AlertBanner() {
 const session = useSession()
 const general = useAlertsQuery(undefined, { pollingInterval: 60_000 })
 const targeted = useNotificationsQuery(undefined, { skip: !session.ready || !session.hasToken, pollingInterval: 60_000 })
 const unauthorized = isUnauthorized(targeted.error)
 useEffect(() => { if (unauthorized) session.logout() }, [unauthorized, session])
 const notices = [...(general.data ?? []), ...(session.hasToken ? targeted.data ?? [] : [])].filter((n, i, all) => n.severity !== null && all.findIndex(x => x.id === n.id) === i)
 if (!notices.length && !general.error) return null
 return <aside aria-label="Alertes de la ville" className="mx-auto w-full max-w-6xl space-y-3 px-5 py-3" aria-live="polite">{notices.map(n => <Notice key={n.id} notice={n} />)}{general.error && <p>Les alertes ne sont pas disponibles. <button className="underline" onClick={() => void general.refetch()}>Réessayer</button></p>}</aside>
}
export function CitizenNotifications() {
 const session = useSession()
 const skip = !session.ready || !session.hasToken
 const notifications = useNotificationsQuery(undefined, { skip, pollingInterval: 60_000 })
 const preferences = useAlertPreferenceQuery(undefined, { skip })
 const [save, state] = useSetAlertConsentMutation()
 const unauthorized = isUnauthorized(notifications.error) || isUnauthorized(preferences.error) || isUnauthorized(state.error)
 useEffect(() => { if (unauthorized) session.logout() }, [unauthorized, session])
 if (skip) return null
 return <section className="mx-auto max-w-6xl space-y-4 px-5 py-8" aria-labelledby="notifications-title"><h2 id="notifications-title" className="text-2xl font-semibold">Notifications de la ville</h2>
  {preferences.data && <div className="rounded-xl border bg-white p-5"><label className="flex items-start gap-3"><input className="mt-1" type="checkbox" checked={preferences.data.healthConsent} disabled={state.isLoading} onChange={e => void save(e.target.checked)} /><span>Je souhaite recevoir les alertes sanitaires et les recommandations destinées aux personnes vulnérables.<span className="block text-sm text-slate-600">Facultatif et révocable ici à tout moment. Aucune information médicale n’est demandée.</span></span></label>{state.error && <p role="alert">{toQueryError(state.error)?.data}</p>}</div>}
  {notifications.error ? <div role="alert">{toQueryError(notifications.error)?.data}<button className="ml-3 underline" onClick={() => { void notifications.refetch(); void preferences.refetch() }}>Réessayer</button></div> : notifications.isLoading ? <p role="status">Chargement des notifications…</p> : notifications.data?.length ? <div className="space-y-3" aria-live="polite">{notifications.data.map(n => <Notice key={n.id} notice={n} />)}</div> : <p>Aucune annonce importante ni alerte active pour votre profil.</p>}
  {preferences.error && !notifications.error && <p role="alert">Préférences indisponibles. <button className="underline" onClick={() => void preferences.refetch()}>Réessayer</button></p>}
 </section>
}
