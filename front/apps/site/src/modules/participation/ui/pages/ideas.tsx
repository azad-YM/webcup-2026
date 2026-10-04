"use client"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import Link from "next/link"
import { LogIn, MapPin } from "@boilerplate/shared-ui/components/icon"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { FormAnnouncement, SelectField, TextAreaField, TextField } from "@/modules/shared/ui/components/form-field"
import { useSession } from "@/modules/shared/ui/store-provider"
import { PARTICIPATION_POLLING_MS, useListDistrictsQuery, useListIdeasQuery, useProposeIdeaMutation } from "../../core/application/rtk-api/city-participation"
import { NOT_CITIZEN } from "../../core/domain/participation"
import { formatDate, formatDateTime, IDEA_LIMITS, validateIdea, type IdeaDraft, type MyIdea } from "../../core/domain/participation"
import { IdeaStatusBadge, useLogoutOnUnauthorized } from "../components/participation-ui"

const EMPTY: IdeaDraft = { title: "", description: "", district: "" }

function IdeaForm() {
  const [draft, setDraft] = useState<IdeaDraft>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<"title" | "description", string>>>({})
  const [sent, setSent] = useState<MyIdea | null>(null)
  const districts = useListDistrictsQuery()
  const [propose, { isLoading, error }] = useProposeIdeaMutation()
  useLogoutOnUnauthorized(error)
  const sending = useRef(false)
  const receipt = useRef<HTMLHeadingElement>(null)
  const failure = toQueryError(error)
  useEffect(() => { if (sent) receipt.current?.focus() }, [sent])

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (sending.current) return
    const found = validateIdea(draft)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    sending.current = true
    try {
      setSent(await propose(draft).unwrap())
      setDraft(EMPTY)
    } catch {
      /* Message affiché par FormAnnouncement. */
    } finally {
      sending.current = false
    }
  }

  return (
    <div className="space-y-5">
      {sent && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
          <h3 ref={receipt} tabIndex={-1} className="text-lg font-semibold outline-none">Merci, votre idée est bien reçue</h3>
          <p className="mt-1">Numéro <strong>{sent.reference}</strong>, reçue le <time dateTime={sent.createdAt}>{formatDateTime(sent.createdAt)}</time>. Vous serez prévenu dans votre espace à chaque étape.</p>
          <p className="mt-1"><Link href="/espace/contributions" className="font-medium underline">Suivre mes idées</Link></p>
        </div>
      )}
      {failure?.code === NOT_CITIZEN ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">{failure.data} <Link href="/espace" className="font-medium underline">Mon espace</Link></p>
      ) : (
        <form onSubmit={(event) => void send(event)} noValidate className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6" aria-labelledby="titre-proposer" data-brouillon="idee">
          <h2 id="titre-proposer" className="text-xl font-semibold">Proposer une idée</h2>
          <TextField id="idee-titre" label="Titre de votre idée" required maxLength={IDEA_LIMITS.title} error={errors.title} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <TextAreaField id="idee-description" label="Description" hint="Expliquez ce que vous proposez et pourquoi. N’indiquez pas de données personnelles : les idées sont visibles par tous les habitants." required rows={6} maxLength={IDEA_LIMITS.description} error={errors.description} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          <SelectField id="idee-quartier" label="Quartier concerné" optional placeholder="Toute la ville" options={(districts.data ?? []).map((value) => ({ value, label: value }))} value={draft.district} onChange={(event) => setDraft({ ...draft, district: event.target.value })} />
          <FormAnnouncement tone="error">{failure && failure.status !== 401 ? failure.data : null}</FormAnnouncement>
          <button type="submit" disabled={isLoading} className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60">{isLoading ? "Envoi…" : "Envoyer mon idée"}</button>
        </form>
      )}
    </div>
  )
}

/** Boîte à idées (F68) : idées publiques des habitants et formulaire pour le citoyen connecté. */
export function IdeasPage() {
  const { ready, hasToken } = useSession()
  const { data, error, isFetching, refetch } = useListIdeasQuery(undefined, polling(PARTICIPATION_POLLING_MS))
  return (
    <>
      <PageHeader
        trail={[{ label: "Participer", href: "/participer" }, { label: "Boîte à idées" }]}
        title="La boîte à idées"
        lead="Proposez vos idées pour améliorer la colonie. Chaque idée reçoit un numéro et la ville indique où elle en est : reçue, à l’étude, retenue, non retenue (avec le motif) ou réalisée."
      />
      <PageBody>
        <div className="grid gap-10 lg:grid-cols-[2fr_3fr]">
          <div>
            {!ready ? (
              <LoadingState label="Vérification de votre session…" />
            ) : hasToken ? (
              <IdeaForm />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6" role="status">
                <LogIn className="size-8 text-teal-700" aria-hidden="true" />
                <h2 className="mt-3 text-xl font-semibold">Connectez-vous pour proposer une idée</h2>
                <p className="mt-2 text-slate-700">Vous suivrez ensuite sa prise en compte dans votre espace citoyen.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/connexion?retour=/participer/idees" className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">Se connecter</Link>
                  <Link href="/inscription" className="rounded-xl border border-slate-300 px-5 py-3 font-medium hover:bg-slate-50">Créer un compte</Link>
                </div>
              </div>
            )}
          </div>
          <section aria-labelledby="titre-idees-publiques">
            <h2 id="titre-idees-publiques" className="text-2xl font-semibold tracking-tight">Les idées des habitants</h2>
            <div className="mt-5">
              {error ? (
                <ErrorState message={toQueryError(error)?.data ?? "Impossible de charger les idées."} onRetry={() => void refetch()} retrying={isFetching} />
              ) : !data ? (
                <LoadingState label="Chargement des idées"><SkeletonCards count={2} /></LoadingState>
              ) : data.length === 0 ? (
                <EmptyState title="Aucune idée publiée pour le moment.">Soyez le premier à proposer une idée !</EmptyState>
              ) : (
                <ul className="space-y-4">
                  {data.map((idea) => (
                    <li key={idea.id}>
                      <article aria-labelledby={`idee-${idea.id}`} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <IdeaStatusBadge status={idea.status} />
                          <span className="inline-flex items-center gap-1 text-sm text-slate-700"><MapPin className="size-4" aria-hidden="true" />{idea.district ?? "Toute la ville"}</span>
                        </div>
                        <h3 id={`idee-${idea.id}`} className="mt-2 text-lg font-semibold text-slate-950">{idea.title}</h3>
                        <p className="mt-2 whitespace-pre-wrap text-slate-800">{idea.description}</p>
                        {idea.statusComment && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-slate-800"><span className="font-medium">Réponse de la ville :</span> {idea.statusComment}</p>}
                        <p className="mt-2 text-sm text-slate-600">{idea.reference} · proposée le <time dateTime={idea.createdAt}>{formatDate(idea.createdAt)}</time></p>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </PageBody>
    </>
  )
}
