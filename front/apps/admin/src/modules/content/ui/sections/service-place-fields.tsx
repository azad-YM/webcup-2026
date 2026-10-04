import { Input, Label } from "@boilerplate/shared-ui/components"
import { useListDistrictsQuery } from "../../core/application/rtk-api/content"
import { EMERGENCY_LABELS, type EmergencyKind, type MunicipalService } from "../../core/domain/content"
import { selectClass } from "../components/content-states"

const emptyLocation = { address: "", district: null, lat: 0, lng: 0 }

/** F45, F46 : lieu du service sur la carte du site et type d’urgence. */
export function ServicePlaceFields({ draft, disabled, onChange }: { draft: MunicipalService; disabled: boolean; onChange: (service: MunicipalService) => void }) {
  const districts = useListDistrictsQuery()
  const location = draft.location ?? null
  const setLocation = (patch: Partial<NonNullable<MunicipalService["location"]>>) =>
    onChange({ ...draft, location: { ...(location ?? emptyLocation), ...patch } })
  const coordinate = (value: string) => (value.trim() === "" ? Number.NaN : Number(value.replace(",", ".")))
  return (
    <fieldset disabled={disabled} className="space-y-4">
      <legend className="font-semibold">Lieu et urgences</legend>
      <div className="space-y-2">
        <Label htmlFor="service-emergency">Service d’urgence</Label>
        <select
          id="service-emergency"
          className={selectClass}
          aria-describedby="service-emergency-help"
          value={draft.emergency ?? ""}
          onChange={(event) => onChange({ ...draft, emergency: (event.target.value || null) as EmergencyKind | null })}
        >
          <option value="">Non, service ordinaire</option>
          {Object.entries(EMERGENCY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <p id="service-emergency-help" className="text-sm text-muted-foreground">Un service d’urgence apparaît sur la page « Urgences » du site, avec son adresse, ses horaires et son état.</p>
      </div>
      <label className="flex items-center gap-3">
        <input type="checkbox" className="size-4 accent-primary" checked={location !== null} onChange={(event) => onChange({ ...draft, location: event.target.checked ? emptyLocation : null })} />
        <span>Afficher ce service sur la carte (lieu d’accueil physique)</span>
      </label>
      {location && (
        <>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="service-address">Adresse</Label>
              <Input id="service-address" required maxLength={500} value={location.address} onChange={(event) => setLocation({ address: event.target.value })} placeholder="Ex. 1 boulevard de l’Aurore" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-district">Quartier (facultatif)</Label>
              <select id="service-district" className={selectClass} value={location.district ?? ""} onChange={(event) => setLocation({ district: event.target.value || null })}>
                <option value="">{districts.isError ? "Liste des quartiers indisponible" : "Aucun"}</option>
                {(districts.data ?? []).map((district) => <option key={district} value={district}>{district}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-lat">Latitude</Label>
              <Input id="service-lat" required inputMode="decimal" aria-describedby="service-coordinates-help" defaultValue={String(location.lat)} onChange={(event) => setLocation({ lat: coordinate(event.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-lng">Longitude</Label>
              <Input id="service-lng" required inputMode="decimal" aria-describedby="service-coordinates-help" defaultValue={String(location.lng)} onChange={(event) => setLocation({ lng: coordinate(event.target.value) })} />
            </div>
          </div>
          <p id="service-coordinates-help" className="text-sm text-muted-foreground">
            Coordonnées en degrés décimaux (ex. -20.8870 et 55.4630). Astuce : sur openstreetmap.org, clic droit sur le lieu puis « Afficher l’adresse ».
          </p>
        </>
      )}
    </fieldset>
  )
}
