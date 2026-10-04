import { afterEach, describe, expect, it, vi } from "vitest"
import { WebcupFeedHttpGateway } from "./webcup-feed.http.gateway"
import { SeenRequestsLocalStorageGateway, SEEN_REQUESTS_STORAGE_KEY } from "../local/seen-requests.local-storage.gateway"
import { AuthPilotageSessionProvider } from "@/modules/auth/core/infrastructure/adapter/pilotage/auth-pilotage-session.provider"
import { createStore } from "@/modules/shared/core/config/store"
import { sessionCleared } from "@/modules/shared/core/config/session"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import { pilotageApi } from "../../../../application/rtk-api/pilotage"

const feed = {
  session: { status: "running", isRunning: true, currentWave: 1, elapsedMinutes: 130, visibleRequestsCount: 1, nextWaveNumber: 2, minutesUntilNextWave: 50, hasNextWave: true, requestsCount: 1, totalXpAvailable: 250 },
  requests: [{ requestCode: "D01", requesterName: "Mairie", requesterType: null, messagePublic: "Besoin", difficulty: "Facile", difficultyLevel: 1, xpBase: 250, xpTimeBonus: 0, xpTotal: 250, xpAvailable: 250, isInitial: true, waveNumber: 0, arrivalTime: "00:00:00", groupName: null, isAiRequest: false, sortOrder: 1 }],
  fetchedAt: "2026-10-03T12:00:00+00:00",
}

const memoryStorage = () => {
  const values = new Map<string, string>()
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value), values }
}

const setup = () => {
  const sessions = { getToken: vi.fn((): string | null => "session-token"), clear: vi.fn(), saveToken: vi.fn() }
  const onInvalidated = vi.fn()
  const storage = memoryStorage()
  return {
    sessions, onInvalidated, storage,
    webcupFeedGateway: new WebcupFeedHttpGateway("https://api.example.test/api", new AuthPilotageSessionProvider(sessions, onInvalidated)),
    seenRequestsGateway: new SeenRequestsLocalStorageGateway(storage),
  }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

afterEach(() => vi.unstubAllGlobals())

describe("Pilotage HTTP contract", () => {
  it("loads the feed through RTK Query with the admin session and clears it on session change", async () => {
    const gateways = setup()
    const fetch = vi.fn().mockResolvedValue(json(feed))
    vi.stubGlobal("fetch", fetch)
    const store = createStore({ dependencies: gateways as unknown as Dependencies })
    const query = store.dispatch(pilotageApi.endpoints.getWebcupFeed.initiate())
    await expect(query.unwrap()).resolves.toEqual(feed)
    expect(fetch).toHaveBeenCalledWith("https://api.example.test/api/pilotage/webcup-feed", expect.objectContaining({ method: "GET", headers: { Authorization: "Bearer session-token" } }))
    store.dispatch(sessionCleared())
    expect(pilotageApi.endpoints.getWebcupFeed.select()(store.getState()).data).toBeUndefined()
    query.unsubscribe()
  })

  it.each([
    [403, {}, "forbidden", "Agent municipal"],
    [503, { code: "webcup_api_key_missing" }, "key-missing", "WEBCUP_API_KEY"],
    [502, { code: "webcup_api_key_rejected" }, "key-rejected", "refusée"],
    [502, { code: "webcup_feed_unavailable" }, "upstream-unavailable", "ne répond pas"],
    [500, {}, "unavailable", "indisponible"],
  ])("explains HTTP %s without disconnecting", async (status, body, kind, text) => {
    const gateways = setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(body, status)))
    await expect(gateways.webcupFeedGateway.fetchFeed()).rejects.toMatchObject({ kind, message: expect.stringContaining(text) })
    expect(gateways.sessions.clear).not.toHaveBeenCalled()
  })

  it("invalidates the session on 401", async () => {
    const gateways = setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, 401)))
    await expect(gateways.webcupFeedGateway.fetchFeed()).rejects.toMatchObject({ kind: "unauthenticated" })
    expect(gateways.sessions.clear).toHaveBeenCalledOnce()
    expect(gateways.onInvalidated).toHaveBeenCalledOnce()
  })

  it("keeps the session on network failures", async () => {
    const gateways = setup()
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))
    await expect(gateways.webcupFeedGateway.fetchFeed()).rejects.toMatchObject({ kind: "unavailable" })
    expect(gateways.sessions.clear).not.toHaveBeenCalled()
  })
})

describe("Seen request codes", () => {
  it("remembers the codes through the local gateway and merges them", async () => {
    const gateways = setup()
    const store = createStore({ dependencies: gateways as unknown as Dependencies })
    await expect(store.dispatch(pilotageApi.endpoints.getSeenRequestCodes.initiate()).unwrap()).resolves.toBeNull()
    await store.dispatch(pilotageApi.endpoints.markRequestsSeen.initiate(["D01", "F21"])).unwrap()
    await expect(store.dispatch(pilotageApi.endpoints.markRequestsSeen.initiate(["F21", "D18"])).unwrap()).resolves.toEqual(["D01", "F21", "D18"])
    expect(JSON.parse(gateways.storage.values.get(SEEN_REQUESTS_STORAGE_KEY) ?? "null")).toEqual(["D01", "F21", "D18"])
  })

  it("ignores unreadable storage", async () => {
    const storage = memoryStorage()
    storage.setItem(SEEN_REQUESTS_STORAGE_KEY, "{not json")
    await expect(new SeenRequestsLocalStorageGateway(storage).read()).resolves.toBeNull()
    const broken = { getItem: () => { throw new Error("denied") }, setItem: () => { throw new Error("denied") } }
    await expect(new SeenRequestsLocalStorageGateway(broken).read()).resolves.toBeNull()
    await expect(new SeenRequestsLocalStorageGateway(broken).write(["D01"])).resolves.toBeUndefined()
  })
})
