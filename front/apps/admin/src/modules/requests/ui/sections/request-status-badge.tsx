import { StatusBadge, type StatusTone } from "@boilerplate/shared-ui/components/a11y"
import { PRIORITY_LABELS, STATUS_LABELS, type RequestPriority, type RequestStatus } from "../../core/domain/service-request"

/** Icône + libellé + bordure par état : jamais la couleur seule (F43). */
const TONES: Record<RequestStatus, StatusTone> = {
  submitted: "pending",
  acknowledged: "info",
  in_progress: "progress",
  resolved: "success",
  rejected: "danger",
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <StatusBadge tone={TONES[status]} label={STATUS_LABELS[status]} srPrefix="État :" />
}

const PRIORITY_TONES: Record<RequestPriority, StatusTone> = {
  urgent: "danger",
  high: "warning",
  normal: "neutral",
  low: "info",
}

/** F80 : priorité avec icône et libellé, jamais la couleur seule. */
export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  return <StatusBadge tone={PRIORITY_TONES[priority]} label={`Priorité ${PRIORITY_LABELS[priority].toLowerCase()}`} />
}

/** F86 : marque d'une urgence médicale (icône + texte). */
export function MedicalEmergencyBadge({ handled }: { handled: boolean }) {
  return <StatusBadge tone={handled ? "success" : "danger"} label={handled ? "Urgence médicale prise en charge" : "Urgence médicale"} />
}
