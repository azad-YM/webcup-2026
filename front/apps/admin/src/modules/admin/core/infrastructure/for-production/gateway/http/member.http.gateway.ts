import type { AddMemberPayload, AddMemberResult } from "../../../../application/dto/add-member.dto"
import type { MemberGateway } from "../../../../application/ports/gateway/member.gateway"
import type { AdminMember } from "../../../../domain/member"
import { AccessManagementHttpClient } from "./access-management.http-client"

const MEMBER_REJECTED = "Le membre n’a pas été ajouté. Vérifiez que l’e-mail n’est pas déjà utilisé, que le mot de passe compte 8 à 72 caractères et que les rôles existent encore."

export class MemberHttpGateway extends AccessManagementHttpClient implements MemberGateway {
  list(): Promise<AdminMember[]> {
    return this.authorized(() => this.getAuth<AdminMember[]>("/administration/members"))
  }

  add(payload: AddMemberPayload): Promise<AddMemberResult> {
    return this.authorized(() => this.postAuth<AddMemberResult>("/administration/members", payload), MEMBER_REJECTED)
  }
}
