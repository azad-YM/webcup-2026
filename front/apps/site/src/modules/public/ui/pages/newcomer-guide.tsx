"use client"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import Link from "next/link"
import type { Route } from "next"
import { ArrowRight, UserRound } from "@boilerplate/shared-ui/components/icon"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { useSession } from "@/modules/shared/ui/store-provider"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { CONTENT_POLLING_MS, useListServicesQuery } from "../../core/application/rtk-api/public"
import { findService, type MunicipalService } from "../../core/domain/municipal-service"
import { firstSteps, isComplete, NEEDS, recommendedServiceIds, type Household, type NewcomerAnswers } from "../../core/domain/newcomer-guide"
import { NEWCOMER_MESSAGES } from "../i18n/newcomer-messages"
import { PLACES_MESSAGES } from "../i18n/places-messages"
import { ServiceCard } from "../components/content-cards"

const HOUSEHOLDS: Household[] = ["alone", "couple", "children"]
const radioClass = "flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 font-medium has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50"

function RecommendedServices({ ids }: { ids: string[] }) {
  const places = useMessages(PLACES_MESSAGES)
  const { data, error, isFetching, refetch } = useListServicesQuery(undefined, polling(CONTENT_POLLING_MS))
  if (error) return <ErrorState message={toQueryError(error)?.data ?? places.loadError} onRetry={() => void refetch()} retrying={isFetching} />
  if (!data) return <LoadingState label={places.loadingPlaces}><SkeletonCards count={3} /></LoadingState>
  const services = ids.map((id) => findService(data, id)).filter((service): service is MunicipalService => service !== null)
  return (
    <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => <li key={service.id}><ServiceCard service={service} /></li>)}
    </ol>
  )
}

/** F72 : « Nouvel arrivant, par où commencer » — sans inscription ; connecté, on propose de compléter le profil. */
export function NewcomerGuidePage() {
  const t = useMessages(NEWCOMER_MESSAGES)
  const { ready, hasToken } = useSession()
  const connected = ready && hasToken
  const [answers, setAnswers] = useState<NewcomerAnswers>({ household: null, needs: [], healthCare: null })
  const [submitted, setSubmitted] = useState(false)
  const [tried, setTried] = useState(false)
  const resultTitle = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (submitted) resultTitle.current?.focus() }, [submitted])
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setTried(true)
    if (isComplete(answers)) setSubmitted(true)
  }
  const toggleNeed = (need: (typeof NEEDS)[number], checked: boolean) =>
    setAnswers({ ...answers, needs: checked ? [...answers.needs, need] : answers.needs.filter((item) => item !== need) })
  return (
    <>
      <PageHeader trail={[{ label: t.title }]} title={t.title} lead={t.lead}>
        {connected && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-teal-950">
            <p>{t.connectedNote}</p>
            <Link href="/espace/profil" className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
              <UserRound className="size-4" aria-hidden="true" /> {t.completeProfile}
            </Link>
          </div>
        )}
      </PageHeader>
      <PageBody>
        {!submitted ? (
          <form onSubmit={submit} aria-labelledby="titre-situation" className="max-w-3xl space-y-8">
            <h2 id="titre-situation" className="text-2xl font-semibold tracking-tight">{t.questionsTitle}</h2>
            <fieldset aria-describedby={tried && answers.household === null ? "situation-incomplete" : undefined}>
              <legend className="text-lg font-semibold">{t.q1}</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {HOUSEHOLDS.map((household) => (
                  <label key={household} className={radioClass}>
                    <input type="radio" name="foyer" className="size-5 accent-teal-700" checked={answers.household === household} onChange={() => setAnswers({ ...answers, household })} />
                    {t[household]}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-lg font-semibold">{t.q2}</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {NEEDS.map((need) => (
                  <label key={need} className={radioClass}>
                    <input type="checkbox" className="size-5 accent-teal-700" checked={answers.needs.includes(need)} onChange={(event) => toggleNeed(need, event.target.checked)} />
                    {t[need]}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset aria-describedby={tried && answers.healthCare === null ? "situation-incomplete" : undefined}>
              <legend className="text-lg font-semibold">{t.q3}</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {([true, false] as const).map((value) => (
                  <label key={String(value)} className={radioClass}>
                    <input type="radio" name="soins" className="size-5 accent-teal-700" checked={answers.healthCare === value} onChange={() => setAnswers({ ...answers, healthCare: value })} />
                    {value ? t.yes : t.no}
                  </label>
                ))}
              </div>
            </fieldset>
            {tried && !isComplete(answers) && <p id="situation-incomplete" role="alert" className="font-medium text-red-800">{t.incomplete}</p>}
            <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-xl bg-teal-700 px-6 font-semibold text-white hover:bg-teal-800">
              {t.show} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          </form>
        ) : (
          <div className="space-y-12">
            <section aria-labelledby="titre-demarches">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 id="titre-demarches" ref={resultTitle} tabIndex={-1} className="text-2xl font-semibold tracking-tight">{t.stepsTitle}</h2>
                  <p className="mt-1 text-slate-700">{t.stepsLead}</p>
                </div>
                <button type="button" onClick={() => setSubmitted(false)} className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50">{t.restart}</button>
              </div>
              <ol className="mt-5 space-y-3">
                {firstSteps(answers, connected).map((step, index) => (
                  <li key={step.code} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <input id={`etape-${step.code}`} type="checkbox" className="size-5 accent-teal-700" />
                    <label htmlFor={`etape-${step.code}`} className="flex-1 font-medium"><span className="text-slate-500">{index + 1}. </span>{t[`step_${step.code}`]}</label>
                    <Link href={step.href as Route} className="font-medium text-teal-800 underline underline-offset-4">{t.open}</Link>
                  </li>
                ))}
              </ol>
            </section>
            <section aria-labelledby="titre-services-utiles">
              <h2 id="titre-services-utiles" className="text-2xl font-semibold tracking-tight">{t.servicesTitle}</h2>
              <p className="mt-1 text-slate-700">{t.servicesLead}</p>
              <div className="mt-5"><RecommendedServices ids={recommendedServiceIds(answers)} /></div>
            </section>
          </div>
        )}
      </PageBody>
    </>
  )
}
