import { formatDateTime, REQUEST_TYPE_LABELS, STATUS_LABELS, type ServiceRequest } from "./service-request"

/** F56 — en-têtes du fichier CSV, en français, dans l’ordre des colonnes. */
export const SUMMARY_CSV_HEADERS = [
  "Numéro de suivi",
  "Type",
  "Objet",
  "Lieu",
  "État",
  "Envoyée le",
  "Dernière mise à jour",
  "Étapes"
] as const

function csvCell(value: string): string {
  // Une cellule commençant par = + - @ serait interprétée comme une formule par un tableur.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, "\"\"")}"` : safe
}

/** Étapes lisibles sur une ligne : « Envoyée (4 octobre 2026 à 10:12) → Prise en charge (…) : commentaire ». */
export function stepsText(request: ServiceRequest): string {
  return request.steps
    .map((step) => `${STATUS_LABELS[step.status]} (${formatDateTime(step.at)})${step.comment ? ` : ${step.comment}` : ""}`)
    .join(" → ")
}

/**
 * CSV UTF-8 avec BOM (accents lisibles dans Excel), séparateur « ; » (réglage français des tableurs),
 * une ligne par demande, les plus récentes d’abord.
 */
export function requestsToCsv(requests: ServiceRequest[]): string {
  const rows = requests.map((request) => [
    request.reference,
    REQUEST_TYPE_LABELS[request.type],
    request.subject,
    request.location ?? "",
    STATUS_LABELS[request.status],
    formatDateTime(request.createdAt),
    formatDateTime(request.updatedAt),
    stepsText(request)
  ])
  return "﻿" + [SUMMARY_CSV_HEADERS as readonly string[], ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n") + "\r\n"
}
