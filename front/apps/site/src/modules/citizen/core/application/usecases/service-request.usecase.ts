import { AppError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import {
  MESSAGE_MAX,
  validateDraft,
  type ReceiptVerification,
  type RequestDraft,
  type RequestMessage,
  type RequestMessages,
  type RequestReceipt,
  type ServiceRequest
} from "../../domain/service-request"

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
    isPublic: draft.type === "report" && Boolean(draft.isPublic) && !draft.medicalEmergency,
    medicalEmergency: Boolean(draft.medicalEmergency),
    district: draft.district?.trim() || undefined
  })
}

export const listMyRequestMessages: UseCase<string, RequestMessages> = async (dependencies, reference) =>
  dependencies.serviceRequestGateway.listMessages(requireToken(dependencies.citizenSessionProvider.getToken()), reference)

export const postMyRequestMessage: UseCase<{ reference: string; body: string }, RequestMessage> = async (dependencies, { reference, body }) => {
  const token = requireToken(dependencies.citizenSessionProvider.getToken())
  const text = body.trim()
  if (!text) throw new AppError(422, "Écrivez votre message avant de l’envoyer.")
  if (text.length > MESSAGE_MAX) throw new AppError(422, `Votre message ne doit pas dépasser ${MESSAGE_MAX} caractères.`)
  return dependencies.serviceRequestGateway.postMessage(token, reference, text)
}

export const getMyRequestReceipt: UseCase<string, RequestReceipt> = async (dependencies, reference) =>
  dependencies.serviceRequestGateway.getReceipt(requireToken(dependencies.citizenSessionProvider.getToken()), reference)

export const verifyRequestReceipt: UseCase<{ reference: string; fingerprint: string }, ReceiptVerification> = async (dependencies, { reference, fingerprint }) => {
  if (!reference.trim() || !fingerprint.trim()) throw new AppError(422, "Indiquez la référence et l’empreinte figurant sur l’accusé.")
  return dependencies.serviceRequestGateway.verifyReceipt(reference.trim().toUpperCase(), fingerprint.trim().toUpperCase())
}
