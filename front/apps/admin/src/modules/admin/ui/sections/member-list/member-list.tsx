import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@boilerplate/shared-ui/components"
import { useListMembersQuery } from "../../../core/application/rtk-api/access-management"

export function MemberList() {
  const members = useListMembersQuery()
  const list = members.currentData ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membres de l’administration</CardTitle>
        <CardDescription>Agents et administrateurs ayant accès à cet espace, avec leurs rôles.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.isLoading || (members.isFetching && !members.currentData && !members.isError) ? (
          <p role="status">Chargement des membres…</p>
        ) : members.isError ? (
          <div role="alert" className="space-y-2 text-sm text-destructive">
            <p>{getErrorMessage(members.error)}</p>
            <Button type="button" variant="outline" disabled={members.isFetching} onClick={() => void members.refetch()}>Réessayer</Button>
          </div>
        ) : list.length === 0 ? (
          <p role="status" className="text-sm text-muted-foreground">Aucun membre pour l’instant. Ajoutez le premier avec le formulaire.</p>
        ) : (
          <>
            <p role="status" className="text-sm text-muted-foreground">{list.length} membre(s){members.isFetching ? " · actualisation…" : ""}</p>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Nom</TableHead>
                    <TableHead scope="col">Rôles</TableHead>
                    <TableHead scope="col">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map(member => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>
                        {member.roles.length === 0 ? <span className="text-muted-foreground">Aucun rôle</span> : (
                          <ul className="flex flex-wrap gap-1">
                            {member.roles.map(role => <li key={role.id}><Badge variant="secondary">{role.name}</Badge></li>)}
                          </ul>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.active ? "outline" : "destructive"}>{member.active ? "Actif" : "Inactif"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
