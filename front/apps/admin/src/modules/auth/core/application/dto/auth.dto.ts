export type AuthProfile = {
  name: string
  email: string
}

export type AuthSpace = {
  code: "admin" | "pilotage"
  name: string
  description: string
}
