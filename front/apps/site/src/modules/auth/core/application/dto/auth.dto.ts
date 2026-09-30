export type LoginPayload = { email: string; password: string }
export type AuthToken = { token: string }
/** Codes returned by IAM `/iam/me/spaces`. Add a code here when a new application joins the SSO. */
export type SpaceCode = "admin"
export type AuthSpace = { code: SpaceCode; name: string; description: string; roles: string[] }
