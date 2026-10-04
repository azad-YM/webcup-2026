import type { Publication } from "../../../domain/publication"

/** Publications de la ville (BC Communication, `GET /communication/publications`). */
export interface PublicationGateway {
  listPublications(): Promise<Publication[]>
}
