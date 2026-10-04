/** Action journal served by `GET /api/audit/entries` (BC Audit, ADR 006). */
export type AuditEntry = {
  id: string
  occurredAt: string
  actor: { id: string | null; label: string }
  action: string
  category: string
  target: { type: string; id: string | null }
  summary: string
  details: Record<string, unknown>
}

export type AuditJournal = {
  items: AuditEntry[]
  limit: number
  facets: { actions: string[]; actors: { id: string | null; label: string }[] }
}

export type AuditFilters = {
  actor: string
  action: string
  from: string
  to: string
  q: string
}

export const EMPTY_AUDIT_FILTERS: AuditFilters = { actor: "", action: "", from: "", to: "", q: "" }

export const ACTION_LABELS: Record<string, string> = {
  "administration.role.created": "Rôle créé",
  "administration.member.added": "Membre ajouté",
  "administration.service.created": "Service créé",
  "administration.service.updated": "Service modifié",
  "communication.alert.created": "Alerte créée (brouillon)",
  "communication.alert.updated": "Alerte modifiée",
  "communication.alert.published": "Alerte publiée",
  "communication.alert.withdrawn": "Alerte retirée",
  "communication.publication.created": "Publication créée (brouillon)",
  "communication.publication.updated": "Publication modifiée",
  "communication.publication.published": "Publication publiée",
  "communication.publication.withdrawn": "Publication retirée",
  "citizen.request.status_changed": "Statut d’une demande changé",
  "citizen.account.suspended": "Compte citoyen suspendu",
  "citizen.account.reactivated": "Compte citoyen réactivé",
  "citizen.account.deleted": "Compte citoyen supprimé",
  "iam.login.blocked": "Connexion bloquée",
  "pilotage.tracking.updated": "Suivi Webcup modifié",
  "audit.anomaly.protected": "Compte protégé automatiquement",
  "audit.anomaly.status_changed": "Suivi d’une anomalie",
}

export const CATEGORY_LABELS: Record<string, string> = {
  administration: "Administration",
  communication: "Communication",
  citizen: "Citoyens",
  iam: "Sécurité",
  pilotage: "Pilotage",
  audit: "Activité inhabituelle",
}

export const actionLabel = (action: string): string => ACTION_LABELS[action] ?? action

const DETAIL_LABELS: Record<string, string> = {
  previousState: "État précédent", state: "Nouvel état", previousStatus: "Statut précédent", status: "Statut",
  severity: "Gravité", audience: "Audience", district: "Quartier", important: "Importante", from: "Depuis", to: "Vers",
  reference: "Référence", roleIds: "Rôles", permissions: "Permissions", name: "Nom", userId: "Compte",
  scope: "Motif", ip: "Adresse IP", failures: "Échecs", lockedSeconds: "Verrouillage (s)", links: "Liens",
}

export const detailRows = (details: Record<string, unknown>): { label: string; value: string }[] =>
  Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({
      label: DETAIL_LABELS[key] ?? key,
      value: Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? (value ? "oui" : "non") : String(value),
    }))

/** Query string of the API; empty filters are omitted. */
export const auditQuery = (filters: AuditFilters): string => {
  const params = new URLSearchParams()
  if (filters.actor) params.set("actor", filters.actor)
  if (filters.action) params.set("action", filters.action)
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (filters.q.trim()) params.set("q", filters.q.trim())
  const query = params.toString()
  return query ? `?${query}` : ""
}
