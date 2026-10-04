export type AuthProfile = {
  name: string
  email: string
}

export type AuthSpace = {
  code: "admin" | "pilotage" | "requests" | "participation"
  name: string
  description: string
}
