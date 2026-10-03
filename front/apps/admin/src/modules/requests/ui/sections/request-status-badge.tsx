import { STATUS_LABELS, type RequestStatus } from "../../core/domain/service-request"

const TONES: Record<RequestStatus, string> = {
  submitted: "bg-amber-100 text-amber-900",
  acknowledged: "bg-sky-100 text-sky-900",
  in_progress: "bg-indigo-100 text-indigo-900",
  resolved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-red-100 text-red-900",
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[status]}`}>{STATUS_LABELS[status]}</span>
}
