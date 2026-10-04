"use client"
import { useId } from "react"
import { Languages } from "@boilerplate/shared-ui/components/icon"
import { isLocale, LOCALE_LABELS, LOCALES } from "../../core/i18n/locales"
import { useLocale, useMessages } from "./i18n-provider"
import { COMMON_MESSAGES } from "./common-messages"

/**
 * Sélecteur de langue de l’en-tête (D14) : liste native, étiquette visible, chaque langue écrite dans sa langue.
 * `compact` : version de la barre utilitaire, dont l’étiquette n’est lue qu’aux lecteurs d’écran sous `sm`.
 */
export function LanguageSwitcher({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const id = useId()
  const { locale, setLocale } = useLocale()
  const t = useMessages(COMMON_MESSAGES)
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <label htmlFor={id} className="inline-flex items-center gap-1 text-sm font-medium text-slate-800">
        <Languages className="size-4" aria-hidden="true" />
        <span className={compact ? "sr-only sm:not-sr-only" : undefined}>{t.language}</span>
      </label>
      <select
        id={id}
        value={locale}
        onChange={(event) => { if (isLocale(event.target.value)) setLocale(event.target.value) }}
        className={`${compact ? "h-8" : "h-10"} rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium text-slate-900`}
      >
        {LOCALES.map((code) => <option key={code} value={code} lang={code}>{LOCALE_LABELS[code]}</option>)}
      </select>
    </div>
  )
}
