/** F71 : état du compte connecté (`GET /iam/me`) ; le changement de code passe par `AccountSecurityGateway`. */
export type AccountAccessStatus = { residentId: string | null; passwordChangeRequired: boolean }

export interface ResidentAccessGateway {
  accountStatus(token: string): Promise<AccountAccessStatus>
}
