import { AppError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"

export const deleteMyAccount: UseCase<string, { deleted: boolean }> = async (dependencies, password) => {
  const token = dependencies.citizenSessionProvider.getToken()
  if (!token) throw new AppError(401, "Veuillez vous connecter.")
  if (!password) throw new AppError(422, "Saisissez votre mot de passe pour confirmer.")
  return dependencies.citizenGateway.deleteMyAccount(token, password)
}
