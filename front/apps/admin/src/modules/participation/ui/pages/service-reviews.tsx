import { useState } from "react"
import { Button } from "@boilerplate/shared-ui/components/shadcn/button"
import { Label } from "@boilerplate/shared-ui/components/shadcn/label"
import { Textarea } from "@boilerplate/shared-ui/components/shadcn/textarea"
import { StatusBadge, type StatusTone } from "@boilerplate/shared-ui/components/a11y"
import { useHandleServiceReviewMutation, useListServiceReviewsQuery } from "../../core/application/rtk-api/participation"
import {
  CONTEXT_LABELS,
  formatDateTime,
  NEED_MET_LABELS,
  REVIEW_STATUS_LABELS,
  SCORE_LABELS,
  type ServiceReview,
  type ServiceReviewStatus,
} from "../../core/domain/participation"
import { FormMessages, ListState, selectClass } from "../components/participation-states"

const TONES: Record<ServiceReviewStatus, StatusTone> = { received: "pending", read: "info", answered: "success" }

function ReviewCard({ review }: { review: ServiceReview }) {
  const [response, setResponse] = useState(review.response ?? "")
  const [missing, setMissing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [handle, handling] = useHandleServiceReviewMutation()

  const markRead = async () => {
    if (handling.isLoading) return
    setMessage(null)
    const result = await handle({ reviewId: review.id, action: "read", response: null })
    if (!("error" in result)) setMessage("Avis marqué comme lu : l’habitant voit « Lu par le service ».")
  }
  const respond = async () => {
    if (handling.isLoading) return
    if (!response.trim()) return setMissing(true)
    setMissing(false)
    setMessage(null)
    const result = await handle({ reviewId: review.id, action: "respond", response: response.trim() })
    if (!("error" in result)) setMessage("Réponse envoyée ; l’habitant est prévenu dans son espace.")
  }

  return (
    <article aria-labelledby={`avis-${review.id}`} className="space-y-3 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`avis-${review.id}`} className="font-semibold">{review.reference} · {review.serviceName}</h2>
        <StatusBadge tone={TONES[review.status]} label={REVIEW_STATUS_LABELS[review.status]} srPrefix="Statut :" />
      </div>
      <p className="text-sm text-muted-foreground">
        {CONTEXT_LABELS[review.context]}{review.contextReference ? ` (${review.contextReference})` : ""} · {formatDateTime(review.updatedAt)}
      </p>
      <dl className="grid gap-1 text-sm sm:grid-cols-2">
        <div><dt className="inline font-medium">Note : </dt><dd className="inline">{review.rating} / 5 — {SCORE_LABELS[review.rating]}</dd></div>
        <div><dt className="inline font-medium">Besoin obtenu : </dt><dd className="inline">{NEED_MET_LABELS[review.needMet]}</dd></div>
      </dl>
      {review.comment ? <p className="whitespace-pre-wrap">{review.comment}</p> : <p className="text-sm text-muted-foreground">Sans commentaire.</p>}
      <div className="space-y-1">
        <Label htmlFor={`reponse-${review.id}`}>Réponse du service (visible par l’habitant)</Label>
        <Textarea id={`reponse-${review.id}`} maxLength={2000} rows={3} value={response} aria-invalid={missing || undefined} aria-describedby={missing ? `reponse-erreur-${review.id}` : undefined} onChange={(event) => setResponse(event.target.value)} />
        {missing && <p id={`reponse-erreur-${review.id}`} className="text-sm text-destructive">Écrivez la réponse avant de l’envoyer.</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {review.status === "received" && <Button type="button" variant="outline" disabled={handling.isLoading} onClick={() => void markRead()}>Marquer comme lu</Button>}
        <Button type="button" disabled={handling.isLoading} onClick={() => void respond()}>{review.response ? "Modifier la réponse" : "Répondre"}</Button>
      </div>
      <FormMessages error={handling.error} success={message} />
    </article>
  )
}

/** F76 : avis des habitants sur les services, sans leur identité ; lu / réponse journalisés. */
export function ServiceReviewsPage() {
  const [filter, setFilter] = useState<ServiceReviewStatus | "">("received")
  const reviews = useListServiceReviewsQuery(filter || null)
  const items = reviews.data?.items ?? []
  const ratings = Object.entries(reviews.data?.ratings ?? {})
  const names = new Map(items.map((item) => [item.serviceId, item.serviceName]))
  return (
    <section aria-labelledby="titre-avis-services" className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="titre-avis-services" className="text-2xl font-semibold">Avis sur les services</h1>
          <p className="text-sm text-muted-foreground">Les plus récents d’abord. L’identité des habitants n’est pas affichée.</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="review-filter">Statut</Label>
          <select id="review-filter" className={selectClass} value={filter} onChange={(event) => setFilter(event.target.value as ServiceReviewStatus | "")}>
            <option value="">Tous</option>
            {Object.entries(REVIEW_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      {ratings.length > 0 && (
        <details className="rounded-xl border bg-white p-4 text-sm">
          <summary className="cursor-pointer font-medium">Notes moyennes par service ({ratings.length})</summary>
          <ul className="mt-2 space-y-1">
            {ratings.map(([serviceId, rating]) => <li key={serviceId}>{names.get(serviceId) ?? serviceId} : {rating.average.toLocaleString("fr-FR")} / 5 ({rating.count} avis)</li>)}
          </ul>
        </details>
      )}
      <ListState isLoading={reviews.isLoading} error={reviews.error} isEmpty={items.length === 0} emptyLabel="Aucun avis." loadingLabel="Chargement des avis…" onRetry={() => void reviews.refetch()} retrying={reviews.isFetching}>
        <ul className="space-y-3">
          {items.map((review) => <li key={review.id}><ReviewCard key={`${review.id}-${review.updatedAt}`} review={review} /></li>)}
        </ul>
      </ListState>
    </section>
  )
}
