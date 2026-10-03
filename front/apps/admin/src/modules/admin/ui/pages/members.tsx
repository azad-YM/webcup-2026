import { MemberForm } from "../sections/member-form/member-form"
import { MemberList } from "../sections/member-list/member-list"

export function MembersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Membres</h1>
        <p className="mt-1 text-muted-foreground">Agents et administrateurs de Nova Terra, et leurs rôles.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <MemberList />
        <MemberForm />
      </div>
    </div>
  )
}
