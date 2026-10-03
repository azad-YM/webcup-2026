import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { RequestFilter, RequestList, ServiceRequest, StatusChange } from "../../domain/service-request"
export const listRequests: UseCase<RequestFilter,RequestList> = (_dispatch,_state,dependencies,filter) => dependencies.requestGateway.list(filter)
export const changeRequestStatus: UseCase<StatusChange,ServiceRequest> = (_dispatch,_state,dependencies,change) => dependencies.requestGateway.change(change)
