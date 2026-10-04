import { ALERT_KIND_LABELS, audienceLabel, formatDateTime, type CityAlert } from "./alert"
import { CRISIS_GUIDES, EMERGENCY_NUMBERS } from "./crisis-guides"
import { isDisrupted, PARTNER_CATEGORY, type MunicipalService } from "./municipal-service"
import { EMERGENCY_KINDS } from "./service-places"

/**
 * « L’essentiel » (F93, F94, F96) : ce qu’une personne doit pouvoir consulter pendant un incident —
 * alertes et consignes, numéros d’urgence, coordonnées des services — sous une forme courte,
 * lisible sur un petit écran et récupérable hors ligne (fichier texte).
 */
export type EssentialContact = {
  id: string
  name: string
  phone: string | null
  place: string
  hours: string
  /** Message de perturbation et alternative, si le service n’est pas disponible. */
  disruption: string | null
  emergency: boolean
}

/** Services d’urgence d’abord, puis les services municipaux joignables (téléphone ou lieu d’accueil). */
export function essentialContacts(services: MunicipalService[]): EssentialContact[] {
  const rank = (service: MunicipalService) => (service.emergency ? EMERGENCY_KINDS.indexOf(service.emergency) : 10)
  return services
    .filter((service) => service.category !== PARTNER_CATEGORY && !service.disabled && (service.emergency || service.contact.phone || service.contact.place))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "fr"))
    .map((service) => ({
      id: service.id,
      name: service.name,
      phone: service.contact.phone ?? null,
      place: service.location?.address || service.contact.place,
      hours: service.contact.hours,
      disruption: isDisrupted(service) ? [service.statusMessage, service.alternative && `En attendant : ${service.alternative}`].filter(Boolean).join(" ") : null,
      emergency: Boolean(service.emergency)
    }))
}

/** Version texte, à enregistrer sur l’appareil ou à imprimer : aucune mise en forme nécessaire pour la lire. */
export function essentialsText(alerts: CityAlert[], contacts: EssentialContact[], generatedAt: Date): string {
  const lines: string[] = [
    "NOVA TERRA — L’ESSENTIEL EN CAS D’INCIDENT",
    `Document enregistré le ${formatDateTime(generatedAt.toISOString())}. Les informations peuvent avoir changé depuis.`,
    "",
    "NUMÉROS D’URGENCE (gratuits, sans Internet)",
    ...EMERGENCY_NUMBERS.map((item) => `- ${item.number} : ${item.label}`),
    ""
  ]
  lines.push("ALERTES EN COURS")
  if (alerts.length === 0) lines.push("- Aucune alerte en cours au moment de l’enregistrement.")
  for (const alert of alerts) {
    lines.push(`- ${alert.title} (${alert.kind && alert.kind !== "general" ? `${ALERT_KIND_LABELS[alert.kind]}, ` : ""}${alert.area || audienceLabel(alert)}, jusqu’au ${formatDateTime(alert.endsAt)})`)
    lines.push(`  ${alert.message}`)
    for (const step of alert.recommendations) lines.push(`  * ${step}`)
  }
  lines.push("", "COORDONNÉES DES SERVICES")
  for (const contact of contacts) {
    lines.push(`- ${contact.name}${contact.phone ? ` — ${contact.phone}` : ""}`)
    if (contact.place) lines.push(`  ${contact.place}${contact.hours ? ` · ${contact.hours}` : ""}`)
    if (contact.disruption) lines.push(`  ! ${contact.disruption}`)
  }
  lines.push("", "QUE FAIRE EN CAS DE…")
  for (const guide of CRISIS_GUIDES) {
    lines.push(`${guide.title.toUpperCase()} — ${guide.summary}`)
    for (const step of guide.steps) lines.push(`  * ${step}`)
  }
  return lines.join("\n")
}
