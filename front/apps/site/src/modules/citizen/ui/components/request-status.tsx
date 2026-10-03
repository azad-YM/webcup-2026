import { CheckCircle2, Circle } from "@boilerplate/shared-ui/components/icon"
import { formatDateTime, STATUS_LABELS, STATUS_TONES, type RequestStatus, type RequestStep } from "../../core/domain/service-request"

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_TONES[status]}`}>{STATUS_LABELS[status]}</span>
}

/** Chronologie des étapes déjà réalisées (D11), la plus ancienne d'abord. */
export function RequestTimeline({ steps }: { steps: RequestStep[] }) {
  return (
    <ol className="space-y-5 border-l-2 border-teal-200 pl-6">
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        const Icon = last ? Circle : CheckCircle2
        return (
          <li key={`${step.status}-${step.at}`} className="relative">
            <Icon className="absolute -left-[2.15rem] top-0.5 size-5 rounded-full bg-white text-teal-700" aria-hidden="true" />
            <p className="font-semibold text-slate-950">{STATUS_LABELS[step.status]}{last && <span className="sr-only"> (étape actuelle)</span>}</p>
            <p className="text-sm text-slate-600"><time dateTime={step.at}>{formatDateTime(step.at)}</time></p>
            {step.comment && (
              <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-slate-800">
                <span className="font-medium">{step.status === "rejected" ? "Motif : " : "Message de la mairie : "}</span>{step.comment}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
