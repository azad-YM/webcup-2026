export type ItemStatus = "active" | "archived"

export type Item = {
  id: string
  name: string
  description: string
  status: ItemStatus
  createdAt: string
}

/** Same limits as the backend Example BC; the server stays authoritative. */
export const ITEM_NAME_MAX_LENGTH = 120
export const ITEM_DESCRIPTION_MAX_LENGTH = 1000

const normalizeName = (name: string): string => name.trim().toLocaleLowerCase("fr-FR")

export const isDuplicateItemName = (items: Item[], name: string, ignoredId?: string | null): boolean =>
  items.some((item) => item.id !== ignoredId && normalizeName(item.name) === normalizeName(name))

export const itemStatusLabel = (status: ItemStatus): string => status === "active" ? "Actif" : "Archivé"
