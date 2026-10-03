import type { Permission } from "../../../core/domain/permission"

const actions: Record<string, string> = {
  read: "Lire", write: "Créer / modifier", delete: "Supprimer",
  approve: "Approuver", reject: "Refuser", execute: "Exécuter",
}
const resources: Record<string, string> = {
  role: "Rôles", member: "Membres", "role-assignment": "Attribution des rôles",
  pilotage: "Flux Nova Terra (pilotage)",
}

export const permissionLabel = (permission: Permission): string =>
  `${actions[permission.action] ?? permission.action} — ${resources[permission.resource] ?? permission.resource}`

const normalize = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()

export const filterPermissions = (permissions: Permission[], search: string, context: string): Permission[] => {
  const terms = normalize(search).split(/\s+/).filter(Boolean)
  return permissions.filter(permission => {
    const text = normalize(`${permission.context}.${permission.resource}.${permission.action} ${permissionLabel(permission)}`)
    return (!context || permission.context === context) && terms.every(term => text.includes(term))
  })
}

export const permissionContexts = (permissions: Permission[]): string[] =>
  [...new Set(permissions.map(permission => permission.context))].sort()
