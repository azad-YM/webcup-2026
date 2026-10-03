export type AuthProfile = {
  name: string
  email: string
}

export type AuthSpace = {
  code: "admin" | "pilotage" | "requests"
  name: string
  description: string
}
