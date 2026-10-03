import { AppError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { RequestDraft, RequestFilter, RequestList, ServiceRequest } from "../../domain/service-request"
const requireToken = (token: string | null) => { if (!token) throw new AppError(401, "Connectez-vous pour continuer."); return token }
export const listRequests: UseCase<RequestFilter, RequestList> = (dependencies, filter) => dependencies.serviceRequestGateway.list(requireToken(dependencies.citizenSessionProvider.getToken()), filter)
export const submitRequest: UseCase<RequestDraft, ServiceRequest> = (dependencies, draft) => dependencies.serviceRequestGateway.submit(requireToken(dependencies.citizenSessionProvider.getToken()), draft)
