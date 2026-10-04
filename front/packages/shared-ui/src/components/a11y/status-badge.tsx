import { CircleCheck, CircleDot, CircleX, Hourglass, Info, TriangleAlert, type LucideIcon } from "lucide-react"
import { cn } from "../../lib/utils"

export type StatusTone = "neutral" | "pending" | "info" | "progress" | "success" | "warning" | "danger"

/**
 * Chaque ton combine couleur, icône et forme de bordure : l’information ne
 * repose jamais sur la seule couleur (F43). Contrastes texte/fond ≥ 4,5:1.
 */
const TONES: Record<StatusTone, { icon: LucideIcon; className: string }> = {
  neutral: { icon: CircleDot, className: "border-slate-400 bg-slate-100 text-slate-900" },
  pending: { icon: Hourglass, className: "border-dashed border-amber-700 bg-amber-50 text-amber-950" },
  info: { icon: Info, className: "border-sky-700 bg-sky-50 text-sky-950" },
  progress: { icon: CircleDot, className: "border-indigo-700 bg-indigo-50 text-indigo-950" },
  success: { icon: CircleCheck, className: "border-emerald-700 bg-emerald-50 text-emerald-950" },
  warning: { icon: TriangleAlert, className: "border-double border-[3px] border-amber-700 bg-amber-100 text-amber-950" },
  danger: { icon: CircleX, className: "border-red-700 bg-red-50 text-red-950" },
}

export const STATUS_TONE_ICONS: Record<StatusTone, LucideIcon> = Object.fromEntries(
  Object.entries(TONES).map(([tone, value]) => [tone, value.icon])
) as Record<StatusTone, LucideIcon>

/** Pastille de statut lisible sans la couleur : icône + libellé (+ précision pour les lecteurs d’écran). */
export function StatusBadge({ tone, label, srPrefix, size = "sm", className }: {
  tone: StatusTone
  label: string
  /** Contexte lu par les lecteurs d’écran avant le libellé, ex. « État : ». */
  srPrefix?: string
  size?: "sm" | "md"
  className?: string
}) {
  const { icon: Icon, className: toneClass } = TONES[tone]
  return (
    <span
      data-tone={tone}
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        toneClass,
        className
      )}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden="true" />
      {srPrefix && <span className="sr-only">{srPrefix} </span>}
      {label}
    </span>
  )
}
