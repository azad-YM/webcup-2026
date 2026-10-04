import { useState } from "react"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import { useListDistrictsQuery, useListTransportLinesQuery, useSaveTransportLineMutation } from "../../core/application/rtk-api/content"
import {
  fromLines,
  fromLocalInput,
  LINE_STATUS_LABELS,
  newTransportLine,
  REPLACEMENT_KIND_LABELS,
  toLines,
  toLocalInput,
  TRANSPORT_MODE_LABELS,
  type LineReplacement,
  type LineStatus,
  type ReplacementKind,
  type TransportLine,
  type TransportMode,
} from "../../core/domain/content"
import { ListState, selectClass } from "../components/content-states"

const emptyReplacement = (): LineReplacement => ({ kind: "substitute-shuttle", label: "", details: "", lineId: null })

function LineForm({ initial, lines, onDone }: { initial: TransportLine; lines: TransportLine[]; onDone: () => void }) {
  const [draft, setDraft] = useState(initial)
  const [stops, setStops] = useState(fromLines(initial.stops))
  const districts = useListDistrictsQuery()
  const [save, saving] = useSaveTransportLineMutation()
  const [message, setMessage] = useState<string | null>(null)
  const creating = !lines.some((line) => line.id === initial.id)
  const disrupted = draft.status !== "normal"
  const setReplacement = (index: number, change: Partial<LineReplacement>) =>
    setDraft({ ...draft, replacements: draft.replacements.map((item, position) => (position === index ? { ...item, ...change } : item)) })
  const submit = async () => {
    setMessage(null)
    const payload: TransportLine = {
      ...draft,
      stops: toLines(stops),
      statusMessage: disrupted ? draft.statusMessage : "",
      replacements: disrupted ? draft.replacements.filter((item) => item.label.trim() !== "") : [],
    }
    const result = await save(payload)
    if ("data" in result && result.data) {
      setDraft(result.data)
      setMessage(result.data.status === "interrupted"
        ? "Ligne enregistrée : les habitants voient l’interruption et les solutions de remplacement sur la page Transports."
        : "Ligne enregistrée.")
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{creating ? "Nouvelle ligne" : `Ligne ${initial.code} — ${initial.name}`}</CardTitle>
        <CardDescription>État affiché en temps réel sur la page « Transports » du site, avec l’aide au trajet (F97).</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => { event.preventDefault(); void submit() }} className="space-y-4">
          <fieldset disabled={saving.isLoading} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="line-id">Identifiant</Label>
                <Input id="line-id" required disabled={!creating} pattern="[a-z0-9][a-z0-9-]{0,39}" value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} placeholder="ligne-6" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="line-code">Numéro</Label>
                <Input id="line-code" required maxLength={10} value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} placeholder="6" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="line-mode">Mode</Label>
                <select id="line-mode" className={selectClass} value={draft.mode} onChange={(event) => setDraft({ ...draft, mode: event.target.value as TransportMode })}>
                  {Object.entries(TRANSPORT_MODE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-name">Nom</Label>
              <Input id="line-name" required maxLength={160} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Navette Port ↔ Dôme des Pionniers" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="line-stops">Arrêts, dans l’ordre (un par ligne)</Label>
                <Textarea id="line-stops" rows={5} required value={stops} onChange={(event) => setStops(event.target.value)} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Quartiers desservis</span>
                <div className="grid grid-cols-2 gap-1 rounded-md border p-2 text-sm">
                  {(districts.data ?? []).map((district) => (
                    <label key={district} className="flex items-center gap-2">
                      <input type="checkbox" checked={draft.districts.includes(district)} onChange={(event) => setDraft({ ...draft, districts: event.target.checked ? [...draft.districts, district] : draft.districts.filter((item) => item !== district) })} />
                      {district}
                    </label>
                  ))}
                </div>
                <Label htmlFor="line-frequency">Fréquence (facultatif)</Label>
                <Input id="line-frequency" maxLength={200} value={draft.frequency} onChange={(event) => setDraft({ ...draft, frequency: event.target.value })} placeholder="Toutes les 10 min, de 6 h à 22 h" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-status">Circulation</Label>
              <select id="line-status" className={selectClass} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as LineStatus })}>
                {Object.entries(LINE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            {disrupted && (
              <div className="space-y-4 rounded-lg border border-amber-300 bg-amber-50/60 p-4">
                <div className="space-y-2">
                  <Label htmlFor="line-message">Message aux voyageurs</Label>
                  <Textarea id="line-message" required maxLength={1000} rows={3} value={draft.statusMessage} onChange={(event) => setDraft({ ...draft, statusMessage: event.target.value })} placeholder="Ce qui se passe et sur quelle partie de la ligne, en mots simples." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="line-return">Retour prévu (facultatif)</Label>
                  <Input id="line-return" type="datetime-local" value={draft.returnAt ? toLocalInput(draft.returnAt) : ""} onChange={(event) => setDraft({ ...draft, returnAt: event.target.value ? fromLocalInput(event.target.value) : null })} />
                </div>
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Solutions de remplacement {draft.status === "interrupted" ? "(au moins une)" : "(facultatif)"}</legend>
                  {draft.replacements.map((replacement, index) => (
                    <div key={index} className="grid gap-2 rounded-md border bg-white p-3 sm:grid-cols-2">
                      <select aria-label={`Type de la solution ${index + 1}`} className={selectClass} value={replacement.kind} onChange={(event) => setReplacement(index, { kind: event.target.value as ReplacementKind, lineId: event.target.value === "other-line" ? replacement.lineId : null })}>
                        {Object.entries(REPLACEMENT_KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      {replacement.kind === "other-line" ? (
                        <select aria-label={`Ligne proposée pour la solution ${index + 1}`} className={selectClass} value={replacement.lineId ?? ""} onChange={(event) => setReplacement(index, { lineId: event.target.value || null })}>
                          <option value="">Choisir la ligne</option>
                          {lines.filter((line) => line.id !== draft.id).map((line) => <option key={line.id} value={line.id}>Ligne {line.code} — {line.name}</option>)}
                        </select>
                      ) : <span />}
                      <Input aria-label={`Intitulé de la solution ${index + 1}`} maxLength={160} value={replacement.label} onChange={(event) => setReplacement(index, { label: event.target.value })} placeholder="Navette de substitution 1S" className="sm:col-span-2" />
                      <Textarea aria-label={`Où et comment, solution ${index + 1}`} maxLength={600} rows={2} value={replacement.details} onChange={(event) => setReplacement(index, { details: event.target.value })} placeholder="Où la prendre, fréquence, réservation…" className="sm:col-span-2" />
                      <Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={() => setDraft({ ...draft, replacements: draft.replacements.filter((_, position) => position !== index) })}>Retirer</Button>
                    </div>
                  ))}
                  {draft.replacements.length < 6 && <Button type="button" variant="outline" size="sm" onClick={() => setDraft({ ...draft, replacements: [...draft.replacements, emptyReplacement()] })}>Ajouter une solution</Button>}
                </fieldset>
              </div>
            )}
          </fieldset>
          {saving.error !== undefined && <p role="alert" className="text-sm text-destructive">{getErrorMessage(saving.error)}</p>}
          {message && <p role="status" className="text-sm text-green-700">{message}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving.isLoading}>{saving.isLoading ? "Enregistrement…" : "Enregistrer"}</Button>
            <Button type="button" variant="ghost" onClick={onDone}>Fermer</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/** F97 : lignes de transport, état de circulation et solutions de remplacement (`admin.service.write`). */
export function TransportLinesPage() {
  const lines = useListTransportLinesQuery(undefined, { pollingInterval: 60_000 })
  const [editing, setEditing] = useState<TransportLine | null>(null)
  const items = lines.data ?? []
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section aria-labelledby="titre-lignes" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 id="titre-lignes" className="text-2xl font-semibold">Lignes de transport</h1>
            <p className="text-sm text-muted-foreground">Interrompez une ligne en indiquant au moins une solution de remplacement : elle s’affiche aussitôt sur le site.</p>
          </div>
          <Button type="button" onClick={() => setEditing(newTransportLine())}>Nouvelle ligne</Button>
        </div>
        <ListState isLoading={lines.isLoading} error={lines.error} isEmpty={items.length === 0} emptyLabel="Aucune ligne." onRetry={() => void lines.refetch()} retrying={lines.isFetching}>
          <ul className="nt-content-list space-y-3">
            {items.map((line) => (
              <li key={line.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-medium">Ligne {line.code} — {line.name}</p>
                  <p className="text-sm text-muted-foreground">{TRANSPORT_MODE_LABELS[line.mode]} · {line.stops.length} arrêts{line.replacements.length > 0 ? ` · ${line.replacements.length} solution(s) de remplacement` : ""}</p>
                  <div className="mt-1"><StatusBadge tone={line.status === "normal" ? "success" : line.status === "disrupted" ? "warning" : "danger"} label={LINE_STATUS_LABELS[line.status]} srPrefix="Circulation :" /></div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(line)}>Modifier</Button>
              </li>
            ))}
          </ul>
        </ListState>
      </section>
      <div>
        {editing
          ? <LineForm key={editing.id || "nouvelle"} initial={editing} lines={items} onDone={() => setEditing(null)} />
          : <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Choisissez une ligne pour changer son état ou ses solutions de remplacement.</p>}
      </div>
    </div>
  )
}
