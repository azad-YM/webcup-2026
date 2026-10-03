import { useEffect, useState } from "react"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import {
  useGetSeenRequestCodesQuery,
  useGetWebcupFeedQuery,
  useMarkRequestsSeenMutation,
  WEBCUP_FEED_POLLING_MS,
} from "../../../core/application/rtk-api/pilotage"
import {
  difficultyOptions,
  filterRequests,
  newRequestCodes,
  secondsUntilNextWave,
  waveOptions,
  type RequestFilters,
} from "../../../core/domain/webcup-feed"

const useNow = (intervalMs: number) => {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

export function useWebcupFeed() {
  const feed = useGetWebcupFeedQuery(undefined, {
    pollingInterval: WEBCUP_FEED_POLLING_MS,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: true,
  })
  // Re-read on each visit: the codes stored at that moment are the baseline of "new" requests.
  const seen = useGetSeenRequestCodesQuery(undefined, { refetchOnMountOrArgChange: true })
  const [markSeen] = useMarkRequestsSeenMutation()
  const [acknowledged, setAcknowledged] = useState<string[] | null>(null)
  const [filters, setFilters] = useState<RequestFilters>({ wave: "all", difficulty: "all" })
  const now = useNow(1000)

  const data = feed.data
  const requests = data?.requests ?? []
  const codesKey = requests.map(request => request.requestCode).join("|")

  useEffect(() => {
    if (!seen.isSuccess || codesKey === "") return
    const codes = codesKey.split("|")
    // First visit: the requests present now become the baseline, so later arrivals stand out.
    if (seen.data === null) setAcknowledged(previous => previous ?? codes)
    void markSeen(codes)
  }, [codesKey, seen.isSuccess, seen.data, markSeen])

  const baseline = acknowledged ?? (seen.isSuccess ? seen.data ?? null : null)
  const newCodes = newRequestCodes(requests, baseline)

  return {
    feed,
    data,
    filters,
    setWave: (wave: string) => setFilters(current => ({ ...current, wave })),
    setDifficulty: (difficulty: string) => setFilters(current => ({ ...current, difficulty })),
    waves: waveOptions(requests),
    difficulties: difficultyOptions(requests),
    visibleRequests: filterRequests(requests, filters),
    newCodes,
    acknowledgeAll: () => setAcknowledged(requests.map(request => request.requestCode)),
    countdown: data ? secondsUntilNextWave(data, now) : null,
    error: feed.error ? getErrorMessage(feed.error) : null,
  }
}
