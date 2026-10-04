"use client"
import Link from "@/modules/shared/ui/link"
import { Download, Phone, Printer, Siren } from "@boilerplate/shared-ui/components/icon"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import { downloadTextFile, todayStamp } from "@/modules/shared/ui/download"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { ALERTS_POLLING_MS, useListAlertsQuery, useSavedAlertsQuery } from "../../core/application/rtk-api/alerts"
import { CONTENT_POLLING_MS, useListServicesQuery } from "../../core/application/rtk-api/public"
import { alertTiming, ALERT_KIND_LABELS, audienceLabel, formatDateTime, formatMoment } from "../../core/domain/alert"
import { CRISIS_GUIDES, EMERGENCY_NUMBERS } from "../../core/domain/crisis-guides"
import { essentialContacts, essentialsText } from "../../core/domain/essentials"

/**
 * « L’essentiel » (F93, F94, F96) : une page courte et sobre pour un incident, une panne de réseau ou une
 * connexion limitée. Numéros d’urgence et consignes générales sont dans le HTML statique (lisibles sans
 * JavaScript ni réseau) ; alertes et coordonnées des services viennent de l’API, sinon de la dernière copie
 * enregistrée (service worker et mémoire de l’appareil). « Garder sur cet appareil » produit un fichier texte.
 */
export function EssentialsPage() {
  const alerts = useListAlertsQuery(undefined, polling(ALERTS_POLLING_MS))
  const saved = useSavedAlertsQuery()
  const services = useListServicesQuery(undefined, polling(CONTENT_POLLING_MS))
  const now = Date.now()
  const fromCopy = !alerts.data && Boolean(saved.data)
  const current = (alerts.data ?? saved.data?.alerts ?? []).filter((alert) => alertTiming(alert, now) !== "ended")
  const contacts = essentialContacts(services.data ?? [])
  const keep = () => downloadTextFile(`nova-terra-essentiel-${todayStamp()}.txt`, essentialsText(current, contacts, new Date()), "text/plain;charset=utf-8")
  return (
    <>
      <PageHeader
        trail={[{ label: "L’essentiel" }]}
        title="L’essentiel en cas d’incident"
        lead="Numéros d’urgence, alertes en cours, consignes et coordonnées des services, sur une seule page légère. Elle reste consultable sur cet appareil si le réseau est coupé."
      >
        <div className="mt-5 flex flex-wrap gap-3 print:hidden">
          <button type="button" onClick={keep} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
            <Download className="size-4" aria-hidden="true" /> Garder sur cet appareil (fichier texte)
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100">
            <Printer className="size-4" aria-hidden="true" /> Imprimer
          </button>
        </div>
      </PageHeader>
      <PageBody narrow>
        <div className="space-y-10">
          <section aria-labelledby="titre-numeros-essentiels">
            <h2 id="titre-numeros-essentiels" className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Siren className="size-6 text-red-700" aria-hidden="true" /> Numéros d’urgence</h2>
            <p className="mt-1 text-slate-700">Gratuits, joignables même sans forfait ni Internet.</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {EMERGENCY_NUMBERS.map((item) => (
                <li key={item.number}>
                  <a href={"sms" in item ? `sms:${item.number}` : `tel:${item.number}`} className="flex items-center gap-3 rounded-xl bg-red-700 px-4 py-3 text-white hover:bg-red-800">
                    <Phone className="size-5 shrink-0" aria-hidden="true" />
                    <span className="text-2xl font-bold tabular-nums" dir="ltr">{item.number}</span>
                    <span className="text-sm leading-5">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="titre-alertes-essentielles" aria-live="polite">
            <h2 id="titre-alertes-essentielles" className="text-2xl font-semibold tracking-tight">Alertes en cours</h2>
            {fromCopy && saved.data && (
              <p role="status" className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">Copie enregistrée sur cet appareil le {formatDateTime(saved.data.savedAt)} : la connexion est indisponible.</p>
            )}
            {!alerts.data && !saved.data ? (
              <p className="mt-2 text-slate-700">{alerts.error ? "Alertes indisponibles pour le moment : appliquez les consignes générales ci-dessous." : "Chargement des alertes…"}</p>
            ) : current.length === 0 ? (
              <p className="mt-2 text-slate-700">Aucune alerte en cours.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {current.map((alert) => (
                  <li key={alert.id} className={`rounded-xl border-s-4 bg-white p-4 ${alert.severity === "critical" ? "border-red-700" : alert.severity === "warning" ? "border-amber-500" : "border-teal-600"}`}>
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-sm text-slate-700">
                      {alert.kind && alert.kind !== "general" ? `${ALERT_KIND_LABELS[alert.kind]} · ` : ""}{alert.area || audienceLabel(alert)} · {alertTiming(alert, now) === "upcoming" ? `à partir de ${formatMoment(alert.startsAt, now)}` : `jusqu’à ${formatMoment(alert.endsAt, now)}`}
                    </p>
                    <p className="mt-1">{alert.message}</p>
                    {alert.recommendations.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 ps-5">{alert.recommendations.map((step) => <li key={step}>{step}</li>)}</ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm"><Link href="/alertes" className="font-medium text-teal-800 underline underline-offset-4">Toutes les alertes et le choix de mon quartier</Link></p>
          </section>

          <section aria-labelledby="titre-consignes-essentielles">
            <h2 id="titre-consignes-essentielles" className="text-2xl font-semibold tracking-tight">Que faire en cas de…</h2>
            <div className="mt-3 space-y-2">
              {CRISIS_GUIDES.map((guide) => (
                <details key={guide.id} className="rounded-xl border border-slate-200 bg-white p-4" open={guide.id === "network" || current.some((alert) => alert.kind === guide.id)}>
                  <summary className="cursor-pointer font-semibold">{guide.title}</summary>
                  <p className="mt-1 text-sm text-slate-700">{guide.summary}</p>
                  <ul className="mt-2 list-disc space-y-1 ps-5">{guide.steps.map((step) => <li key={step}>{step}</li>)}</ul>
                </details>
              ))}
            </div>
          </section>

          <section aria-labelledby="titre-contacts-essentiels">
            <h2 id="titre-contacts-essentiels" className="text-2xl font-semibold tracking-tight">Coordonnées des services</h2>
            {!services.data ? (
              <p className="mt-2 text-slate-700">{services.error ? "Coordonnées indisponibles sans connexion tant que la page n’a pas été ouverte une première fois. Le fichier texte les garde." : "Chargement des coordonnées…"}</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {contacts.map((contact) => (
                  <li key={contact.id} className="p-4">
                    <p className="font-semibold">{contact.name}{contact.emergency && <span className="ms-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-900">Urgence</span>}</p>
                    {contact.phone && <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="mt-1 inline-flex items-center gap-1 font-medium text-teal-800 underline underline-offset-4" dir="ltr"><Phone className="size-4" aria-hidden="true" /> {contact.phone}</a>}
                    {contact.place && <p className="text-sm text-slate-700">{contact.place}{contact.hours ? ` · ${contact.hours}` : ""}</p>}
                    {contact.disruption && <p className="mt-1 text-sm font-medium text-amber-900">{contact.disruption}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </PageBody>
    </>
  )
}
