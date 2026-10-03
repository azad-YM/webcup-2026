export type AddMemberPayload = {
  name: string
  email: string
  password: string
  roleIds: string[]
}

export type AddMemberResult = {
  id: string
  userId: string
}
