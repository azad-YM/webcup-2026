import { RoleForm } from "../sections/role-form/role-form"

export function RolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rôles</h1>
        <p className="mt-1 text-muted-foreground">Gérez les habilitations des membres de l’administration.</p>
      </div>
      <RoleForm />
    </div>
  )
}
