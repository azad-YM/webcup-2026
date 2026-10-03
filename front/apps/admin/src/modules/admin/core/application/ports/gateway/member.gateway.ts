import type { AdminMember } from "../../../domain/member"
import type { AddMemberPayload, AddMemberResult } from "../../dto/add-member.dto"

export interface MemberGateway {
  list(): Promise<AdminMember[]>
  add(payload: AddMemberPayload): Promise<AddMemberResult>
}
