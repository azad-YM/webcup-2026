import { useState } from "react"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { StatusBadge, useProtectedSubmit } from "@boilerplate/shared-ui/components/a11y"
import { useListAlertsQuery, useListDistrictsQuery, useSaveAlertMutation } from "../../core/application/rtk-api/content"
import {
  ALERT_KIND_LABELS,
  ALERT_TEMPLATES,
  alertFromTemplate,
  AUDIENCE_LABELS,
  fromLines,
  fromLocalInput,
  isAlertActive,
  newAlert,
  newOfficialMessage,
  SEVERITY_LABELS,
  STATE_LABELS,
  toLines,
  toLocalInput,
  type Alert,
  type AlertAudience,
  type AlertKind,
  type AlertSeverity,
  type ContentState,
} from "../../core/domain/content"
import { ListState, selectClass } from "../components/content-states"

function AlertForm({ initial, onDone }: { initial: Alert; onDone: () => void }) {
  const [draft, setDraft] = useState(initial)
  const [recommendations, setRecommendations] = useState(fromLines(initial.recommendations))
  const districts = useListDistrictsQuery()
  const [save, saving] = useSaveAlertMutation()
  const [message, setMessage] = useState<string | null>(null)
  const official = draft.category === "official"
  const [confirmed, setConfirmed] = useState(false)
  // F82 (L25) : un double clic sur « Diffuser » n’enregistre la même alerte qu’une fois.
  const guard = useProtectedSubmit({})
  const submit = async (state: ContentState) => {
    setMessage(null)
    if (official && state === "published" && !confirmed) {
      setMessage("Cochez la confirmation : un message officiel s’affiche immédiatement en haut de toutes les pages du site.")
      return
    }
    const payload = {
      ...draft,
      audience: official ? "all" as const : draft.audience,
      district: !official && draft.audience === "district" ? draft.district : null,
      recommendations: toLines(recommendations),
      state,
      confirmOfficial: official && state === "published" && confirmed,
    }
    const result = await guard.submit(payload, () => save(payload))
    if (result && "data" in result && result.data) {
      setDraft(result.data)
      setConfirmed(false)
      setMessage(state === "published" && official ? "Message officiel publié : il s’affiche dès maintenant en haut de toutes les pages du site." : state === "published" ? "Alerte diffusée : elle apparaît en temps réel chez les habitants concernés pendant sa validité." : state === "withdrawn" ? "Alerte retirée." : "Brouillon enregistré.")
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{official ? (draft.id ? "Modifier le message officiel" : "Nouveau message officiel du Haut Conseil") : draft.id ? "Modifier l’alerte" : "Nouvelle alerte"}</CardTitle>
        <CardDescription>{official
          ? "Message signé, visible par tous immédiatement : en tête de toutes les pages du site (même en mode léger) et dans l’archive « Messages officiels »."
          : "Message urgent affiché en bandeau sur le site pendant sa validité et dans les notifications des citoyens concernés."}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => { event.preventDefault(); void submit(draft.state === "published" ? "published" : "draft") }} className="space-y-4">
          <fieldset disabled={saving.isLoading} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alert-title">Titre</Label>
              <Input id="alert-title" required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ex. Montée des eaux dans le quartier Sud" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-message">Message</Label>
              <Textarea id="alert-message" required maxLength={5000} rows={4} value={draft.message} onChange={(event) => setDraft({ ...draft, message: event.target.value })} />
            </div>
            {official && (
              <div className="space-y-2">
                <Label htmlFor="alert-signatory">Signataire</Label>
                <Input id="alert-signatory" required maxLength={160} value={draft.signatory ?? ""} onChange={(event) => setDraft({ ...draft, signatory: event.target.value })} placeholder="Ex. La présidente du Haut Conseil" />
              </div>
            )}
            {!official && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="alert-kind">Nature de l’événement</Label>
                  <select id="alert-kind" className={selectClass} value={draft.kind ?? "general"} onChange={(event) => setDraft({ ...draft, kind: event.target.value as AlertKind })}>
                    {Object.entries(ALERT_KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-area">Zone touchée (facultatif)</Label>
                  <Input id="alert-area" maxLength={300} value={draft.area ?? ""} onChange={(event) => setDraft({ ...draft, area: event.target.value })} placeholder="Ex. Secteur nord : du dôme des Pionniers à la Corniche" />
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="alert-severity">Gravité</Label>
                <select id="alert-severity" className={selectClass} value={draft.severity} onChange={(event) => setDraft({ ...draft, severity: event.target.value as AlertSeverity })}>
                  {Object.entries(SEVERITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              {!official && <div className="space-y-2">
                <Label htmlFor="alert-audience">Qui doit la recevoir ?</Label>
                <select id="alert-audience" className={selectClass} value={draft.audience} onChange={(event) => setDraft({ ...draft, audience: event.target.value as AlertAudience })}>
                  {Object.entries(AUDIENCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>}
            </div>
            {!official && draft.audience === "district" && (
              <div className="space-y-2">
                <Label htmlFor="alert-district">Quartier</Label>
                <select id="alert-district" required className={selectClass} value={draft.district ?? ""} onChange={(event) => setDraft({ ...draft, district: event.target.value || null })}>
                  <option value="">{districts.isError ? "Liste des quartiers indisponible" : "Choisir un quartier"}</option>
                  {(districts.data ?? []).map((district) => <option key={district} value={district}>{district}</option>)}
                </select>
              </div>
            )}
            {!official && draft.audience === "health" && (
              <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">Seuls les citoyens qui ont accepté de recevoir les alertes sanitaires dans leur espace verront cette alerte. Aucune donnée médicale n’est utilisée.</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="alert-start">Début de validité</Label>
                <Input id="alert-start" type="datetime-local" required value={toLocalInput(draft.startsAt)} onChange={(event) => event.target.value && setDraft({ ...draft, startsAt: fromLocalInput(event.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-end">Fin de validité</Label>
                <Input id="alert-end" type="datetime-local" required value={toLocalInput(draft.endsAt)} onChange={(event) => event.target.value && setDraft({ ...draft, endsAt: fromLocalInput(event.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-recommendations">{official ? "Ce qu’il faut savoir ou faire (facultatif)" : "Recommandations (facultatif)"}</Label>
              <Textarea id="alert-recommendations" rows={5} aria-describedby="alert-recommendations-help" value={recommendations} onChange={(event) => setRecommendations(event.target.value)} placeholder={"Buvez au moins 1,5 L d’eau par jour.\nRestez au frais aux heures les plus chaudes."} />
              <p id="alert-recommendations-help" className="text-sm text-muted-foreground">Une consigne par ligne, concrète et courte (« Débranchez les appareils sensibles »). Pour une urgence, elles s’affichent d’emblée sur le site ; une alerte programmée est annoncée « À venir » jusqu’à 12 h avant son début.</p>
            </div>
            {official && (
              <label className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                <input type="checkbox" className="mt-0.5 size-4" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                Je confirme la publication : ce message officiel s’affichera immédiatement en haut de toutes les pages du site, pour tous les habitants.
              </label>
            )}
          </fieldset>
          {saving.error !== undefined && <p role="alert" className="text-sm text-destructive">{getErrorMessage(saving.error)}</p>}
          {message && <p role="status" className="text-sm text-green-700">{message}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={saving.isLoading} onClick={() => void submit("draft")}>Enregistrer en brouillon</Button>
            <Button type="button" disabled={saving.isLoading} onClick={() => void submit("published")}>{draft.state === "published" ? "Mettre à jour" : official ? "Publier le message officiel" : "Diffuser"}</Button>
            {draft.state === "published" && <Button type="button" variant="destructive" disabled={saving.isLoading} onClick={() => void submit("withdrawn")}>{official ? "Retirer le message" : "Retirer l’alerte"}</Button>}
            <Button type="button" variant="ghost" onClick={onDone}>Fermer</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/** Alertes de la ville (D18, F29, F31). */
export function AlertsPage() {
  const alerts = useListAlertsQuery(undefined, { pollingInterval: 60_000 })
  const [editing, setEditing] = useState<Alert | null>(null)
  const items = alerts.data ?? []
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
      <section aria-labelledby="titre-alertes" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 id="titre-alertes" className="text-2xl font-semibold">Alertes</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setEditing(newOfficialMessage())}>Message officiel</Button>
            <Button type="button" onClick={() => setEditing(newAlert())}>Nouvelle alerte</Button>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-sm font-medium">Alerte de crise prête à diffuser (F101, F104)</p>
          <p className="text-xs text-muted-foreground">Un texte clair et relu : ce qui se passe, où, jusqu’à quand et que faire. Adaptez-le puis diffusez.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALERT_TEMPLATES.map((template) => (
              <Button key={template.id} type="button" variant="outline" size="sm" onClick={() => setEditing({ ...alertFromTemplate(template), id: null })}>{template.label}</Button>
            ))}
          </div>
        </div>
        <ListState isLoading={alerts.isLoading} error={alerts.error} isEmpty={items.length === 0} emptyLabel="Aucune alerte." onRetry={() => void alerts.refetch()} retrying={alerts.isFetching}>
          <ul className="nt-content-list space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.kind && item.kind !== "general" ? `${ALERT_KIND_LABELS[item.kind]} · ` : ""}{item.audience === "district" ? `Quartier ${item.district}` : AUDIENCE_LABELS[item.audience]} · du {new Date(item.startsAt).toLocaleString("fr-FR")} au {new Date(item.endsAt).toLocaleString("fr-FR")}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {item.category === "official" && <StatusBadge tone="info" label="Message officiel" />}
                    <StatusBadge tone={item.severity === "critical" ? "danger" : item.severity === "warning" ? "warning" : "info"} label={SEVERITY_LABELS[item.severity]} srPrefix="Gravité :" />
                    <StatusBadge tone={item.state === "published" ? "success" : item.state === "draft" ? "pending" : "neutral"} label={STATE_LABELS[item.state]} srPrefix="État :" />
                    {isAlertActive(item) && <StatusBadge tone="progress" label="En cours" />}
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
          ? <AlertForm key={editing.id ?? `nouvelle-${editing.title}`} initial={editing} onDone={() => setEditing(null)} />
          : <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Choisissez une alerte à modifier, ou créez-en une avec « Nouvelle alerte ».</p>}
      </div>
    </div>
  )
}
