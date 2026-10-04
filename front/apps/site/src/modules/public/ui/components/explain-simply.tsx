"use client"
import { useId, useState } from "react"
import Link from "@/modules/shared/ui/link"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { useLocale, useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { useLazyExplainPassageQuery } from "../../core/application/rtk-api/public"
import { findGlossaryTerms, type DifficultTerm } from "../../core/domain/service-search"
import { GLOSSARY } from "../pages/glossary"
import { PLAIN_MESSAGES } from "../i18n/plain-messages"

/**
 * F90 : bouton discret « Expliquer simplement » sous un passage. L’explication s’affiche en dessous, sans changer
 * la page, avec son origine (IA ou repli local). Repli : version en clair validée (F89) et mots difficiles
 * (lexique d’Assistance et glossaire du site). Aucun appel tant que l’habitant ne clique pas.
 */
export function ExplainSimply({ text, plainVersion }: { text: string; plainVersion?: string }) {
  const t = useMessages(PLAIN_MESSAGES)
  const { locale } = useLocale()
  const [open, setOpen] = useState(false)
  const [explain, { data, error, isFetching }] = useLazyExplainPassageQuery()
  const id = useId()
  const toggle = () => {
    if (!open) void explain({ text: text.slice(0, 2000), locale }, true)
    setOpen(!open)
  }
  const terms: DifficultTerm[] = data ? [...data.terms] : []
  if (data && !data.explanation) {
    for (const entry of findGlossaryTerms(text, GLOSSARY)) {
      if (!terms.some((term) => term.term.toLowerCase() === entry.term.toLowerCase())) terms.push({ term: entry.term, definition: entry.definition })
    }
  }
  return (
    <div className="mt-2">
      <button type="button" onClick={toggle} aria-expanded={open} aria-controls={`${id}-explication`} className="rounded-lg px-2 py-1 text-sm font-medium text-teal-800 underline underline-offset-4 hover:bg-teal-50">
        {open ? t.hideExplanation : t.explain}
      </button>
      <div id={`${id}-explication`} hidden={!open} aria-live="polite" className="mt-2">
        {open && (
          <div className="rounded-xl border-s-4 border-teal-600 bg-teal-50 p-4 text-base text-slate-900">
            <p className="font-semibold">{t.explanationTitle}</p>
            {isFetching ? (
              <p role="status" className="mt-1">{t.explaining}</p>
            ) : error ? (
              <p role="alert" className="mt-1">{toQueryError(error)?.data}</p>
            ) : data?.explanation ? (
              <>
                <p className="mt-1 whitespace-pre-line">{data.explanation}</p>
                <p className="mt-2 text-sm text-slate-700">{t.fromModel}</p>
              </>
            ) : data ? (
              <>
                {plainVersion && <p className="mt-1"><span className="font-medium">{t.validatedPlain}</span> <span lang="fr">{plainVersion}</span></p>}
                {terms.length > 0 ? (
                  <dl className="mt-2 space-y-1" lang="fr">
                    {terms.map((term) => <div key={term.term}><dt className="inline font-semibold">{term.term} : </dt><dd className="inline">{term.definition}</dd></div>)}
                  </dl>
                ) : !plainVersion && <p className="mt-1">{t.noTerm}</p>}
                <p className="mt-2 text-sm text-slate-700">{t.fromLocal} <Link href="/aide/glossaire" className="font-medium text-teal-800 underline">{t.glossaryLink}</Link></p>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
