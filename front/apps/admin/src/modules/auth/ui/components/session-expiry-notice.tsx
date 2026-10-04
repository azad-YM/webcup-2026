import { useEffect, useState } from "react"
import { Link } from "react-router"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import { useGetSessionExpiryQuery } from "../../core/application/rtk-api/auth"
import { minutesLeft, SESSION_WARNING_MS } from "../../core/domain/session-expiry"

/**
 * F69 : la session de l’espace de travail est courte (protection des données). L’agent est prévenu cinq minutes
 * avant l’expiration, avec un lien pour rouvrir une session sans perdre son contexte de navigation.
 */
export function SessionExpiryNotice() {
  const expiry = useGetSessionExpiryQuery(undefined, { pollingInterval: 60_000 })
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  const expiresAt = expiry.data
  if (!expiresAt || expiresAt - now > SESSION_WARNING_MS) return null
  const minutes = minutesLeft(expiresAt, now)
  return (
    <p role="status" className="flex flex-wrap items-center gap-2 text-sm">
      <StatusBadge tone={minutes === 0 ? "danger" : "warning"} label={minutes === 0 ? "Session expirée" : `Session : ${minutes} min restante${minutes > 1 ? "s" : ""}`} srPrefix="Sécurité :" />
      <Link to="/auth/start" className="font-medium text-teal-800 underline underline-offset-4">Rester connecté</Link>
    </p>
  )
}
