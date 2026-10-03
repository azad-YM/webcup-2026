import { useState, type FormEvent } from "react"
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useListPublicationsQuery, useSavePublicationMutation } from "../../core/application/rtk-api/content"
import { fromLines, newPublication, STATE_LABELS, toLines, type ContentState, type Publication } from "../../core/domain/content"
import { ListState, selectClass } from "../components/content-states"

function PublicationForm({ initial, onDone }: { initial: Publication; onDone: () => void }) {
  const [draft, setDraft] = useState(initial)
  const [body, setBody] = useState(fromLines(initial.body))
  const [save, saving] = useSavePublicationMutation()
  const [message, setMessage] = useState<string | null>(null)
  const submit = async (event: FormEvent, state: ContentState) => {
    event.preventDefault()
    setMessage(null)
    const result = await save({ ...draft, body: toLines(body), state })
    if ("data" in result && result.data) {
      setDraft(result.data)
      setMessage(state === "published" ? "Publication en ligne." : state === "withdrawn" ? "Publication retirée du site." : "Brouillon enregistré.")
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{draft.id ? "Modifier la publication" : "Nouvelle publication"}</CardTitle>
        <CardDescription>Actualité, annonce, changement de service ou information pratique. Une annonce importante est signalée dans l’espace de chaque citoyen.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void submit(event, draft.state === "published" ? "published" : "draft")} className="space-y-4">
          <fieldset disabled={saving.isLoading} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publication-title">Titre</Label>
              <Input id="publication-title" required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publication-category">Catégorie</Label>
              <Input id="publication-category" required maxLength={80} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Santé, Travaux, Vie municipale…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publication-summary">Résumé</Label>
              <Textarea id="publication-summary" required maxLength={1000} rows={2} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publication-body">Contenu</Label>
              <Textarea id="publication-body" required rows={8} aria-describedby="publication-body-help" value={body} onChange={(event) => setBody(event.target.value)} />
              <p id="publication-body-help" className="text-sm text-muted-foreground">Un paragraphe par ligne.</p>
            </div>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 size-4 accent-primary" checked={draft.important} onChange={(event) => setDraft({ ...draft, important: event.target.checked })} />
              <span><span className="block font-medium">Annonce importante</span><span className="block text-sm text-muted-foreground">Prévient les citoyens dans leurs notifications, en temps réel, à la publication.</span></span>
            </label>
          </fieldset>
          {saving.error !== undefined && <p role="alert" className="text-sm text-destructive">{getErrorMessage(saving.error)}</p>}
          {message && <p role="status" className="text-sm text-green-700">{message}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={saving.isLoading} onClick={(event) => void submit(event, "draft")}>Enregistrer en brouillon</Button>
            <Button type="button" disabled={saving.isLoading} onClick={(event) => void submit(event, "published")}>{draft.state === "published" ? "Mettre à jour" : "Publier"}</Button>
            {draft.state === "published" && <Button type="button" variant="destructive" disabled={saving.isLoading} onClick={(event) => void submit(event, "withdrawn")}>Retirer du site</Button>}
            <Button type="button" variant="ghost" onClick={onDone}>Fermer</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/** Publications de la ville (D06, F30). */
export function PublicationsPage() {
  const publications = useListPublicationsQuery()
  const [editing, setEditing] = useState<Publication | null>(null)
  const [filter, setFilter] = useState<ContentState | "">("")
  const items = (publications.data ?? []).filter((item) => !filter || item.state === filter)
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
      <section aria-labelledby="titre-publications" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 id="titre-publications" className="text-2xl font-semibold">Publications</h1>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="publication-filter">État</Label>
              <select id="publication-filter" className={selectClass} value={filter} onChange={(event) => setFilter(event.target.value as ContentState | "")}>
                <option value="">Tous</option>
                {Object.entries(STATE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <Button type="button" onClick={() => setEditing(newPublication())}>Nouvelle publication</Button>
          </div>
        </div>
        <ListState isLoading={publications.isLoading} error={publications.error} isEmpty={items.length === 0} emptyLabel="Aucune publication." onRetry={() => void publications.refetch()} retrying={publications.isFetching}>
          <ul className="divide-y rounded-lg border bg-white">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.category}{item.publishedAt ? ` · publiée le ${new Date(item.publishedAt).toLocaleDateString("fr-FR")}` : ""}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge variant={item.state === "published" ? "default" : "secondary"}>{STATE_LABELS[item.state]}</Badge>
                    {item.important && <Badge variant="destructive">Importante</Badge>}
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(item)}>Modifier</Button>
              </li>
            ))}
          </ul>
        </ListState>
      </section>
      <div>
        {editing
          ? <PublicationForm key={editing.id ?? "nouvelle"} initial={editing} onDone={() => setEditing(null)} />
          : <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Choisissez une publication à modifier ou créez-en une.</p>}
      </div>
    </div>
  )
}
