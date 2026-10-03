import { useState } from "react"
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useListServicesQuery, useSaveServiceMutation } from "../../core/application/rtk-api/content"
import {
  fromLines,
  fromLocalInput,
  newService,
  SERVICE_CATEGORIES,
  SERVICE_STATUS_LABELS,
  toLines,
  toLocalInput,
  type MunicipalService,
  type ServiceCategory,
  type ServiceStatus,
} from "../../core/domain/content"
import { ListState, selectClass } from "../components/content-states"

const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/

function ServiceForm({ initial, isNew, onDone }: { initial: MunicipalService; isNew: boolean; onDone: () => void }) {
  const [draft, setDraft] = useState(initial)
  const [actions, setActions] = useState(fromLines(initial.actions))
  const [keywords, setKeywords] = useState(initial.keywords.join(", "))
  const [save, saving] = useSaveServiceMutation()
  const [message, setMessage] = useState<string | null>(null)
  const disrupted = draft.status !== "available"
  const slugInvalid = isNew && draft.id !== "" && !SLUG.test(draft.id)
  const submit = async () => {
    setMessage(null)
    const result = await save({
      ...draft,
      actions: toLines(actions),
      keywords: keywords.split(/[,\n]/).map((keyword) => keyword.trim()).filter(Boolean),
      contact: { ...draft.contact, phone: draft.contact.phone?.trim() || null },
      transport: draft.category === "mobilite" ? draft.transport : null,
    })
    if ("data" in result && result.data) {
      setDraft(result.data)
      setMessage("Service enregistré : la fiche du site est à jour.")
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNew ? "Nouveau service" : `Modifier « ${initial.name} »`}</CardTitle>
        <CardDescription>Fiche publique du service, son état (maintenance, incident) et, pour la mobilité, les horaires des transports.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => { event.preventDefault(); void submit() }} className="space-y-6">
          <fieldset disabled={saving.isLoading} className="space-y-4">
            <legend className="font-semibold">Fiche</legend>
            {isNew && (
              <div className="space-y-2">
                <Label htmlFor="service-id">Identifiant</Label>
                <Input id="service-id" required aria-invalid={slugInvalid} aria-describedby="service-id-help" value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} placeholder="ex. bibliotheque" />
                <p id="service-id-help" className="text-sm text-muted-foreground">Minuscules, chiffres et tirets ; utilisé dans l’adresse de la fiche, non modifiable ensuite.</p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-name">Nom</Label>
                <Input id="service-name" required maxLength={200} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-category">Thème</Label>
                <select id="service-category" className={selectClass} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as ServiceCategory })}>
                  {Object.entries(SERVICE_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-summary">Résumé</Label>
              <Textarea id="service-summary" required maxLength={1000} rows={2} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-description">Description</Label>
              <Textarea id="service-description" required rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-actions">Ce que l’on peut faire</Label>
              <Textarea id="service-actions" required rows={4} aria-describedby="service-actions-help" value={actions} onChange={(event) => setActions(event.target.value)} />
              <p id="service-actions-help" className="text-sm text-muted-foreground">Une démarche par ligne.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-keywords">Mots-clés de recherche</Label>
              <Input id="service-keywords" value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="acte, naissance, papiers" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="service-place">Lieu</Label>
                <Input id="service-place" required value={draft.contact.place} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, place: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-hours">Horaires d’accueil</Label>
                <Input id="service-hours" required value={draft.contact.hours} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, hours: event.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-phone">Téléphone</Label>
                <Input id="service-phone" type="tel" value={draft.contact.phone ?? ""} onChange={(event) => setDraft({ ...draft, contact: { ...draft.contact, phone: event.target.value } })} />
              </div>
            </div>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 size-4 accent-primary" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} />
              <span><span className="block font-medium">Mettre en avant</span><span className="block text-sm text-muted-foreground">Affiché dans « Services les plus demandés » sur l’accueil.</span></span>
            </label>
          </fieldset>

          <fieldset disabled={saving.isLoading} className="space-y-4">
            <legend className="font-semibold">État du service</legend>
            <div className="space-y-2">
              <Label htmlFor="service-status">État</Label>
              <select id="service-status" className={selectClass} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ServiceStatus })}>
                {Object.entries(SERVICE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            {disrupted && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="service-status-message">Message aux habitants</Label>
                  <Textarea id="service-status-message" required rows={3} value={draft.statusMessage} onChange={(event) => setDraft({ ...draft, statusMessage: event.target.value })} placeholder="Ex. Le guichet est fermé pour une panne informatique." />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="service-return">Retour prévu (facultatif)</Label>
                    <Input id="service-return" type="datetime-local" value={draft.returnAt ? toLocalInput(draft.returnAt) : ""} onChange={(event) => setDraft({ ...draft, returnAt: event.target.value ? fromLocalInput(event.target.value) : null })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-alternative">En attendant (facultatif)</Label>
                    <Input id="service-alternative" value={draft.alternative} onChange={(event) => setDraft({ ...draft, alternative: event.target.value })} placeholder="Ex. Guichet 2 de l’hôtel de ville" />
                  </div>
                </div>
              </>
            )}
          </fieldset>

          {draft.category === "mobilite" && (
            <fieldset disabled={saving.isLoading} className="space-y-4">
              <legend className="font-semibold">Horaires des transports</legend>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="size-4 accent-primary" checked={draft.transport !== null} onChange={(event) => setDraft({ ...draft, transport: event.target.checked ? { route: "", timetable: "", information: "" } : null })} />
                <span>Afficher les horaires et informations de transport sur la fiche</span>
              </label>
              {draft.transport && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="transport-route">Lignes et trajets</Label>
                    <Textarea id="transport-route" required rows={2} value={draft.transport.route} onChange={(event) => setDraft({ ...draft, transport: { ...draft.transport!, route: event.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transport-timetable">Horaires</Label>
                    <Textarea id="transport-timetable" required rows={3} value={draft.transport.timetable} onChange={(event) => setDraft({ ...draft, transport: { ...draft.transport!, timetable: event.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transport-information">Informations pratiques</Label>
                    <Textarea id="transport-information" rows={2} value={draft.transport.information} onChange={(event) => setDraft({ ...draft, transport: { ...draft.transport!, information: event.target.value } })} />
                  </div>
                </>
              )}
            </fieldset>
          )}

          {saving.error !== undefined && <p role="alert" className="text-sm text-destructive">{getErrorMessage(saving.error)}</p>}
          {message && <p role="status" className="text-sm text-green-700">{message}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving.isLoading || slugInvalid}>{saving.isLoading ? "Enregistrement…" : "Enregistrer"}</Button>
            <Button type="button" variant="ghost" onClick={onDone}>Fermer</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/** Catalogue des services municipaux (D05, F28, F32), état (F38) et transports (F36). */
export function ServicesPage() {
  const services = useListServicesQuery()
  const [editing, setEditing] = useState<{ service: MunicipalService; isNew: boolean } | null>(null)
  const items = services.data ?? []
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[2fr_3fr]">
      <section aria-labelledby="titre-services" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 id="titre-services" className="text-2xl font-semibold">Services et transports</h1>
          <Button type="button" onClick={() => setEditing({ service: newService(), isNew: true })}>Nouveau service</Button>
        </div>
        <ListState isLoading={services.isLoading} error={services.error} isEmpty={items.length === 0} emptyLabel="Aucun service." onRetry={() => void services.refetch()} retrying={services.isFetching}>
          <ul className="divide-y rounded-lg border bg-white">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{SERVICE_CATEGORIES[item.category] ?? item.category}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant={item.status === "available" ? "secondary" : "destructive"}>{SERVICE_STATUS_LABELS[item.status]}</Badge>
                    {item.featured && <Badge variant="outline">Mis en avant</Badge>}
                    {item.transport && <Badge variant="outline">Horaires</Badge>}
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing({ service: item, isNew: false })}>Modifier</Button>
              </li>
            ))}
          </ul>
        </ListState>
      </section>
      <div>
        {editing
          ? <ServiceForm key={editing.isNew ? "nouveau" : editing.service.id} initial={editing.service} isNew={editing.isNew} onDone={() => setEditing(null)} />
          : <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Choisissez un service à modifier ou créez-en un.</p>}
      </div>
    </div>
  )
}
