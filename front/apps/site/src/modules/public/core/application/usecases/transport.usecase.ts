import type { UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { TransportLine, TripHelp, TripRequest } from "../../domain/transport"

export const listTransportLines: UseCase<void, TransportLine[]> = (dependencies) => dependencies.transportGateway.listLines()

export const findTrip: UseCase<TripRequest, TripHelp> = (dependencies, request) => dependencies.transportGateway.findTrip(request)
