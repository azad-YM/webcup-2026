import type { OrientationReply, OrientParams } from "../../../domain/orientation"

/** Assistant d’orientation (BC Assistance) ; erreurs : `AppError` (429 si trop de messages en peu de temps). */
export interface OrientationGateway {
  orient(params: OrientParams): Promise<OrientationReply>
}
