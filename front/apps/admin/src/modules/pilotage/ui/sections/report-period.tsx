import { useState } from "react"
import { Button, Input, Label } from "@boilerplate/shared-ui/components"
import { PERIOD_CHOICES, type ReportPeriodChoice } from "../../core/domain/activity-report"

/** F98, F103 : choix de la période (7 jours, 30 jours, 3 mois ou dates précises). */
export function ReportPeriodPicker({ value, onChange }: { value: ReportPeriodChoice; onChange: (choice: ReportPeriodChoice) => void }) {
  const [from, setFrom] = useState("days" in value ? "" : value.from)
  const [to, setTo] = useState("days" in value ? "" : value.to)
  return (
    <div className="flex flex-wrap items-end gap-3 print:hidden" role="group" aria-label="Période analysée">
      <div className="flex flex-wrap gap-1 rounded-lg border bg-white p-1">
        {PERIOD_CHOICES.map((choice) => {
          const active = "days" in value && value.days === choice.days
          return (
            <button key={choice.days} type="button" aria-pressed={active} onClick={() => onChange({ days: choice.days })} className={`rounded-md px-3 py-1.5 text-sm font-medium ${active ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}>
              {choice.label}
            </button>
          )
        })}
      </div>
      <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); if (from && to) onChange({ from, to }) }}>
        <div className="space-y-1"><Label htmlFor="periode-du" className="text-xs">Du</Label><Input id="periode-du" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-9" /></div>
        <div className="space-y-1"><Label htmlFor="periode-au" className="text-xs">Au</Label><Input id="periode-au" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-9" /></div>
        <Button type="submit" variant="outline" size="sm" disabled={!from || !to}>Appliquer</Button>
      </form>
    </div>
  )
}

/** Couleur d’un constat ; l’information ne repose jamais sur la seule couleur (titre explicite). */
export const TONE_CLASSES = {
  info: "border-sky-600 bg-sky-50 text-sky-950",
  success: "border-emerald-600 bg-emerald-50 text-emerald-950",
  warning: "border-amber-600 bg-amber-50 text-amber-950",
  danger: "border-red-600 bg-red-50 text-red-950",
  neutral: "border-slate-400 bg-slate-50 text-slate-900",
} as const
