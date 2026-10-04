import Link from "@/modules/shared/ui/link"
import type { Route } from "next"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import type { ServiceAvailability } from "../../core/domain/appointment"

const returnFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" })

const LABELS = { maintenance: "Service en maintenance", incident: "Service perturbé (incident)" } as const

/**
 * F63/F64 : état du service en tête du formulaire de rendez-vous, avec ce qui reste possible
 * (alternative, quand revenir, accueil, contacter la mairie). Contrat Citizen : `availability` de l'offre.
 */
export function ServiceAvailabilityNotice({ serviceName, availability }: { serviceName: string; availability: ServiceAvailability | null | undefined }) {
  if (!availability || availability.state === "available") return null
  const disabled = availability.state === "disabled"
  const contact = [availability.place, availability.hours, availability.phone].filter(Boolean).join(" · ")
  return (
    <section role="status" aria-label={`État du service ${serviceName}`} className={`rounded-xl border-l-4 p-5 ${disabled ? "border-red-700 bg-red-50 text-red-950" : "border-amber-500 bg-amber-50 text-amber-950"}`}>
      <StatusBadge
        tone={disabled || availability.status === "incident" ? "danger" : "warning"}
        size="md"
        label={disabled ? "Service désactivé" : LABELS[availability.status as keyof typeof LABELS] ?? "Service perturbé"}
        srPrefix={`État du service ${serviceName} :`}
      />
      <p className="mt-3 font-semibold">
        {disabled
          ? `Vous ne pouvez pas réserver de rendez-vous pour « ${serviceName} » pour le moment.`
          : `« ${serviceName} » fonctionne avec des difficultés : vous pouvez réserver, prévoyez un peu plus d’attente.`}
      </p>
      {availability.message && <p className="mt-2 whitespace-pre-line"><strong>Pourquoi :</strong> {availability.message}</p>}
      <ul className="mt-3 list-disc space-y-1 pl-6">
        {availability.alternative && <li className="whitespace-pre-line"><strong>En attendant :</strong> {availability.alternative}</li>}
        <li>
          <strong>Quand revenir :</strong>{" "}
          {availability.returnAt
            ? <>retour prévu le <time dateTime={availability.returnAt}>{returnFormat.format(new Date(availability.returnAt))}</time>.</>
            : "cette page se met à jour toute seule ; revenez un peu plus tard."}
        </li>
        {contact && <li><strong>Accueil :</strong> {contact}</li>}
        {disabled && (
          <li>
            <Link href={"/espace/demandes/nouvelle?type=contact" as Route} className="font-medium underline underline-offset-4">Contacter la mairie</Link>{" "}
            pour une question urgente. Vos rendez-vous déjà pris restent visibles ci-dessous et peuvent être annulés.
          </li>
        )}
      </ul>
    </section>
  )
}
