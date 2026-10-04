/**
 * Client of the realtime SSE stream (`GET /api/realtime/stream`, ADR 004).
 *
 * - Public topics (`public.*`) need no account. Private topics need a ticket: `EventSource` cannot send the
 *   `Authorization` header and a JWT never goes in a URL, so the JWT is exchanged for a short-lived ticket
 *   (`POST /api/realtime/tickets`).
 * - The server closes each connection after ~20 s; the browser reconnects by itself and resumes from
 *   `Last-Event-ID`. When the server refuses the stream (expired ticket), a new ticket is fetched and the
 *   stream is reopened from the last received id.
 * - The data stays authoritative in the API: on an event, the screen reloads what changed (e.g. invalidates
 *   an RTK Query cache) and keeps a periodic refresh as a safety net.
 */

export type RealtimeMessage = {
  type: string
  id: string
  data: unknown
}

type EventSourceLike = {
  readyState: number
  onerror: ((event: Event) => void) | null
  onopen?: ((event: Event) => void) | null
  addEventListener(type: string, listener: (event: MessageEvent) => void): void
  close(): void
}

export type EventSourceFactory = (url: string) => EventSourceLike

export type RealtimeStreamOptions = {
  /** API base URL, e.g. `http://localhost:8083/api`. */
  apiBaseUrl: string
  /** Event names to listen to (SSE `event:` field). */
  eventTypes: readonly string[]
  onEvent: (message: RealtimeMessage) => void
  /** Returns a stream ticket for private topics, or null to listen to public topics only. */
  getTicket?: () => Promise<string | null>
  /** Delay before reopening a refused or broken stream. */
  reopenDelayMs?: number
  /** Injected in tests; defaults to the browser `EventSource`. */
  createEventSource?: EventSourceFactory
  /** F95 : the stream is open (`true`) or interrupted (`false`); lets screens space out their fallback polling. */
  onStatus?: (open: boolean) => void
}

export type RealtimeStream = { close(): void }

const CLOSED = 2

const defaultFactory: EventSourceFactory = (url) => new EventSource(url)

export function openRealtimeStream(options: RealtimeStreamOptions): RealtimeStream {
  const createEventSource = options.createEventSource ?? defaultFactory
  const reopenDelayMs = options.reopenDelayMs ?? 3000
  let source: EventSourceLike | null = null
  let lastEventId: string | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let closed = false
  // F78 (ADR 012) : après un refus (serveur saturé : 503, ticket expiré), la réouverture s’espace (doublement,
  // plafonné à 2 minutes) avec un délai aléatoire, pour que les onglets ne se reconnectent pas tous ensemble.
  let failures = 0

  const buildUrl = (ticket: string | null) => {
    const params = new URLSearchParams()
    if (ticket) params.set("ticket", ticket)
    if (lastEventId) params.set("lastEventId", lastEventId)
    const query = params.toString()
    return `${options.apiBaseUrl.replace(/\/$/, "")}/realtime/stream${query ? `?${query}` : ""}`
  }

  const scheduleReopen = () => {
    if (closed || timer) return
    const base = Math.min(120_000, reopenDelayMs * 2 ** Math.min(failures, 6))
    failures += 1
    timer = setTimeout(() => {
      timer = null
      void open()
    }, base + Math.round(Math.random() * base * 0.5))
  }

  const open = async () => {
    if (closed) return
    let ticket: string | null = null
    try {
      ticket = options.getTicket ? await options.getTicket() : null
    } catch {
      // Ticket service unavailable: fall back to public topics, retry later for private ones.
      ticket = null
    }
    if (closed) return
    const current = createEventSource(buildUrl(ticket))
    source = current
    current.onopen = () => {
      failures = 0
      options.onStatus?.(true)
    }
    for (const type of options.eventTypes) {
      current.addEventListener(type, (event: MessageEvent) => {
        if (event.lastEventId) lastEventId = event.lastEventId
        let data: unknown = event.data
        try {
          data = JSON.parse(event.data)
        } catch {
          /* Non-JSON data is passed as is. */
        }
        options.onEvent({ type, id: event.lastEventId, data })
      })
    }
    current.onerror = () => {
      options.onStatus?.(false)
      // CONNECTING: the browser reconnects by itself (normal end of a short connection).
      // CLOSED: the server refused the stream (e.g. expired ticket): reopen with a fresh ticket.
      if (current.readyState === CLOSED) {
        current.close()
        scheduleReopen()
      }
    }
  }

  void open()

  return {
    close() {
      closed = true
      if (timer) clearTimeout(timer)
      source?.close()
      options.onStatus?.(false)
    }
  }
}

/** Exchanges the session JWT for a stream ticket; null without session or when the API refuses it. */
export function createRealtimeTicketProvider(apiBaseUrl: string, getToken: () => string | null): () => Promise<string | null> {
  return async () => {
    const token = getToken()
    if (!token) return null
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/realtime/tickets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    })
    if (!response.ok) return null
    const body = (await response.json()) as { ticket?: string }
    return body.ticket ?? null
  }
}
