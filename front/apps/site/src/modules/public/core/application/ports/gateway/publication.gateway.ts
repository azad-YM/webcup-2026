import type { Publication } from "../../../domain/publication"

/**
 * Publications de la ville.
 * Adaptateur actuel : LOCAL (contenu de démonstration). L’adaptateur HTTP vers
 * Administration sera branché au lot L3.
 */
export interface PublicationGateway {
  listPublications(): Promise<Publication[]>
}
