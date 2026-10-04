import type { OfficialMessageReadGateway } from "../../../../application/ports/gateway/official-message-read.gateway"

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">

export const OFFICIAL_MESSAGES_READ_KEY = "nova-terra.official-messages.read"
const MAX_REMEMBERED = 100

/** « J’ai lu » mémorisé localement ; une mémoire indisponible laisse simplement le message affiché en entier. */
export class OfficialMessageReadLocalStorageGateway implements OfficialMessageReadGateway {
  constructor(private readonly storage: () => Storage | null = () => (typeof window === "undefined" ? null : window.localStorage)) {}

  async readIds(): Promise<string[]> {
    try {
      const value: unknown = JSON.parse(this.storage()?.getItem(OFFICIAL_MESSAGES_READ_KEY) ?? "[]")
      return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []
    } catch {
      return []
    }
  }

  async markRead(id: string): Promise<string[]> {
    const ids = [...(await this.readIds()).filter((item) => item !== id), id].slice(-MAX_REMEMBERED)
    try {
      this.storage()?.setItem(OFFICIAL_MESSAGES_READ_KEY, JSON.stringify(ids))
    } catch {
      // Navigation privée ou mémoire pleine : l’accusé vaut pour cette visite seulement.
    }
    return ids
  }
}
