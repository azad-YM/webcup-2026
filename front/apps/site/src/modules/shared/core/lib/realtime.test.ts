import { afterEach, describe, expect, it, vi } from "vitest"
import { createRealtimeTicketProvider, openRealtimeStream, type EventSourceFactory } from "@boilerplate/shared-utils/realtime"

type Listener = (event: MessageEvent) => void

class FakeEventSource {
  readyState = 0
  onerror: ((event: Event) => void) | null = null
  closed = false
  readonly listeners = new Map<string, Listener[]>()
  constructor(readonly url: string) {}
  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener])
  }
  emit(type: string, data: string, lastEventId: string) {
    for (const listener of this.listeners.get(type) ?? []) listener({ data, lastEventId } as MessageEvent)
  }
  fail(readyState: number) {
    this.readyState = readyState
    this.onerror?.(new Event("error"))
  }
  close() {
    this.closed = true
  }
}

function harness() {
  const sources: FakeEventSource[] = []
  const factory: EventSourceFactory = (url) => {
    const source = new FakeEventSource(url)
    sources.push(source)
    return source
  }
  return { sources, factory }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("Flux temps réel (SSE)", () => {
  it("écoute les topics publics sans ticket et décode le JSON", async () => {
    const { sources, factory } = harness()
    const received: unknown[] = []
    openRealtimeStream({ apiBaseUrl: "http://api.test/api/", eventTypes: ["alert.published"], onEvent: (m) => received.push(m), createEventSource: factory })
    await flush()

    expect(sources[0].url).toBe("http://api.test/api/realtime/stream")
    sources[0].emit("alert.published", "{\"alertId\":\"a1\"}", "12")
    expect(received).toEqual([{ type: "alert.published", id: "12", data: { alertId: "a1" } }])
  })

  it("passe le ticket dans l’URL, jamais le JWT", async () => {
    const { sources, factory } = harness()
    openRealtimeStream({ apiBaseUrl: "http://api.test/api", eventTypes: [], onEvent: () => {}, getTicket: async () => "ticket-1", createEventSource: factory })
    await flush()

    expect(sources[0].url).toBe("http://api.test/api/realtime/stream?ticket=ticket-1")
  })

  it("rouvre un flux refusé avec un nouveau ticket et le dernier identifiant reçu", async () => {
    vi.useFakeTimers()
    const { sources, factory } = harness()
    const tickets = ["t1", "t2"]
    openRealtimeStream({ apiBaseUrl: "http://api.test/api", eventTypes: ["x.y"], onEvent: () => {}, getTicket: async () => tickets.shift() ?? null, reopenDelayMs: 1000, createEventSource: factory })
    await vi.advanceTimersByTimeAsync(0)
    sources[0].emit("x.y", "{}", "41")

    sources[0].fail(2)
    await vi.advanceTimersByTimeAsync(1000)

    expect(sources[0].closed).toBe(true)
    expect(sources[1].url).toBe("http://api.test/api/realtime/stream?ticket=t2&lastEventId=41")
  })

  it("laisse le navigateur se reconnecter seul à la fin normale d’une connexion", async () => {
    vi.useFakeTimers()
    const { sources, factory } = harness()
    openRealtimeStream({ apiBaseUrl: "http://api.test/api", eventTypes: [], onEvent: () => {}, createEventSource: factory })
    await vi.advanceTimersByTimeAsync(0)

    sources[0].fail(0)
    await vi.advanceTimersByTimeAsync(10_000)

    expect(sources).toHaveLength(1)
  })

  it("arrête tout à la fermeture", async () => {
    const { sources, factory } = harness()
    const stream = openRealtimeStream({ apiBaseUrl: "http://api.test/api", eventTypes: [], onEvent: () => {}, createEventSource: factory })
    await flush()
    stream.close()

    expect(sources[0].closed).toBe(true)
  })

  it("échange le JWT contre un ticket, ou rien sans session", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ticket: "t" }), { status: 200 }))
    vi.stubGlobal("fetch", fetch)

    await expect(createRealtimeTicketProvider("http://api.test/api", () => "jwt")()).resolves.toBe("t")
    expect(fetch).toHaveBeenCalledWith("http://api.test/api/realtime/tickets", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer jwt" }) }))
    await expect(createRealtimeTicketProvider("http://api.test/api", () => null)()).resolves.toBeNull()
  })
})
