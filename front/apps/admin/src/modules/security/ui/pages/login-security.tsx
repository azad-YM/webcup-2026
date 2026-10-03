import { useState, type FormEvent } from "react"
import { Button } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useLoginEventsQuery } from "../../core/application/rtk-api/security"
import { scopeLabel } from "../../core/domain/login-security-event"

function duration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60))
  return minutes >= 60 ? `${Math.round(minutes / 60)} h` : `${minutes} min`
}

export function LoginSecurityPage() {
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const query = useLoginEventsQuery(appliedSearch)
  function submit(event: FormEvent) { event.preventDefault(); setAppliedSearch(search.trim()) }
  return <section className="space-y-6 p-6">
    <div>
      <h1 className="text-2xl font-semibold">Journal de sécurité des connexions</h1>
      <p className="mt-2 text-muted-foreground">Chaque ligne correspond à un verrouillage temporaire déclenché par des échecs de connexion répétés. Le verrouillage s’allonge à chaque récidive (jusqu’à 1 h) ; les connexions normales ne sont pas affectées.</p>
    </div>
    <form role="search" onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className="block min-w-0 flex-1 basis-64">Filtrer par e-mail ou adresse IP<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 block w-full rounded-md border px-3 py-2" /></label>
      <Button type="submit" disabled={query.isFetching}>Filtrer</Button>
      <Button type="button" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Actualiser</Button>
    </form>
    {query.isLoading && <p role="status">Chargement du journal…</p>}
    {query.isError && <div role="alert"><p>{getErrorMessage(query.error)}</p><Button onClick={() => void query.refetch()} className="mt-3">Réessayer</Button></div>}
    {query.data && !query.isError && (query.data.items.length === 0
      ? <p role="status">Aucune tentative suspecte{appliedSearch ? ` pour « ${appliedSearch} »` : ""} sur les 90 derniers jours.</p>
      : <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm">
        <caption className="sr-only">Verrouillages temporaires de connexion, du plus récent au plus ancien</caption>
        <thead className="bg-muted/50"><tr><th scope="col" className="p-3">Date</th><th scope="col" className="p-3">Motif</th><th scope="col" className="p-3">Compte visé</th><th scope="col" className="p-3">Adresse IP</th><th scope="col" className="p-3">Échecs</th><th scope="col" className="p-3">Verrouillage</th></tr></thead>
        <tbody>{query.data.items.map((event) => <tr key={event.id} className="border-t">
          <td className="p-3">{new Date(event.occurredAt).toLocaleString("fr-FR")}</td>
          <td className="p-3">{scopeLabel[event.scope]}</td>
          <td className="p-3">{event.email ?? "Plusieurs comptes"}</td>
          <td className="p-3 font-mono">{event.ip}</td>
          <td className="p-3">{event.failures}</td>
          <td className="p-3">{duration(event.lockedSeconds)}</td>
        </tr>)}</tbody>
      </table></div>)}
  </section>
}
