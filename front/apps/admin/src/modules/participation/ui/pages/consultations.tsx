import { useState, type FormEvent } from "react"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@boilerplate/shared-ui/components"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import {
  useListConsultationsQuery,
  useListContributionsQuery,
  useListProjectsQuery,
  useRecordOutcomeMutation,
  useSaveConsultationMutation,
} from "../../core/application/rtk-api/participation"
import {
  formatDateTime,
  fromLines,
  fromLocalInput,
  KIND_LABELS,
  newConsultation,
  PHASE_LABELS,
  RATING_LABELS,
  STATE_LABELS,
  toLines,
  toLocalInput,
  type Consultation,
  type ConsultationKind,
  type ConsultationPhase,
  type PublicationState,
} from "../../core/domain/participation"
import { FormMessages, ListState, selectClass } from "../components/participation-states"

const PHASE_TONES: Record<ConsultationPhase, "pending" | "success" | "neutral"> = { upcoming: "pending", open: "success", closed: "neutral" }

function ConsultationForm({ initial, onSaved }: { initial: Consultation; onSaved: (consultation: Consultation) => void }) {
  const [draft, setDraft] = useState(initial)
  const [description, setDescription] = useState(fromLines(initial.description))
  const [options, setOptions] = useState(fromLines(initial.options.map((option) => option.label)))
  const projects = useListProjectsQuery()
  const [save, saving] = useSaveConsultationMutation()
  const [message, setMessage] = useState<string | null>(null)
  const locked = (initial.contributionCount ?? 0) > 0
  const submit = async (event: FormEvent | React.MouseEvent, state: PublicationState) => {
    event.preventDefault()
    if (saving.isLoading) return
    setMessage(null)
    const result = await save({
      id: draft.id,
      projectId: draft.projectId,
      kind: draft.kind,
      title: draft.title,
      question: draft.question,
      description: toLines(description),
      options: draft.kind === "consultation" ? toLines(options) : [],
      opensAt: draft.opensAt,
      closesAt: draft.closesAt,
      state,
    })
    if ("data" in result && result.data) {
      setDraft(result.data)
      onSaved(result.data)
      setMessage(state === "published" ? "Visible sur le site." : state === "withdrawn" ? "Retirée du site." : "Brouillon enregistré.")
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{draft.id ? "Modifier la consultation" : "Nouvelle consultation"}</CardTitle>
        <CardDescription>
          Un « avis » recueille un texte libre et une appréciation simple : il est présenté aux habitants comme non officiel.
          Une « consultation » propose des choix, avec un commentaire facultatif. Les résultats sont publiés à la clôture.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void submit(event, draft.state === "published" ? "published" : "draft")} className="space-y-4">
          <fieldset disabled={saving.isLoading} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="consultation-kind">Type</Label>
                <select id="consultation-kind" className={selectClass} disabled={locked} aria-describedby={locked ? "consultation-locked" : undefined} value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as ConsultationKind })}>
                  {Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultation-project">Projet rattaché</Label>
                <select id="consultation-project" className={selectClass} value={draft.projectId ?? ""} onChange={(event) => setDraft({ ...draft, projectId: event.target.value || null })}>
                  <option value="">Aucun</option>
                  {(projects.data ?? []).map((project) => <option key={project.id} value={project.id ?? ""}>{project.title}</option>)}
                </select>
              </div>
            </div>
            {locked && <p id="consultation-locked" className="text-sm text-muted-foreground">Des habitants ont déjà répondu : le type et les choix ne peuvent plus changer.</p>}
            <div className="space-y-2">
              <Label htmlFor="consultation-title">Titre</Label>
              <Input id="consultation-title" required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultation-question">Question posée aux habitants</Label>
              <Textarea id="consultation-question" required maxLength={1000} rows={2} value={draft.question} onChange={(event) => setDraft({ ...draft, question: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultation-description">Contexte (facultatif)</Label>
              <Textarea id="consultation-description" rows={4} aria-describedby="consultation-description-help" value={description} onChange={(event) => setDescription(event.target.value)} />
              <p id="consultation-description-help" className="text-sm text-muted-foreground">Un paragraphe par ligne.</p>
            </div>
            {draft.kind === "consultation" && (
              <div className="space-y-2">
                <Label htmlFor="consultation-options">Choix proposés</Label>
                <Textarea id="consultation-options" rows={4} disabled={locked} aria-describedby="consultation-options-help" value={options} onChange={(event) => setOptions(event.target.value)} />
                <p id="consultation-options-help" className="text-sm text-muted-foreground">Un choix par ligne, de 2 à 10.</p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="consultation-opens">Ouverture</Label>
                <Input id="consultation-opens" type="datetime-local" required value={toLocalInput(draft.opensAt)} onChange={(event) => event.target.value && setDraft({ ...draft, opensAt: fromLocalInput(event.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultation-closes">Clôture</Label>
                <Input id="consultation-closes" type="datetime-local" required value={toLocalInput(draft.closesAt)} onChange={(event) => event.target.value && setDraft({ ...draft, closesAt: fromLocalInput(event.target.value) })} />
              </div>
            </div>
          </fieldset>
          <FormMessages error={saving.error} success={message} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={saving.isLoading} onClick={(event) => void submit(event, "draft")}>Enregistrer en brouillon</Button>
            <Button type="button" disabled={saving.isLoading} onClick={(event) => void submit(event, "published")}>{draft.state === "published" ? "Mettre à jour" : "Publier"}</Button>
            {draft.state === "published" && <Button type="button" variant="destructive" disabled={saving.isLoading} onClick={(event) => void submit(event, "withdrawn")}>Retirer du site</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Results({ consultation }: { consultation: Consultation }) {
  const results = consultation.results
  if (!results) return null
  const percent = (count: number) => (results.total === 0 ? 0 : Math.round((count / results.total) * 100))
  return (
    <section aria-labelledby={`resultats-${consultation.id}`} className="space-y-2">
      <h3 id={`resultats-${consultation.id}`} className="font-semibold">
        Résultats {consultation.phase === "closed" ? "(publiés sur le site)" : "(visibles par les agents seulement jusqu’à la clôture)"}
      </h3>
      <p className="text-sm">{results.total} réponse{results.total > 1 ? "s" : ""}, dont {results.comments} avec commentaire.</p>
      <ul className="space-y-1 text-sm">
        {results.choices.map((choice) => <li key={choice.id}>{choice.label} : {choice.count} ({percent(choice.count)} %)</li>)}
        {results.ratings.map((rating) => <li key={rating.rating}>{RATING_LABELS[rating.rating]} : {rating.count} ({percent(rating.count)} %)</li>)}
      </ul>
    </section>
  )
}

function Contributions({ consultation }: { consultation: Consultation }) {
  const [open, setOpen] = useState(false)
  const query = useListContributionsQuery(consultation.id ?? "", { skip: !open || !consultation.id })
  const labels = new Map(consultation.options.map((option) => [option.id, option.label]))
  if (!open) return <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>Lire les réponses</Button>
  return (
    <section aria-labelledby={`reponses-${consultation.id}`} className="space-y-2">
      <h3 id={`reponses-${consultation.id}`} className="font-semibold">Réponses (sans l’identité des habitants)</h3>
      <ListState isLoading={query.isLoading} error={query.error} isEmpty={(query.data ?? []).length === 0} emptyLabel="Aucune réponse pour l’instant." loadingLabel="Chargement des réponses…" onRetry={() => void query.refetch()} retrying={query.isFetching}>
        <ul className="max-h-96 space-y-2 overflow-y-auto">
          {(query.data ?? []).map((item) => (
            <li key={item.reference} className="rounded-lg border bg-white p-3 text-sm">
              <p className="text-muted-foreground">{item.reference} · {formatDateTime(item.updatedAt)}</p>
              {item.choice && <p className="font-medium">{labels.get(item.choice) ?? item.choice}</p>}
              {item.rating && <p className="font-medium">{RATING_LABELS[item.rating]}</p>}
              {item.comment && <p className="whitespace-pre-wrap">{item.comment}</p>}
            </li>
          ))}
        </ul>
      </ListState>
    </section>
  )
}

function OutcomeForm({ consultation }: { consultation: Consultation }) {
  const [text, setText] = useState(fromLines(consultation.outcome?.text ?? []))
  const [record, state] = useRecordOutcomeMutation()
  const [message, setMessage] = useState<string | null>(null)
  if (consultation.state !== "published" || consultation.phase !== "closed") {
    return <p className="text-sm text-muted-foreground">« Ce que la ville en a retenu » se rédige après la clôture d’une consultation publiée.</p>
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (state.isLoading || !consultation.id) return
    setMessage(null)
    const result = await record({ consultationId: consultation.id, outcome: toLines(text) })
    if ("data" in result) setMessage(toLines(text).length ? "Compte rendu publié sur le site." : "Compte rendu retiré.")
  }
  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-2">
      <Label htmlFor={`outcome-${consultation.id}`}>Ce que la ville en a retenu</Label>
      <Textarea id={`outcome-${consultation.id}`} rows={5} aria-describedby={`outcome-help-${consultation.id}`} value={text} onChange={(event) => setText(event.target.value)} />
      <p id={`outcome-help-${consultation.id}`} className="text-sm text-muted-foreground">Visible par tous les habitants sous les résultats. Un paragraphe par ligne ; laissez vide pour retirer le texte.</p>
      <FormMessages error={state.error} success={message} />
      <Button type="submit" disabled={state.isLoading}>{state.isLoading ? "Enregistrement…" : "Publier le compte rendu"}</Button>
    </form>
  )
}

/** Consultations sur des décisions (F65) et demandes d’avis non officiels (F66). */
export function ParticipationConsultationsPage() {
  const consultations = useListConsultationsQuery()
  const [editing, setEditing] = useState<Consultation | null>(null)
  const items = consultations.data ?? []
  const current = editing?.id ? items.find((item) => item.id === editing.id) ?? editing : editing
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
      <section aria-labelledby="titre-consultations" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 id="titre-consultations" className="text-2xl font-semibold">Consultations et avis</h1>
          <Button type="button" onClick={() => setEditing(newConsultation())}>Nouvelle consultation</Button>
        </div>
        <ListState isLoading={consultations.isLoading} error={consultations.error} isEmpty={items.length === 0} emptyLabel="Aucune consultation." loadingLabel="Chargement des consultations…" onRetry={() => void consultations.refetch()} retrying={consultations.isFetching}>
          <ul className="nt-content-list space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{KIND_LABELS[item.kind]} · du {formatDateTime(item.opensAt)} au {formatDateTime(item.closesAt)} · {item.contributionCount ?? 0} réponse(s)</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <StatusBadge tone={item.state === "published" ? "success" : item.state === "draft" ? "pending" : "neutral"} label={STATE_LABELS[item.state]} srPrefix="Publication :" />
                    {item.phase && <StatusBadge tone={PHASE_TONES[item.phase]} label={PHASE_LABELS[item.phase]} srPrefix="Période :" />}
                    {item.outcome && <StatusBadge tone="info" label="Compte rendu publié" />}
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(item)}>Ouvrir<span className="sr-only"> {item.title}</span></Button>
              </li>
            ))}
          </ul>
        </ListState>
      </section>
      <div className="space-y-6">
        {current ? (
          <>
            <ConsultationForm key={current.id ?? "nouvelle"} initial={current} onSaved={setEditing} />
            {current.id && (
              <Card>
                <CardHeader><CardTitle>Résultats et prise en compte</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <Results consultation={current} />
                  <Contributions key={current.id} consultation={current} />
                  <OutcomeForm key={`${current.id}-${current.outcome?.publishedAt ?? ""}`} consultation={current} />
                </CardContent>
              </Card>
            )}
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Fermer</Button>
          </>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Choisissez une consultation ou créez-en une.</p>
        )}
      </div>
    </div>
  )
}
