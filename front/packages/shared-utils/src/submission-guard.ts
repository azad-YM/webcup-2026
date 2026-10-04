/**
 * Envois protégés (L25, ADR 012) — F81 (robots) et F82 (envois multiples), sans dépendance à React.
 *
 * Pendant un envoi, `withSubmission(context, fn)` rend le contexte « actif » : `ApiClient` ajoute alors ses en-têtes
 * à la première écriture (POST, PUT, PATCH, DELETE) et y consigne ce que l’API a répondu (défi anti-robot, envoi
 * rejoué, envoi déjà en cours). Les gateways n’ont rien à changer : elles traduisent les erreurs comme avant, et
 * l’écran lit le contexte. Le hook React correspondant est `useProtectedSubmit` (`@boilerplate/shared-ui`).
 */

export type FormChallenge = { token: string; question: string }

export type SubmissionContext = {
  headers: Record<string, string>
  /** Défi renvoyé par l’API (`428`) : poser la question puis renvoyer avec la réponse. */
  challenge?: FormChallenge
  /** Message de l’API lorsqu’elle refuse ou retient l’envoi (robot, envoi déjà en cours…). */
  message?: string
  /** Code de refus de l’API (`form_rejected`, `challenge_required`, `submission_in_progress`…). */
  code?: string
  /** Vrai si l’API a rejoué la réponse d’un envoi identique déjà reçu (`Idempotent-Replayed`). */
  replayed?: boolean
}

let active: SubmissionContext | null = null

/** Contexte de l’envoi en cours, lu par `ApiClient` pour les écritures. */
export function activeSubmission(): SubmissionContext | null {
  return active
}

export async function withSubmission<T>(context: SubmissionContext, run: () => Promise<T>): Promise<T> {
  active = context
  try {
    return await run()
  } finally {
    if (active === context) active = null
  }
}

/** Consigne la réponse de l’API dans le contexte actif (appelé par `ApiClient`). */
export function recordSubmissionResponse(context: SubmissionContext, response: Response, body: unknown): void {
  if (response.headers.get("Idempotent-Replayed") === "true") context.replayed = true
  if (response.ok || !body || typeof body !== "object") return
  const payload = body as { code?: unknown; error?: unknown; challenge?: unknown }
  if (typeof payload.code === "string") context.code = payload.code
  if (typeof payload.error === "string") context.message = payload.error
  const challenge = payload.challenge as Partial<FormChallenge> | undefined
  if (response.status === 428 && challenge && typeof challenge.token === "string" && typeof challenge.question === "string") {
    context.challenge = { token: challenge.token, question: challenge.question }
  }
}

/** Empreinte courte et stable d’un contenu (non cryptographique : la clé est aussi liée à la session côté API). */
export function fingerprint(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? null)
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

const SALT_KEY = "nt.submission-salt"

/** Sel propre à l’onglet (stockage de session) : survit au retour arrière, pas à un nouvel onglet. */
function tabSalt(): string {
  try {
    const existing = window.sessionStorage.getItem(SALT_KEY)
    if (existing) return existing
    const salt = Math.random().toString(36).slice(2, 12)
    window.sessionStorage.setItem(SALT_KEY, salt)
    return salt
  } catch {
    return "volatile"
  }
}

/**
 * Clé d’idempotence d’une intention d’envoi : même formulaire + même contenu dans le même onglet → même clé,
 * donc un double clic ou un renvoi après retour arrière est reconnu par l’API et ne crée rien de plus.
 */
export function idempotencyKey(form: string, payload: unknown): string {
  return `${form.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 30) || "envoi"}-${tabSalt()}-${fingerprint(payload)}`
}

/** Jeton d’un formulaire protégé contre les robots ; null si l’API ne répond pas (elle posera alors une question). */
export async function fetchFormToken(apiBaseUrl: string, form: string): Promise<string | null> {
  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/forms/token?form=${encodeURIComponent(form)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!response.ok) return null
    const body = (await response.json()) as { token?: string }
    return body.token ?? null
  } catch {
    return null
  }
}
