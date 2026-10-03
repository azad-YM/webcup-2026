import { StatusBadge, type StatusTone } from "@boilerplate/shared-ui/components/a11y"
import { STATUS_LABELS, type RequestStatus } from "../../core/domain/service-request"

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
