import type { TransportLine, TripHelp, TripRequest } from "../../../domain/transport"

/**
 * F97 : lignes de transport (Administration, `GET /administration/transport-lines`, public) et aide au trajet
 * (Assistance, `POST /assistance/transport`, limitée par adresse IP, suspendue en mode allégé du serveur).
 */
export interface TransportGateway {
  listLines(): Promise<TransportLine[]>
  findTrip(request: TripRequest): Promise<TripHelp>
}
