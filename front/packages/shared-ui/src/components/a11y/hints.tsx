"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Lightbulb, X } from "lucide-react"
import { cn } from "@boilerplate/shared-ui/lib"
import { useAccessibilityPreferences } from "./preferences-provider"

/**
 * Après fermeture d’une indication, le focus reste à sa place (au lieu de
 * retomber en haut de la page) et la fermeture est annoncée.
 */
function DismissedNotice({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return <p ref={ref} tabIndex={-1} role="status" className="sr-only">{text}</p>
}

/**
 * Indication contextuelle courte (F35) : affichée au bon endroit tant que la
 * personne ne l’a pas refermée, puis mémorisée comme vue.
 */
export function ContextualTip({ hintId, title, children, className }: {
  hintId: string
  title: string
  children: ReactNode
  className?: string
}) {
  const { ready, isHintSeen, markHintSeen } = useAccessibilityPreferences()
  const [dismissedHere, setDismissedHere] = useState(false)
  if (dismissedHere) return <DismissedNotice text="Astuce masquée." />
  if (!ready || isHintSeen(hintId)) return null
  const dismiss = () => { setDismissedHere(true); markHintSeen(hintId) }
  return (
    <aside aria-label={`Astuce : ${title}`} className={cn("flex gap-3 rounded-xl border border-sky-700 bg-sky-50 p-4 text-sky-950", className)}>
      <Lightbulb className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold"><span className="sr-only">Astuce : </span>{title}</p>
        <div className="mt-1">{children}</div>
        <button type="button" onClick={dismiss} className="mt-3 rounded-lg border border-sky-800 bg-white px-3 py-1.5 text-sm font-medium hover:bg-sky-100">
          J’ai compris
        </button>
      </div>
      <button type="button" onClick={dismiss} className="self-start rounded-lg p-1 hover:bg-sky-100" aria-label={`Masquer l’astuce « ${title} »`}>
        <X className="size-5" aria-hidden="true" />
      </button>
    </aside>
  )
}

/** Guide de première visite (D12) : visible jusqu’à ce que la personne le masque. */
export function FirstVisitGuide({ hintId, title, intro, steps, className }: {
  hintId: string
  title: string
  intro?: ReactNode
  steps: { title: string; text: ReactNode; done?: boolean; action?: ReactNode }[]
  className?: string
}) {
  const { ready, isHintSeen, markHintSeen } = useAccessibilityPreferences()
  const [dismissedHere, setDismissedHere] = useState(false)
  if (dismissedHere) return <DismissedNotice text="Guide masqué. Vous pourrez le revoir depuis le bouton Affichage." />
  if (!ready || isHintSeen(hintId)) return null
  const titleId = `${hintId}-titre`
  const doneCount = steps.filter((step) => step.done).length
  return (
    <section aria-labelledby={titleId} className={cn("rounded-2xl border-2 border-teal-700 bg-white p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
          {intro && <div className="mt-1 text-slate-700">{intro}</div>}
          <p className="mt-1 text-sm text-slate-700">{doneCount} étape(s) sur {steps.length} déjà faite(s).</p>
        </div>
        <button
          type="button"
          onClick={() => { setDismissedHere(true); markHintSeen(hintId) }}
          className="rounded-lg border border-slate-400 px-3 py-2 text-sm font-medium hover:bg-slate-100"
        >
          Masquer le guide
        </button>
      </div>
      <ol className="mt-5 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col rounded-xl border border-slate-300 p-4">
            <p className="flex items-center gap-2 font-semibold">
              <span aria-hidden="true" className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-sm", step.done ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-500")}>
                {step.done ? "✓" : index + 1}
              </span>
              <span>
                <span className="sr-only">Étape {index + 1} : </span>{step.title}
                {step.done && <span className="ml-1 text-sm font-normal text-emerald-800">(fait)</span>}
              </span>
            </p>
            <div className="mt-2 flex-1 text-slate-700">{step.text}</div>
            {step.action && <div className="mt-3">{step.action}</div>}
          </li>
        ))}
      </ol>
    </section>
  )
}
