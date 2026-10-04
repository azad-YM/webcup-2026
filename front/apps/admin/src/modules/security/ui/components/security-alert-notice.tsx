import { useEffect, useState } from "react"
import { Link } from "react-router"
import { ShieldAlert } from "@boilerplate/shared-ui/components/icon"
import { useDependencies } from "@/modules/shared/ui/context/dependencies.context"
import { SECURITY_EVENTS } from "../../core/domain/operations"

/**
 * F85 : alerte en direct d'une nouvelle anomalie grave (topic `administration.security`, réservé par le serveur
 * aux membres `admin.security.read`). Compteur dans l'en-tête, annoncé aux lecteurs d'écran, lien vers l'écran.
 */
export function SecurityAlertNotice() {
  const { realtime } = useDependencies()
  const [alerts, setAlerts] = useState<{ count: number; title: string }>({ count: 0, title: "" })
  useEffect(() => realtime.subscribe(SECURITY_EVENTS, (notification) => {
    const data = notification.data as { title?: string } | null
    setAlerts((current) => ({ count: current.count + 1, title: data?.title ?? current.title }))
  }), [realtime])
  return (
    <div role="status" aria-live="assertive" className="empty:hidden">
      {alerts.count > 0 && (
        <Link
          to="/admin/activite-inhabituelle"
          onClick={() => setAlerts({ count: 0, title: "" })}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-red-700 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-950 hover:bg-red-100"
        >
          <ShieldAlert className="size-4" aria-hidden="true" />
          {alerts.count === 1 ? `Alerte de sécurité grave : ${alerts.title}` : `${alerts.count} alertes de sécurité graves`}
        </Link>
      )}
    </div>
  )
}
