"use client"
import Link from "next/link"
import type { Route } from "next"
import { useSearchParams } from "next/navigation"
import { StatusBadge, type StatusTone } from "@boilerplate/shared-ui/components/a11y"
import { useListServicesQuery } from "../../core/application/rtk-api/public"
import {
  findService,
  serviceAvailability,
  SERVICE_STATUS_LABELS,
  type MunicipalService
} from "../../core/domain/municipal-service"

const returnFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" })

/** Où la notice est montrée : la fiche du service ou le début d’un formulaire qui le vise. */
export type ServiceNoticeContext = "fiche" | "demande" | "rendez-vous"

const BLOCKED: Record<ServiceNoticeContext, string> = {
  fiche: "Les nouvelles demandes et les réservations de rendez-vous pour ce service sont suspendues.",
  demande: "Vous ne pouvez pas envoyer de demande à ce service pour le moment : elle serait refusée.",
  "rendez-vous": "Vous ne pouvez pas réserver de rendez-vous pour ce service pour le moment."
}

/**
 * F63/F64 : état du service affiché avant toute démarche, avec ce qui reste possible et la prochaine action
 * (alternative, quand revenir, contacter la mairie). Le statut ne repose jamais sur la seule couleur (`StatusBadge`).
 */
export function ServiceStatusNotice({ service, context }: { service: MunicipalService; context: ServiceNoticeContext }) {
  const state = serviceAvailability(service)
  if (state === "available") {
    return (
      <p className="mt-4">
        <StatusBadge tone="success" size="md" label={SERVICE_STATUS_LABELS.available} srPrefix={`État du service ${service.name} :`} />
      </p>
    )
  }
  const disabled = state === "disabled"
  const tone: StatusTone = disabled ? "danger" : service.status === "incident" ? "danger" : "warning"
  const label = disabled ? "Service désactivé" : SERVICE_STATUS_LABELS[service.status]
  const message = disabled ? service.disabledReason : service.statusMessage
  const contact = [service.contact.place, service.contact.hours, service.contact.phone].filter(Boolean).join(" · ")
  return (
    <section
      role="status"
      aria-labelledby={`etat-${service.id}-${context}`}
      className={`mt-6 rounded-xl border-l-4 p-5 ${disabled ? "border-red-700 bg-red-50 text-red-950" : "border-amber-500 bg-amber-50 text-amber-950"}`}
    >
      <StatusBadge tone={tone} size="md" label={label} srPrefix={`État du service ${service.name} :`} />
      <h2 id={`etat-${service.id}-${context}`} className="mt-3 text-lg font-semibold">
        {disabled ? `« ${service.name} » est momentanément désactivé` : `« ${service.name} » fonctionne avec des difficultés`}
      </h2>
      {message && <p className="mt-2 whitespace-pre-line"><strong>Pourquoi :</strong> {message}</p>}
      <p className="mt-2">{disabled ? BLOCKED[context] : "Vous pouvez quand même faire votre démarche ; la réponse peut prendre plus de temps."}</p>
      <h3 className="mt-4 font-semibold">Ce que vous pouvez faire</h3>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        {service.alternative && <li className="whitespace-pre-line"><strong>En attendant :</strong> {service.alternative}</li>}
        <li>
          {service.returnAt
            ? <><strong>Quand revenir :</strong> retour prévu le <time dateTime={service.returnAt}>{returnFormat.format(new Date(service.returnAt))}</time>.</>
            : <><strong>Quand revenir :</strong> cette page se met à jour toute seule dès que le service est rétabli.</>}
        </li>
        {contact && <li><strong>Accueil :</strong> {contact}</li>}
        <li>
          <Link href={"/espace/demandes/nouvelle?type=contact" as Route} className="font-medium underline underline-offset-4">
            Contacter la mairie
          </Link>{" "}
          pour une question urgente (message sans viser ce service).
        </li>
      </ul>
    </section>
  )
}

/** Version des formulaires : lit `?service=` et montre l’état de ce service en tête ; rien sans paramètre. */
export function ServiceStatusNoticeFromQuery({ context }: { context: ServiceNoticeContext }) {
  const serviceId = useSearchParams().get("service")
  const { data } = useListServicesQuery(undefined, { skip: !serviceId })
  const service = data && serviceId ? findService(data, serviceId) : null
  if (!service) return null
  return <div className="mb-6"><ServiceStatusNotice service={service} context={context} /></div>
}
