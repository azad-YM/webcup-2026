/**
 * Publication de la ville (actualité). Propriétaire : Administration (lot L3).
 */
export type Publication = {
  id: string
  title: string
  category: string
  summary: string
  body: string[]
  /** Date ISO 8601. */
  publishedAt: string
}

export const sortByMostRecent = (publications: Publication[]) =>
  [...publications].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))

export const latestPublications = (publications: Publication[], limit = 3) =>
  sortByMostRecent(publications).slice(0, limit)

export const findPublication = (publications: Publication[], id: string | null | undefined) =>
  publications.find((publication) => publication.id === id) ?? null

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" })

export const formatPublicationDate = (iso: string) => dateFormat.format(new Date(iso))
