import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@boilerplate/shared-ui/components"
import { permissionKey } from "../../../core/domain/permission"
import { permissionLabel } from "./permission-options"
import { useRoleForm } from "./use-role-form"

export function RoleForm() {
  const form = useRoleForm()

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Créer un rôle</CardTitle>
        <CardDescription>Définissez les permissions de ce rôle dans l’administration.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.onSubmit} className="space-y-6">
          <fieldset disabled={form.creation.isLoading} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role-name">Nom du rôle</Label>
              <Input id="role-name" name="name" required value={form.name} onChange={event => form.setName(event.target.value)} placeholder="Ex. Gestionnaire des accès" />
            </div>
            <fieldset className="space-y-4" aria-describedby="role-permissions-description">
              <legend className="mb-2 font-medium">Permissions</legend>
              <p id="role-permissions-description" className="text-sm text-muted-foreground">Recherchez une permission ou filtrez par contexte. Les sélections sont conservées lorsque vous changez de filtre.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="permission-search">Rechercher une permission</Label>
                  <Input id="permission-search" type="search" value={form.search} onChange={event => form.setSearch(event.target.value)} placeholder="Nom, ressource, action…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permission-context">Contexte</Label>
                  <select id="permission-context" value={form.context} onChange={event => form.setContext(event.target.value)} className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">
                    <option value="">Tous les contextes</option>
                    {form.contexts.map(context => <option key={context} value={context}>{context}</option>)}
                  </select>
                </div>
              </div>
              {form.catalog.isFetching && <p role="status">Chargement des permissions…</p>}
              {form.catalogError ? (
                <div role="alert" className="space-y-2 text-sm text-destructive">
                  <p>{form.catalogError}</p>
                  <Button type="button" variant="outline" disabled={form.catalog.isFetching} onClick={() => void form.catalog.refetch()}>Réessayer</Button>
                </div>
              ) : form.catalog.isSuccess && !form.catalog.isFetching && (
                form.permissions.length === 0 ? <p role="status">Aucune permission n’est disponible dans cet espace.</p> : (
                  <>
                    <p role="status" className="text-sm text-muted-foreground">{form.selectedCount} permission(s) sélectionnée(s) · {form.visiblePermissions.length} affichée(s)</p>
                    {form.visiblePermissions.length === 0 ? <p>Aucune permission ne correspond à ces filtres.</p> : (
                      <ul className="max-h-96 divide-y overflow-y-auto rounded-lg border">
                        {form.visiblePermissions.map(permission => {
                          const key = permissionKey(permission)
                          return (
                            <li key={key}>
                              <label className="flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/50">
                                <input type="checkbox" checked={form.selectedKeys.includes(key)} onChange={() => form.togglePermission(key)} className="mt-1 size-4 accent-primary" />
                                <span className="min-w-0">
                                  <span className="block font-medium">{permissionLabel(permission)}</span>
                                  <span className="block break-words text-sm text-muted-foreground">{permission.context}.{permission.resource}.{permission.action}</span>
                                </span>
                              </label>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </>
                )
              )}
            </fieldset>
          </fieldset>
          {form.creationError && <p role="alert" className="text-sm text-destructive">{form.creationError}</p>}
          {form.success && <p role="status" className="text-sm text-green-700">{form.success}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!form.canSubmit}>{form.creation.isLoading ? "Création…" : "Créer le rôle"}</Button>
            <Button type="button" variant="outline" disabled={form.catalog.isFetching || form.creation.isLoading} onClick={() => void form.catalog.refetch()}>Actualiser les permissions</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
