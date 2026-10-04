"use client"
import { useState } from "react"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { PLAIN_MESSAGES } from "../i18n/plain-messages"

/**
 * F89 : interrupteur « Version en langage clair ». Activé, la version validée par la mairie s’affiche
 * en premier, au-dessus du texte complet. Rien n’est affiché si la fiche n’a pas de version en clair.
 */
export function PlainLanguageSwitch({ text }: { text?: string }) {
  const t = useMessages(PLAIN_MESSAGES)
  const [on, setOn] = useState(false)
  if (!text) return null
  return (
    <div className="mb-6">
      <button type="button" role="switch" aria-checked={on} onClick={() => setOn(!on)} className="inline-flex items-center gap-3 rounded-full border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-50">
        <span aria-hidden="true" className={`relative inline-block h-5 w-9 rounded-full transition ${on ? "bg-teal-700" : "bg-slate-300"}`}>
          <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${on ? "start-[1.125rem]" : "start-0.5"}`} />
        </span>
        {t.plainToggle}
      </button>
      {on && (
        <section aria-label={t.plainTitle} className="mt-4 rounded-2xl border-2 border-teal-600 bg-teal-50 p-5">
          <h2 className="text-lg font-semibold">{t.plainTitle}</h2>
          <p className="mt-2 text-lg leading-8 text-slate-900" lang="fr">{text}</p>
          <p className="mt-2 text-sm text-slate-700">{t.plainOrigin}</p>
        </section>
      )}
    </div>
  )
}
