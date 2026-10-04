"use client"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { ShieldCheck } from "lucide-react"
import {
  fetchFormToken,
  idempotencyKey,
  withSubmission,
  type FormChallenge,
  type SubmissionContext,
} from "@boilerplate/shared-utils/submission-guard"

/**
 * Envoi protégé d’un formulaire (L25, ADR 012) :
 * - F82 : bouton bloqué pendant l’envoi, clé d’idempotence par contenu (un double clic ou un retour arrière ne
 *   crée rien de plus ; `duplicate` signale que l’API a rendu la réponse du premier envoi) ;
 * - F81 (si `form` est donné) : jeton de formulaire demandé à l’affichage, champ piège invisible, et seulement en
 *   cas de doute une question en langage clair posée par `FormProtection`.
 *
 * Usage : `const guard = useProtectedSubmit({ apiBaseUrl, form: "demande" })`, puis
 * `await guard.submit(payload, () => mutation(payload).unwrap())` et `<FormProtection guard={guard} />` dans le
 * formulaire. `submit` renvoie `undefined` si un envoi est déjà en cours (double clic ignoré).
 */
export type ProtectedSubmit = {
  submitting: boolean
  duplicate: boolean
  challenge: FormChallenge | null
  answer: string
  setAnswer: (value: string) => void
  trap: string
  setTrap: (value: string) => void
  guarded: boolean
  /** Message à afficher quand la protection a retenu l’envoi (question posée, robot, envoi déjà en cours). */
  refusal: string | null
  /** Vrai si le dernier envoi réussi était un rejeu (réponse du premier envoi rendue par l’API). */
  wasReplay: () => boolean
  submit: <T>(payload: unknown, run: () => Promise<T>) => Promise<T | undefined>
}

export class SubmissionRefusedError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = "SubmissionRefusedError"
  }
}

const CHALLENGE_MESSAGE = "Pour confirmer que cet envoi vient bien d’une personne, répondez à la question sous le formulaire, puis envoyez de nouveau."

export function useProtectedSubmit({ apiBaseUrl, form }: { apiBaseUrl?: string; form?: string }): ProtectedSubmit {
  const [submitting, setSubmitting] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const [challenge, setChallenge] = useState<FormChallenge | null>(null)
  const [answer, setAnswer] = useState("")
  const [trap, setTrap] = useState("")
  const [refusal, setRefusal] = useState<string | null>(null)
  const busy = useRef(false)
  const replay = useRef(false)
  const token = useRef<string | null>(null)

  useEffect(() => {
    if (!form || !apiBaseUrl) return
    let cancelled = false
    void fetchFormToken(apiBaseUrl, form).then((value) => {
      if (!cancelled) token.current = value
    })
    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, form])

  const submit = useCallback(async <T,>(payload: unknown, run: () => Promise<T>): Promise<T | undefined> => {
    if (busy.current) return undefined
    busy.current = true
    setSubmitting(true)
    setDuplicate(false)
    setRefusal(null)
    replay.current = false
    const headers: Record<string, string> = { "Idempotency-Key": idempotencyKey(form ?? "envoi", payload) }
    if (form) {
      if (token.current) headers["X-Form-Token"] = token.current
      if (trap.trim() !== "") headers["X-Form-Trap"] = trap
      if (challenge && answer.trim() !== "") headers["X-Form-Challenge"] = `${challenge.token}:${encodeURIComponent(answer.trim())}`
    }
    const context: SubmissionContext = { headers }
    try {
      const result = await withSubmission(context, run)
      setChallenge(null)
      setAnswer("")
      replay.current = Boolean(context.replayed)
      setDuplicate(replay.current)
      return result
    } catch (error) {
      if (context.challenge) {
        setChallenge(context.challenge)
        setAnswer("")
        const message = context.code === "challenge_failed" ? `${context.message ?? "La réponse n’est pas la bonne."} Répondez à la nouvelle question, puis envoyez de nouveau.` : CHALLENGE_MESSAGE
        setRefusal(message)
        throw new SubmissionRefusedError(message, context.code)
      }
      if (context.code === "form_rejected" || context.code === "submission_in_progress" || context.code === "idempotency_key_reused") {
        const message = context.message ?? "Envoi refusé."
        setRefusal(message)
        throw new SubmissionRefusedError(message, context.code)
      }
      throw error
    } finally {
      busy.current = false
      setSubmitting(false)
    }
  }, [answer, challenge, form, trap])

  const wasReplay = useCallback(() => replay.current, [])
  return { submitting, duplicate, challenge, answer, setAnswer, trap, setTrap, guarded: Boolean(form), refusal, wasReplay, submit }
}

/**
 * Éléments visibles et invisibles de la protection : champ piège masqué aux personnes (et aux lecteurs d’écran),
 * question de vérification accessible si l’API en pose une, mention « protégé contre les envois automatiques ».
 */
export function FormProtection({ guard, duplicateMessage }: { guard: ProtectedSubmit; duplicateMessage?: string }) {
  const id = useId()
  return (
    <div className="space-y-3">
      {guard.guarded ? (
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
          <label htmlFor={`${id}-site`}>Ne remplissez pas ce champ</label>
          <input
            id={`${id}-site`}
            name="site_web"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={guard.trap}
            onChange={(event) => guard.setTrap(event.target.value)}
          />
        </div>
      ) : null}
      {guard.challenge ? (
        <div className="rounded-xl border-2 border-amber-600 bg-amber-50 p-4 text-amber-950" role="group" aria-labelledby={`${id}-question`}>
          <label id={`${id}-question`} htmlFor={`${id}-answer`} className="block font-semibold">
            Vérification : {guard.challenge.question}
          </label>
          <input
            id={`${id}-answer`}
            inputMode="numeric"
            autoComplete="off"
            className="mt-2 w-32 rounded-lg border border-amber-700 bg-white px-3 py-2 text-base"
            value={guard.answer}
            onChange={(event) => guard.setAnswer(event.target.value)}
            aria-describedby={`${id}-help`}
          />
          <p id={`${id}-help`} className="mt-1 text-sm">Cette question protège la mairie contre les robots. Elle n’est posée qu’en cas de doute.</p>
        </div>
      ) : null}
      {guard.duplicate ? (
        <p role="status" className="rounded-xl border border-sky-700 bg-sky-50 p-3 text-sm font-medium text-sky-950">
          {duplicateMessage ?? "Votre envoi a déjà été reçu : il n’a pas été enregistré une seconde fois."}
        </p>
      ) : null}
      {guard.guarded ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
          Ce formulaire est protégé contre les envois automatiques.
        </p>
      ) : null}
    </div>
  )
}

/** Libellé du bouton d’envoi : « Envoi en cours… » pendant l’envoi. */
export function submitLabel(guard: Pick<ProtectedSubmit, "submitting">, label: string): string {
  return guard.submitting ? "Envoi en cours…" : label
}
