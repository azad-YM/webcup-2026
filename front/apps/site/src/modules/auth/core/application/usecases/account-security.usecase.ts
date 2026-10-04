import { AuthError, type UseCase } from "@/modules/shared/core/lib/use-cases.decorator"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import type {
  AccountSecurity,
  ChangePasswordPayload,
  EmailVerificationPayload,
  ReconfirmationCode
} from "../dto/auth.dto"

function token(dependencies: Dependencies): string {
  const current = dependencies.authSessionGateway.getToken()
  if (!current) throw new AuthError(401, "Veuillez vous connecter.")
  return current
}

export const getAccountSecurity: UseCase<void, AccountSecurity> = (dependencies) =>
  dependencies.accountSecurityGateway.getSecurity(token(dependencies))

export const sendReconfirmationCode: UseCase<void, ReconfirmationCode> = (dependencies) =>
  dependencies.accountSecurityGateway.sendReconfirmationCode(token(dependencies))

export const setEmailVerification: UseCase<EmailVerificationPayload, { emailVerificationEnabled: boolean }> = (dependencies, payload) =>
  dependencies.accountSecurityGateway.setEmailVerification(token(dependencies), payload)

/** F54 : toutes les sessions sont fermées ; cet appareil reçoit une nouvelle session. */
export const reportDevice: UseCase<string, null> = async (dependencies, deviceId) => {
  const renewed = await dependencies.accountSecurityGateway.reportDevice(token(dependencies), deviceId)
  dependencies.authSessionGateway.saveToken(renewed.token)
  return null
}

export const changePassword: UseCase<ChangePasswordPayload, null> = async (dependencies, payload) => {
  const renewed = await dependencies.accountSecurityGateway.changePassword(token(dependencies), payload)
  dependencies.authSessionGateway.saveToken(renewed.token)
  return null
}
