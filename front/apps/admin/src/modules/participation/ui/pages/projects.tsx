import { useState, type FormEvent } from "react"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@boilerplate/shared-ui/components"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import { useListDistrictsQuery, useListProjectsQuery, useSaveProjectMutation } from "../../core/application/rtk-api/participation"
import {
  formatDate,
  fromLines,
  newProject,
  PROJECT_STATUS_LABELS,
  STATE_LABELS,
  toLines,
  type Project,
  type ProjectStatus,
  type ProjectStep,
  type PublicationState,
} from "../../core/domain/participation"
import { FormMessages, ListState, selectClass } from "../components/participation-states"

function StepsEditor({ steps, onChange }: { steps: ProjectStep[]; onChange: (steps: ProjectStep[]) => void }) {
  const update = (index: number, change: Partial<ProjectStep>) => onChange(steps.map((step, i) => (i === index ? { ...step, ...change } : step)))
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Étapes datées</legend>
      {steps.length === 0 && <p className="text-sm text-muted-foreground">Aucune étape pour l’instant.</p>}
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_10rem_auto]">
            <div className="space-y-1">
              <Label htmlFor={`step-label-${index}`}>Étape {index + 1}</Label>
              <Input id={`step-label-${index}`} required maxLength={200} value={step.label} onChange={(event) => update(index, { label: event.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`step-date-${index}`}>Date</Label>
              <Input id={`step-date-${index}`} type="date" required value={step.date} onChange={(event) => update(index, { date: event.target.value })} />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-primary" checked={step.done} onChange={(event) => update(index, { done: event.target.checked })} /> Réalisée
              </label>
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(steps.filter((_, i) => i !== index))}>
                Retirer<span className="sr-only"> l’étape {index + 1}</span>
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...steps, { label: "", date: new Date().toISOString().slice(0, 10), done: false }])}>Ajouter une étape</Button>
    </fieldset>
  )
}

function ProjectForm({ initial, onDone }: { initial: Project; onDone: () => void }) {
  const [draft, setDraft] = useState(initial)
  const [description, setDescription] = useState(fromLines(initial.description))
  const districts = useListDistrictsQuery()
  const [save, saving] = useSaveProjectMutation()
  const [message, setMessage] = useState<string | null>(null)
  const submit = async (event: FormEvent | React.MouseEvent, state: PublicationState) => {
    event.preventDefault()
    if (saving.isLoading) return
    setMessage(null)
    const result = await save({ ...draft, description: toLines(description), nextStep: draft.nextStep?.trim() || null, state })
    if ("data" in result && result.data) {
      setDraft(result.data)
      setMessage(state === "published" ? "Projet visible sur le site." : state === "withdrawn" ? "Projet retiré du site." : "Brouillon enregistré.")
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{draft.id ? "Modifier le projet" : "Nouveau projet"}</CardTitle>
        <CardDescription>Ce que la ville étudie, construit ou a terminé. Une fois publié, le projet apparaît sur la page « Projets » du site.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void submit(event, draft.state === "published" ? "published" : "draft")} className="space-y-4">
          <fieldset disabled={saving.isLoading} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">Titre</Label>
              <Input id="project-title" required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-summary">Résumé</Label>
              <Textarea id="project-summary" required maxLength={1000} rows={2} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea id="project-description" required rows={6} aria-describedby="project-description-help" value={description} onChange={(event) => setDescription(event.target.value)} />
              <p id="project-description-help" className="text-sm text-muted-foreground">Un paragraphe par ligne.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-district">Quartier</Label>
                <select id="project-district" className={selectClass} value={draft.district ?? ""} onChange={(event) => setDraft({ ...draft, district: event.target.value || null })}>
                  <option value="">Toute la ville</option>
                  {(districts.data ?? []).map((district) => <option key={district} value={district}>{district}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-status">Avancement</Label>
                <select id="project-status" className={selectClass} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ProjectStatus })}>
                  {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>
            <StepsEditor steps={draft.steps} onChange={(steps) => setDraft({ ...draft, steps })} />
            <div className="space-y-2">
              <Label htmlFor="project-next">Prochaine étape</Label>
              <Input id="project-next" maxLength={500} value={draft.nextStep ?? ""} onChange={(event) => setDraft({ ...draft, nextStep: event.target.value })} placeholder="Ex. : réunion publique au dôme Est, début des travaux…" />
            </div>
          </fieldset>
          <FormMessages error={saving.error} success={message} />
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

/** Projets en cours dans la ville (F67). */
export function ParticipationProjectsPage() {
  const projects = useListProjectsQuery()
  const [editing, setEditing] = useState<Project | null>(null)
  const [filter, setFilter] = useState<PublicationState | "">("")
  const items = (projects.data ?? []).filter((item) => !filter || item.state === filter)
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
      <section aria-labelledby="titre-projets" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 id="titre-projets" className="text-2xl font-semibold">Projets</h1>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="project-filter">État</Label>
              <select id="project-filter" className={selectClass} value={filter} onChange={(event) => setFilter(event.target.value as PublicationState | "")}>
                <option value="">Tous</option>
                {Object.entries(STATE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <Button type="button" onClick={() => setEditing(newProject())}>Nouveau projet</Button>
          </div>
        </div>
        <ListState isLoading={projects.isLoading} error={projects.error} isEmpty={items.length === 0} emptyLabel="Aucun projet." loadingLabel="Chargement des projets…" onRetry={() => void projects.refetch()} retrying={projects.isFetching}>
          <ul className="nt-content-list space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.district ?? "Toute la ville"} · mis à jour le {formatDate(item.updatedAt)}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <StatusBadge tone={item.state === "published" ? "success" : item.state === "draft" ? "pending" : "neutral"} label={STATE_LABELS[item.state]} srPrefix="Publication :" />
                    <StatusBadge tone={item.status === "done" ? "success" : item.status === "in_progress" ? "info" : "neutral"} label={PROJECT_STATUS_LABELS[item.status]} srPrefix="Avancement :" />
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(item)}>Modifier<span className="sr-only"> {item.title}</span></Button>
              </li>
            ))}
          </ul>
        </ListState>
      </section>
      <div>
        {editing
          ? <ProjectForm key={editing.id ?? "nouveau"} initial={editing} onDone={() => setEditing(null)} />
          : <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Choisissez un projet à modifier ou créez-en un.</p>}
      </div>
    </div>
  )
}
