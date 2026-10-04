"use client"
import { lazy, Suspense, useEffect, useId, useRef, useState } from "react"
import Link from "@/modules/shared/ui/link"
import type { Route } from "next"
import { usePathname } from "next/navigation"
import { MessageCircleQuestion, X } from "@boilerplate/shared-ui/components/icon"
import { isCurrentSection } from "@/modules/shared/ui/navigation"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { ASSISTANT_MESSAGES } from "../i18n/assistant-messages"

/** La conversation n’est chargée qu’à la première ouverture (code séparé, aucun appel réseau avant). */
const AssistantConversation = lazy(() => import("../sections/assistant-conversation"))

/**
 * Bouton flottant « Besoin d’aide ? » (F91, F92), présent sur toutes les pages sauf celle de l’assistant.
 * Panneau non modal : titre relié, Échap ferme, le focus revient au bouton.
 */
export function AssistantLauncher() {
  const t = useMessages(ASSISTANT_MESSAGES)
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])
  if (isCurrentSection(pathname, "/aide/assistant")) return null
  const close = () => { setOpen(false); trigger.current?.focus() }
  return (
    <div className="fixed bottom-4 end-4 z-50 flex flex-col items-end gap-3 print:hidden">
      {loaded && (
        <section
          id={`${id}-panneau`}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${id}-titre`}
          hidden={!open}
          className="w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 id={`${id}-titre`} className="text-lg font-semibold">{t.title}</h2>
            <button type="button" onClick={close} aria-label={t.close} className="rounded-lg p-1 hover:bg-slate-100"><X className="size-5" aria-hidden="true" /></button>
          </div>
          <Suspense fallback={<p role="status">…</p>}>
            {open && <AssistantConversation compact />}
          </Suspense>
          <p className="mt-3 text-sm"><Link href={"/aide/assistant" as Route} onClick={() => setOpen(false)} className="font-medium text-teal-800 underline underline-offset-4">{t.openPage}</Link></p>
        </section>
      )}
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={loaded ? `${id}-panneau` : undefined}
        aria-label={open ? t.close : t.launcherLabel}
        onClick={() => { setLoaded(true); setOpen(!open) }}
        className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-3 font-semibold text-white shadow-lg hover:bg-teal-800"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <MessageCircleQuestion className="size-5" aria-hidden="true" />}
        <span>{t.launcher}</span>
      </button>
    </div>
  )
}
