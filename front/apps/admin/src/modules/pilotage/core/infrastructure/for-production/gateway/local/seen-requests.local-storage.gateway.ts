import type { SeenRequestsGateway } from "../../../../application/ports/gateway/seen-requests.gateway"

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">

export const SEEN_REQUESTS_STORAGE_KEY = "nova-terra.pilotage.seen-request-codes"

/** Browser memory of the request codes already displayed; a storage failure only disables the highlight. */
export class SeenRequestsLocalStorageGateway implements SeenRequestsGateway {
  constructor(private readonly storage: Storage = globalThis.localStorage) {}

  async read(): Promise<string[] | null> {
    try {
      const raw = this.storage.getItem(SEEN_REQUESTS_STORAGE_KEY)
      if (raw === null) return null
      const value: unknown = JSON.parse(raw)
      return Array.isArray(value) ? value.filter((code): code is string => typeof code === "string") : null
    } catch {
      return null
    }
  }

  async write(codes: string[]): Promise<void> {
    try {
      this.storage.setItem(SEEN_REQUESTS_STORAGE_KEY, JSON.stringify(codes))
    } catch {
      // Private browsing or full storage: the page keeps working without memory.
    }
  }
}
