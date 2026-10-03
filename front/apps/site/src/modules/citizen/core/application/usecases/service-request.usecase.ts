import { AppError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import { validateDraft, type RequestDraft, type ServiceRequest } from "../../domain/service-request"

const requireToken = (token: string | null) => {
  if (!token) throw new AppError(401, "Veuillez vous connecter.")
  return token
}

export const listMyRequests: UseCase<void, ServiceRequest[]> = async (dependencies) =>
  dependencies.serviceRequestGateway.listMine(requireToken(dependencies.citizenSessionProvider.getToken()))

export const getMyRequest: UseCase<string, ServiceRequest> = async (dependencies, reference) =>
  dependencies.serviceRequestGateway.getMine(requireToken(dependencies.citizenSessionProvider.getToken()), reference)

export const submitRequest: UseCase<RequestDraft, ServiceRequest> = async (dependencies, draft) => {
  const token = requireToken(dependencies.citizenSessionProvider.getToken())
  const [field, message] = Object.entries(validateDraft(draft))[0] ?? []
  if (message) throw new AppError(422, message, { field })
  return dependencies.serviceRequestGateway.submit(token, {
    type: draft.type,
    subject: draft.subject.trim(),
    description: draft.description.trim(),
    location: draft.location.trim(),
    serviceId: draft.serviceId,
    isPublic: draft.type === "report" && Boolean(draft.isPublic)
  })
}
