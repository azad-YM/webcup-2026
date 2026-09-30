export type AuthProfile = {
  name: string
  email: string
}

export type AuthSpace = {
  code: "admin" | "example"
  name: string
  description: string
}
