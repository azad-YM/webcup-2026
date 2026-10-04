import { useState } from "react"
import { Button, Label, Textarea } from "@boilerplate/shared-ui/components"
import { StatusBadge, type StatusTone } from "@boilerplate/shared-ui/components/a11y"
import { useFollowIdeaMutation, useListIdeasQuery, useSetIdeaVisibilityMutation } from "../../core/application/rtk-api/participation"
import { formatDateTime, IDEA_STATUS_LABELS, type Idea, type IdeaStatus } from "../../core/domain/participation"
import { FormMessages, ListState, selectClass } from "../components/participation-states"

const IDEA_TONES: Record<IdeaStatus, StatusTone> = { received: "pending", in_review: "progress", accepted: "info", rejected: "danger", done: "success" }
const NEXT: IdeaStatus[] = ["in_review", "accepted", "rejected", "done"]

function IdeaCard({ idea }: { idea: Idea }) {
  const [status, setStatus] = useState<IdeaStatus>(NEXT.find((item) => item !== idea.status) ?? "in_review")
  const [comment, setComment] = useState("")
  const [reason, setReason] = useState("")
  const [missing, setMissing] = useState<"comment" | "reason" | null>(null)
  const [follow, following] = useFollowIdeaMutation()
  const [setVisibility, visibility] = useSetIdeaVisibilityMutation()
  const [message, setMessage] = useState<string | null>(null)
  const busy = following.isLoading || visibility.isLoading

  const submitStatus = async () => {
    if (busy) return
    if (status === "rejected" && !comment.trim()) return setMissing("comment")
    setMissing(null)
    setMessage(null)
    const result = await follow({ ideaId: idea.id, status: status as Exclude<IdeaStatus, "received">, comment: comment.trim() || null })
    if (!("error" in result)) {
      setComment("")
      setMessage("Statut enregistré ; l’habitant est prévenu dans son espace.")
    }
  }
  const toggleVisibility = async () => {
    if (busy) return
    if (idea.public && !reason.trim()) return setMissing("reason")
    setMissing(null)
    setMessage(null)
    const result = await setVisibility({ ideaId: idea.id, public: !idea.public, reason: idea.public ? reason.trim() : null })
    if (!("error" in result)) {
      setReason("")
      setMessage(idea.public ? "Idée retirée de la liste publique." : "Idée de nouveau publique.")
    }
  }
  return (
    <article aria-labelledby={`idee-${idea.id}`} className="space-y-3 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`idee-${idea.id}`} className="font-semibold">{idea.reference} · {idea.title}</h2>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={IDEA_TONES[idea.status]} label={IDEA_STATUS_LABELS[idea.status]} srPrefix="Statut :" />
          {!idea.public && <StatusBadge tone="warning" label="Non publiée" />}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{idea.district ?? "Toute la ville"} · proposée le {formatDateTime(idea.createdAt)}</p>
      <p className="whitespace-pre-wrap">{idea.description}</p>
      {!idea.public && idea.hiddenReason && <p className="text-sm"><span className="font-medium">Motif de non-publication :</span> {idea.hiddenReason}</p>}
      <ol className="space-y-1 border-l-2 pl-3 text-sm" aria-label="Suivi de l’idée">
        {idea.trail.map((step) => (
          <li key={`${step.status}-${step.at}`}>
            <span className="font-medium">{IDEA_STATUS_LABELS[step.status]}</span> · {formatDateTime(step.at)}
            {step.comment && <p className="whitespace-pre-wrap text-muted-foreground">{step.comment}</p>}
          </li>
        ))}
      </ol>
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
        <div className="space-y-1">
          <Label htmlFor={`statut-${idea.id}`}>Nouveau statut</Label>
          <select id={`statut-${idea.id}`} className={selectClass} value={status} onChange={(event) => setStatus(event.target.value as IdeaStatus)}>
            {NEXT.filter((item) => item !== idea.status).map((item) => <option key={item} value={item}>{IDEA_STATUS_LABELS[item]}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`commentaire-${idea.id}`}>{status === "rejected" ? "Motif (obligatoire, visible par l’habitant)" : "Commentaire (facultatif, visible par l’habitant)"}</Label>
          <Textarea id={`commentaire-${idea.id}`} maxLength={2000} rows={2} value={comment} aria-invalid={missing === "comment" || undefined} aria-describedby={missing === "comment" ? `commentaire-erreur-${idea.id}` : undefined} onChange={(event) => setComment(event.target.value)} />
          {missing === "comment" && <p id={`commentaire-erreur-${idea.id}`} className="text-sm text-destructive">Expliquez pourquoi l’idée n’est pas retenue.</p>}
        </div>
      </div>
      <Button type="button" disabled={busy} onClick={() => void submitStatus()}>Enregistrer le statut</Button>
      <div className="space-y-1 border-t pt-3">
        {idea.public && (
          <>
            <Label htmlFor={`motif-${idea.id}`}>Motif pour ne pas publier (propos inappropriés, données personnelles…)</Label>
            <Textarea id={`motif-${idea.id}`} maxLength={2000} rows={2} value={reason} aria-invalid={missing === "reason" || undefined} aria-describedby={missing === "reason" ? `motif-erreur-${idea.id}` : undefined} onChange={(event) => setReason(event.target.value)} />
            {missing === "reason" && <p id={`motif-erreur-${idea.id}`} className="text-sm text-destructive">Indiquez le motif.</p>}
          </>
        )}
        <Button type="button" variant={idea.public ? "destructive" : "outline"} disabled={busy} onClick={() => void toggleVisibility()}>
          {idea.public ? "Ne pas publier cette idée" : "Rendre l’idée publique"}
        </Button>
      </div>
      <FormMessages error={following.error ?? visibility.error} success={message} />
    </article>
  )
}

/** Boîte à idées (F68) : suivi des idées des habitants et modération de la liste publique. */
export function ParticipationIdeasPage() {
  const [filter, setFilter] = useState<IdeaStatus | "">("")
  const ideas = useListIdeasQuery(filter || null)
  const items = ideas.data ?? []
  return (
    <section aria-labelledby="titre-idees" className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="titre-idees" className="text-2xl font-semibold">Boîte à idées</h1>
          <p className="text-sm text-muted-foreground">Les plus anciennes d’abord. L’identité des habitants n’est pas affichée.</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="idea-filter">Statut</Label>
          <select id="idea-filter" className={selectClass} value={filter} onChange={(event) => setFilter(event.target.value as IdeaStatus | "")}>
            <option value="">Tous</option>
            {Object.entries(IDEA_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      <ListState isLoading={ideas.isLoading} error={ideas.error} isEmpty={items.length === 0} emptyLabel="Aucune idée." loadingLabel="Chargement des idées…" onRetry={() => void ideas.refetch()} retrying={ideas.isFetching}>
        <ul className="space-y-3">
          {items.map((idea) => <li key={idea.id}><IdeaCard key={`${idea.id}-${idea.updatedAt}`} idea={idea} /></li>)}
        </ul>
      </ListState>
    </section>
  )
}
