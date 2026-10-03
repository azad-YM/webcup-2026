import { AppError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import {
  hasNoErrors,
  normalizeDraft,
  validateProfile,
  type CitizenProfile,
  type CitizenProfileDraft
} from "../../domain/citizen-profile"
import { CitizenErrorCode } from "../ports/gateway/citizen.gateway"

const requireToken = (token: string | null) => {
  if (!token) throw new AppError(401, "Veuillez vous connecter.")
  return token
}

export const getMyProfile: UseCase<void, CitizenProfile> = async (dependencies) =>
  dependencies.citizenGateway.getMyProfile(requireToken(dependencies.citizenSessionProvider.getToken()))

export const updateMyProfile: UseCase<CitizenProfileDraft, CitizenProfile> = async (dependencies, draft) => {
  const token = requireToken(dependencies.citizenSessionProvider.getToken())
  const errors = validateProfile(draft)
  if (!hasNoErrors(errors)) {
    const [field, message] = Object.entries(errors)[0] ?? []
    throw new AppError(422, message ?? "Certaines informations ne sont pas acceptées.", { code: CitizenErrorCode.invalidPayload, field })
  }
  return dependencies.citizenGateway.updateMyProfile(token, normalizeDraft(draft))
}
