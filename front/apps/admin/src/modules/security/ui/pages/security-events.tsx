import { SecurityEvents } from "../sections/security-events"

/** F100 : page « Événements de sécurité », ouverte à tous les membres de l’administration. */
export function SecurityEventsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Événements de sécurité</h1>
        <p className="mt-1 text-muted-foreground">Ce qui s’est passé ces 7 derniers jours, sa gravité et ce qu’il faut faire. Mis à jour en direct.</p>
      </div>
      <SecurityEvents />
    </div>
  )
}
