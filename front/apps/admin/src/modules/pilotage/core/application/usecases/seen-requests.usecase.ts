import type { UseCase } from "@/modules/shared/core/config/use-cases"

/** Upper bound of remembered codes: the contest broadcasts a few dozen requests. */
export const MAX_SEEN_CODES = 500

export const getSeenRequestCodes: UseCase<void, string[] | null> = async (_dispatch, _getState, dependencies) =>
  dependencies.seenRequestsGateway.read()

/** Adds the codes to those already seen and returns the new list. */
export const markRequestsSeen: UseCase<string[], string[]> = async (_dispatch, _getState, dependencies, codes) => {
  const previous = (await dependencies.seenRequestsGateway.read()) ?? []
  const merged = [...new Set([...previous, ...codes])].slice(-MAX_SEEN_CODES)
  await dependencies.seenRequestsGateway.write(merged)
  return merged
}
