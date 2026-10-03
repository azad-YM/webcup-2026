import { Link } from "react-router"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@boilerplate/shared-ui/components"
import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from "../../../core/domain/member"
import { useMemberForm } from "./use-member-form"

export function MemberForm() {
  const form = useMemberForm()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un membre</CardTitle>
        <CardDescription>Crée le compte de connexion de la personne et lui attribue ses rôles.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.onSubmit} className="space-y-6">
          <fieldset disabled={form.creation.isLoading} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Nom</Label>
              <Input id="member-name" name="name" required autoComplete="off" value={form.name} onChange={event => form.setName(event.target.value)} placeholder="Ex. Camille Martin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">E-mail</Label>
              <Input id="member-email" name="email" type="email" required autoComplete="off" value={form.email} onChange={event => form.setEmail(event.target.value)} placeholder="camille.martin@novaterra.example" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-password">Mot de passe initial</Label>
              <Input id="member-password" name="password" type="password" required autoComplete="new-password" aria-describedby="member-password-help" aria-invalid={form.password.length > 0 && !form.passwordValid} value={form.password} onChange={event => form.setPassword(event.target.value)} />
              <p id="member-password-help" className="text-sm text-muted-foreground">Entre {PASSWORD_MIN_LENGTH} et {PASSWORD_MAX_BYTES} caractères. Il n’est jamais réaffiché.</p>
            </div>
            <fieldset className="space-y-2">
              <legend className="mb-1 font-medium">Rôles</legend>
              {form.roles.isLoading || (form.roles.isFetching && !form.roles.currentData && !form.roles.isError) ? (
                <p role="status">Chargement des rôles…</p>
              ) : form.rolesError ? (
                <div role="alert" className="space-y-2 text-sm text-destructive">
                  <p>{form.rolesError}</p>
                  <Button type="button" variant="outline" disabled={form.roles.isFetching} onClick={() => void form.roles.refetch()}>Réessayer</Button>
                </div>
              ) : form.availableRoles.length === 0 ? (
                <p role="status" className="text-sm">Aucun rôle attribuable. <Link to="/admin/role" className="underline">Créer un rôle</Link></p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {form.availableRoles.map(role => (
                    <li key={role.id}>
                      <label className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/50">
                        <input type="checkbox" checked={form.selectedRoleIds.includes(role.id)} onChange={() => form.toggleRole(role.id)} className="mt-1 size-4 accent-primary" />
                        <span className="min-w-0">
                          <span className="block font-medium">{role.name}</span>
                          <span className="block text-sm text-muted-foreground">{role.permissions.length} permission(s)</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>
          </fieldset>
          {form.creationError && <p role="alert" className="text-sm text-destructive">{form.creationError}</p>}
          {form.success && <p role="status" className="text-sm text-green-700">{form.success}</p>}
          <Button type="submit" disabled={!form.canSubmit}>{form.creation.isLoading ? "Ajout…" : "Ajouter le membre"}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
