import { describe, expect, it } from "vitest"
import {
  difficultyLabel,
  difficultyOptions,
  filterRequests,
  formatCountdown,
  newRequestCodes,
  secondsUntilNextWave,
  waveLabel,
  waveOptions,
  type WebcupRequest,
  type WebcupSession,
} from "./webcup-feed"

const request = (code: string, wave: number | null, level: number | null): WebcupRequest => ({
  requestCode: code, requesterName: null, requesterType: null, messagePublic: null,
  difficulty: level === null ? "Inconnue" : null, difficultyLevel: level,
  xpBase: 100, xpTimeBonus: 0, xpTotal: 100, xpAvailable: 100, isInitial: wave === 0,
  waveNumber: wave, arrivalTime: null, groupName: null, isAiRequest: false, sortOrder: null,
})

const session = (overrides: Partial<WebcupSession> = {}): WebcupSession => ({
  status: "running", isRunning: true, currentWave: 3, elapsedMinutes: 281, visibleRequestsCount: 3,
  nextWaveNumber: 4, minutesUntilNextWave: 19, hasNextWave: true, requestsCount: 3, totalXpAvailable: 300,
  ...overrides,
})

const d01 = request("D01", 0, 1)
const f21 = request("F21", 1, 2)
const d18 = request("D18", 3, 3)
const requests = [d01, f21, d18]

describe("Webcup feed rules", () => {
  it("filters by wave and difficulty", () => {
    expect(filterRequests(requests, { wave: "all", difficulty: "all" })).toEqual(requests)
    expect(filterRequests(requests, { wave: "1", difficulty: "all" }).map(r => r.requestCode)).toEqual(["F21"])
    expect(filterRequests(requests, { wave: "all", difficulty: "3" }).map(r => r.requestCode)).toEqual(["D18"])
    expect(filterRequests(requests, { wave: "0", difficulty: "3" })).toEqual([])
  })

  it("derives the filter options from the feed", () => {
    expect(waveOptions([d18, d01, f21])).toEqual(["0", "1", "3"])
    expect(waveLabel("0")).toBe("Demandes initiales")
    expect(waveLabel("3")).toBe("Vague 3")
    expect(difficultyOptions(requests)).toEqual([{ value: "1", label: "Facile" }, { value: "2", label: "Moyenne" }, { value: "3", label: "Difficile" }])
    expect(difficultyLabel(request("X", 1, null))).toBe("Inconnue")
  })

  it("highlights only the codes absent from the previous visit", () => {
    expect([...newRequestCodes(requests, ["D01", "F21"])]).toEqual(["D18"])
    expect(newRequestCodes(requests, null).size).toBe(0)
  })

  it("counts down from the moment the server read the API", () => {
    const feed = { session: session(), fetchedAt: "2026-10-03T12:00:00Z" }
    expect(secondsUntilNextWave(feed, new Date("2026-10-03T12:00:00Z"))).toBe(19 * 60)
    expect(secondsUntilNextWave(feed, new Date("2026-10-03T12:18:30Z"))).toBe(30)
    expect(secondsUntilNextWave(feed, new Date("2026-10-03T13:00:00Z"))).toBe(0)
    expect(secondsUntilNextWave({ ...feed, session: session({ hasNextWave: false, minutesUntilNextWave: 0 }) }, new Date())).toBeNull()
    expect(formatCountdown(90)).toBe("01:30")
    expect(formatCountdown(3700)).toBe("1 h 01 min")
  })
})
