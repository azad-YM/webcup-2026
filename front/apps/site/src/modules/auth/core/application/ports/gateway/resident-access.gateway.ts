/** F71 : état du compte connecté (`GET /iam/me`) et changement du code provisoire (`POST /iam/me/password`). */
export type AccountAccessStatus = { residentId: string | null; passwordChangeRequired: boolean }

export interface ResidentAccessGateway {
  accountStatus(token: string): Promise<AccountAccessStatus>
  changePassword(token: string, payload: { currentPassword: string; newPassword: string }): Promise<void>
}
