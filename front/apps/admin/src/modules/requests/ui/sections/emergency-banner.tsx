import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { TriangleAlert } from "@boilerplate/shared-ui/components/icon"
import { Button } from "@boilerplate/shared-ui/components"
import { useMarkEmergencyHandledMutation } from "../../core/application/rtk-api/requests"
import type { PendingEmergency } from "../../core/domain/service-request"

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" })

/**
 * F86 : bandeau persistant tant qu'une urgence médicale n'est pas prise en charge.
 * « Prise en charge » est horodatée et journalisée par l'API ; le bandeau disparaît pour tous les agents (temps réel).
 */
export function EmergencyBanner({ emergencies, canProcess, onOpen }: {
  emergencies: PendingEmergency[]
  canProcess: boolean
  onOpen: (id: string) => void
}) {
  const [markHandled, { isLoading, error, originalArgs }] = useMarkEmergencyHandledMutation()
  if (emergencies.length === 0) return null
  return (
    <section role="alert" aria-labelledby="emergency-title" className="space-y-3 rounded-2xl border-4 border-double border-red-700 bg-red-50 p-5 text-red-950">
      <h2 id="emergency-title" className="flex items-center gap-2 text-lg font-bold">
        <TriangleAlert className="size-6" aria-hidden="true" />
        {emergencies.length === 1 ? "1 urgence médicale à prendre en charge" : `${emergencies.length} urgences médicales à prendre en charge`}
      </h2>
      <p className="text-sm">L’habitant a été invité à appeler le 15 ou le 112. Prenez contact au plus vite et indiquez la prise en charge.</p>
      <ul className="space-y-2">
        {emergencies.map(item => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
            <span>
              <span className="font-mono text-sm">{item.reference}</span> · <span className="font-semibold">{item.subject}</span>
              <span className="block text-xs text-red-900">Reçue le <time dateTime={item.createdAt}>{dateTime.format(new Date(item.createdAt))}</time></span>
            </span>
            <span className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpen(item.id)}>Voir la demande</Button>
              {canProcess && (
                <Button type="button" variant="destructive" size="sm" disabled={isLoading} onClick={() => void markHandled(item.id)}>
                  {isLoading && originalArgs === item.id ? "Enregistrement…" : "Prise en charge"}
                </Button>
              )}
            </span>
          </li>
        ))}
      </ul>
      {error ? <p className="text-sm font-medium">{getErrorMessage(error)}</p> : null}
    </section>
  )
}
