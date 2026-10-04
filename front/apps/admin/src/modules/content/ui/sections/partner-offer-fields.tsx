import { Button, Input, Label, Textarea } from "@boilerplate/shared-ui/components"
import {
  fromLocalInput,
  newPartnerOffer,
  OFFER_ACTION_LABELS,
  OFFER_STATUS_LABELS,
  toLocalInput,
  type MunicipalService,
  type OfferActionKind,
  type OfferStatus,
  type PartnerOffer,
} from "../../core/domain/content"
import { selectClass } from "../components/content-states"

const TARGET_HINTS: Record<OfferActionKind, string> = {
  call: "Numéro à appeler (vide : téléphone du partenaire)",
  visit: "Adresse si différente (vide : lieu du partenaire)",
  book: "Lien de réservation (https://…)",
  register: "Lien d’inscription (https://…)",
  website: "Lien (vide : site du partenaire)",
  email: "E-mail (vide : e-mail du partenaire)",
}

/**
 * F99 : services proposés par un partenaire. Pour chacun : ce que c’est, pour qui, s’il est disponible
 * (et quand il le redevient) et la prochaine action à proposer à l’habitant. Affiché sur `/partenaires`.
 */
export function PartnerOfferFields({ draft, disabled, onChange }: { draft: MunicipalService; disabled: boolean; onChange: (service: MunicipalService) => void }) {
  const offers = draft.offers ?? []
  const update = (index: number, change: Partial<PartnerOffer>) => onChange({ ...draft, offers: offers.map((offer, position) => (position === index ? { ...offer, ...change } : offer)) })
  return (
    <fieldset disabled={disabled} className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 font-medium">Services proposés aux habitants (F99)</legend>
      <p className="text-sm text-muted-foreground">Dites clairement ce qui est disponible, ce qui ne l’est pas et ce que l’habitant peut faire ensuite. Mettez à jour la disponibilité dès qu’elle change.</p>
      {offers.map((offer, index) => {
        const id = `offre-${index}`
        const unavailable = offer.status === "full" || offer.status === "paused" || offer.status === "soon"
        return (
          <div key={id} className="space-y-3 rounded-md border bg-slate-50 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label htmlFor={`${id}-titre`}>Service proposé</Label><Input id={`${id}-titre`} maxLength={120} value={offer.title} onChange={(event) => update(index, { title: event.target.value })} placeholder="Colis alimentaire" /></div>
              <div className="space-y-1"><Label htmlFor={`${id}-public`}>Pour qui (facultatif)</Label><Input id={`${id}-public`} maxLength={120} value={offer.audience} onChange={(event) => update(index, { audience: event.target.value })} placeholder="Familles aux revenus modestes" /></div>
            </div>
            <div className="space-y-1"><Label htmlFor={`${id}-description`}>Description courte (facultatif)</Label><Textarea id={`${id}-description`} rows={2} maxLength={400} value={offer.description} onChange={(event) => update(index, { description: event.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor={`${id}-statut`}>Disponibilité</Label>
                <select id={`${id}-statut`} className={selectClass} value={offer.status} onChange={(event) => update(index, { status: event.target.value as OfferStatus })}>
                  {Object.entries(OFFER_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label htmlFor={`${id}-note`}>Précision (facultatif)</Label><Input id={`${id}-note`} maxLength={160} value={offer.statusNote} onChange={(event) => update(index, { statusNote: event.target.value })} placeholder="2 places restantes" /></div>
              {unavailable && (
                <div className="space-y-1"><Label htmlFor={`${id}-retour`}>De nouveau disponible le</Label><Input id={`${id}-retour`} type="datetime-local" value={offer.nextAvailableAt ? toLocalInput(offer.nextAvailableAt) : ""} onChange={(event) => update(index, { nextAvailableAt: event.target.value ? fromLocalInput(event.target.value) : null })} /></div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor={`${id}-action`}>Prochaine action</Label>
                <select id={`${id}-action`} className={selectClass} value={offer.action.kind} onChange={(event) => update(index, { action: { ...offer.action, kind: event.target.value as OfferActionKind } })}>
                  {Object.entries(OFFER_ACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label htmlFor={`${id}-libelle`}>Texte du bouton</Label><Input id={`${id}-libelle`} maxLength={80} value={offer.action.label} onChange={(event) => update(index, { action: { ...offer.action, label: event.target.value } })} placeholder={unavailable ? "Être prévenu de la reprise" : "Réserver une place"} /></div>
              <div className="space-y-1"><Label htmlFor={`${id}-cible`}>{TARGET_HINTS[offer.action.kind]}</Label><Input id={`${id}-cible`} maxLength={300} value={offer.action.target} onChange={(event) => update(index, { action: { ...offer.action, target: event.target.value } })} /></div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...draft, offers: offers.filter((_, position) => position !== index) })}>Retirer ce service</Button>
          </div>
        )
      })}
      {offers.length < 12 && <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...draft, offers: [...offers, newPartnerOffer()] })}>Ajouter un service proposé</Button>}
    </fieldset>
  )
}
