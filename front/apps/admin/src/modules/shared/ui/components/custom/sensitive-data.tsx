import { Button } from "@boilerplate/shared-ui/components"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"

/** F70 : métadonnées renvoyées par l’API Citizen pour les écrans qui contiennent des données personnelles sensibles. */
export type SensitiveDataMeta = { revealed: boolean; canReveal: boolean }

export const MASKED_LABEL = "Masqué — accès réservé"

/**
 * Valeur masquée par l’API (pas seulement par l’écran) : sans habilitation `admin.sensitive-data.read`, la donnée
 * n’arrive jamais dans le navigateur.
 */
export function MaskedValue({ field, masked, value, empty = "Non renseigné" }: { field: string; masked?: string[]; value: string | null | undefined; empty?: string }) {
  if (masked?.includes(field)) {
    return <span className="inline-flex items-center gap-1 italic text-muted-foreground">{MASKED_LABEL}</span>
  }
  return <>{value ?? empty}</>
}

/**
 * Bandeau des écrans à données sensibles : explique le masquage et, pour un agent habilité, propose l’affichage
 * explicite (chaque affichage est inscrit au journal des actions).
 */
export function SensitiveDataBar({ meta, revealed, onChange, busy }: { meta: SensitiveDataMeta | undefined; revealed: boolean; onChange: (reveal: boolean) => void; busy?: boolean }) {
  if (!meta) return null
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
      <StatusBadge tone={meta.revealed ? "warning" : "info"} label={meta.revealed ? "Données sensibles affichées" : "Données sensibles masquées"} srPrefix="Confidentialité :" />
      <span className="min-w-0 flex-1">
        {meta.revealed
          ? "Cette consultation est inscrite au journal des actions. Masquez les données dès que vous n’en avez plus besoin."
          : meta.canReveal
            ? "Coordonnées et adresses sont masquées par défaut. Leur affichage est journalisé."
            : "Coordonnées et adresses sont réservées aux agents habilités (permission « Données personnelles sensibles »)."}
      </span>
      {meta.canReveal && (
        <Button type="button" size="sm" variant="outline" disabled={busy} aria-pressed={revealed} onClick={() => onChange(!revealed)}>
          {revealed ? "Masquer les données sensibles" : "Afficher les données sensibles"}
        </Button>
      )}
    </div>
  )
}
