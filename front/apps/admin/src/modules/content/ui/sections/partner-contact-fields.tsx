import { useState } from "react"
import { Input } from "@boilerplate/shared-ui/components/shadcn/input"
import { Label } from "@boilerplate/shared-ui/components/shadcn/label"
import { DAY_LABELS, formatDaySlots, parseDaySlots, type MunicipalService, type OpeningSlot } from "../../core/domain/content"

/**
 * F74 : contact et horaires structurés d’une association partenaire. Les horaires d’un jour se saisissent
 * « 09:00-12:00, 14:00-18:00 » ; un jour vide est fermé. Ils servent au « Ouvert maintenant » du site.
 */
export function PartnerContactFields({ draft, disabled, onChange }: { draft: MunicipalService; disabled: boolean; onChange: (service: MunicipalService) => void }) {
  const [days, setDays] = useState(() => DAY_LABELS.map((_, index) => formatDaySlots(draft.contact.openingHours, index + 1)))
  const [invalid, setInvalid] = useState<number[]>([])
  const contact = draft.contact

  const updateDay = (index: number, value: string) => {
    const next = days.map((text, position) => (position === index ? value : text))
    setDays(next)
    const parsed = next.map((text, position) => parseDaySlots(text, position + 1))
    setInvalid(parsed.flatMap((slots, position) => (slots === null ? [position] : [])))
    const openingHours: OpeningSlot[] = parsed.flatMap((slots) => slots ?? [])
    onChange({ ...draft, contact: { ...contact, openingHours } })
  }

  return (
    <fieldset disabled={disabled} className="space-y-4 rounded-lg border p-4">
      <legend className="px-1 font-medium">Association partenaire : contact et horaires</legend>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="partner-person">Personne à contacter</Label>
          <Input id="partner-person" maxLength={160} value={contact.person ?? ""} onChange={(event) => onChange({ ...draft, contact: { ...contact, person: event.target.value } })} placeholder="Ex. Mme Andria, coordinatrice" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-email">E-mail</Label>
          <Input id="partner-email" type="email" maxLength={200} value={contact.email ?? ""} onChange={(event) => onChange({ ...draft, contact: { ...contact, email: event.target.value } })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner-website">Site internet</Label>
          <Input id="partner-website" type="url" maxLength={300} value={contact.website ?? ""} onChange={(event) => onChange({ ...draft, contact: { ...contact, website: event.target.value } })} placeholder="https://" />
        </div>
      </div>
      <div className="space-y-2">
        <p id="partner-hours-help" className="text-sm text-muted-foreground">Horaires d’ouverture, heure de Nova Terra : plages séparées par une virgule (ex. « 09:00-12:00, 14:00-18:00 »). Laissez vide un jour de fermeture.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {DAY_LABELS.map((label, index) => (
            <div key={label} className="grid grid-cols-[6rem_1fr] items-center gap-2">
              <Label htmlFor={`partner-day-${index}`}>{label}</Label>
              <div>
                <Input
                  id={`partner-day-${index}`}
                  value={days[index]}
                  aria-describedby={invalid.includes(index) ? `partner-day-error-${index} partner-hours-help` : "partner-hours-help"}
                  aria-invalid={invalid.includes(index) || undefined}
                  onChange={(event) => updateDay(index, event.target.value)}
                />
                {invalid.includes(index) && <p id={`partner-day-error-${index}`} className="mt-1 text-sm text-destructive">Format attendu : 09:00-12:00 (ouverture avant fermeture).</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </fieldset>
  )
}
