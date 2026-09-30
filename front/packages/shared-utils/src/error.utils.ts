export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message

  if (error && typeof error === "object") {
    const directData = (error as { data?: unknown }).data
    if (typeof directData === "string") return directData

    const data = (error as { error?: unknown }).error
    if (typeof data === "string") return data
    if (data && typeof data === "object") {
      const nested = (data as { data?: unknown }).data
      if (typeof nested === "string") return nested
      try {
        return JSON.stringify(data)
      } catch {
        return String(data)
      }
    }

    const message = (error as { message?: unknown }).message
    if (typeof message === "string") return message
  }

  return String(error)
}
