import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import { usePlatformStatusQuery } from "../../core/application/rtk-api/operations"
import { PLATFORM_SOURCE_LABELS } from "../../core/domain/operations"

/** F77 : état de la plateforme (normal ou mode allégé) et ce qui reste servi. */
export function PlatformStatusCard() {
  const { data, isError } = usePlatformStatusQuery(undefined, { pollingInterval: 60_000 })
  if (isError) return <p className="text-sm text-muted-foreground">État de la plateforme indisponible.</p>
  if (!data) return null
  const degraded = data.mode === "degraded"
  return (
    <section aria-labelledby="etat-plateforme" className={`rounded-xl border p-4 ${degraded ? "border-amber-600 bg-amber-50" : "bg-card"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="etat-plateforme" className="font-semibold">État de la plateforme</h2>
        <StatusBadge tone={degraded ? "warning" : "success"} label={degraded ? "Mode allégé" : "Normal"} srPrefix="État : " />
      </div>
      <p className="mt-2 text-sm">{data.message}</p>
      {degraded && (
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
          <li>Déclenché par : {PLATFORM_SOURCE_LABELS[data.source ?? ""] ?? "—"}{data.reason ? ` — ${data.reason}` : ""}</li>
          {data.until && <li>Levée automatique prévue vers {new Date(data.until).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} si la charge retombe.</li>}
          <li>Toujours disponible : {data.essential.join(", ")}.</li>
          <li>Suspendu : {data.suspended.join(", ")}.</li>
          <li>Pour lever le mode allégé : <code>php bin/console app:platform:degraded off</code>.</li>
        </ul>
      )}
    </section>
  )
}
