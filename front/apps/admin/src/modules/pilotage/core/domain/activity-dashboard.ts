/** Key figures served by `GET /api/pilotage/activity` (F50). Each block comes from its owner BC. */
export type ActivityDashboard = {
  generatedAt: string
  recentHours: number
  requests: {
    byStatus: Record<string, number>
    waiting: number
    open: number
    recent: number
    oldestWaitingSince: string | null
  }
  citizens: { active: number; suspended: number; recent: number }
  communication: {
    activeAlerts: number
    criticalAlerts: number
    scheduledAlerts: number
    publishedPublications: number
    draftPublications: number
  }
  security: { suspendedAccounts: number; blockedLogins: number }
  administration: { activeMembers: number; services: number; disruptedServices: number }
}

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  submitted: "Reçues, à prendre en charge",
  acknowledged: "Prises en charge",
  in_progress: "En cours de traitement",
  resolved: "Résolues",
  rejected: "Refusées",
}

/** "depuis 3 h", "depuis 2 j" — age of the oldest waiting request. */
export const waitingAge = (since: string | null, now: Date): string | null => {
  if (!since) return null
  const minutes = Math.max(0, Math.round((now.getTime() - Date.parse(since)) / 60_000))
  if (Number.isNaN(minutes)) return null
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  return hours < 48 ? `${hours} h` : `${Math.round(hours / 24)} j`
}
