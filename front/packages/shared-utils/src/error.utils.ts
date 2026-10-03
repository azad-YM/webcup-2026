/**
 * Message d’erreur lisible par tous (D13) : les messages rédigés par l’API ou
 * les gateways sont conservés ; les erreurs techniques (réseau, statut HTTP,
 * objets bruts) sont remplacées par une phrase simple.
 */
const NETWORK_MESSAGE = "Le service ne répond pas. Vérifiez votre connexion internet, puis réessayez."
const STATUS_MESSAGES: Partial<Record<string, string>> = {
  FETCH_ERROR: NETWORK_MESSAGE,
  NETWORK_ERROR: NETWORK_MESSAGE,
  TIMEOUT_ERROR: "Le service met trop de temps à répondre. Réessayez dans un instant.",
  PARSING_ERROR: "La réponse du service est illisible. Réessayez dans un instant.",
  "400": "Certaines informations ne sont pas valides. Vérifiez le formulaire.",
  "401": "Vous avez été déconnecté pour votre sécurité. Reconnectez-vous.",
  "403": "Vous n’avez pas l’autorisation de faire cette action.",
  "404": "Cet élément est introuvable. Il a peut-être été supprimé.",
  "409": "Cet élément a été modifié entre-temps. Rechargez la page, puis réessayez.",
  "422": "Certaines informations ne sont pas valides. Vérifiez le formulaire.",
  "429": "Trop de tentatives. Patientez quelques minutes, puis réessayez.",
}
const SERVER_ERROR = "Le service rencontre un problème. Réessayez dans quelques minutes."
const UNKNOWN_ERROR = "Une erreur inattendue s’est produite. Réessayez."

const looksTechnical = (text: string) =>
  /^(TypeError|Error|SyntaxError)\b|Failed to fetch|NetworkError|Load failed|Unexpected token|^\s*[{[]/i.test(text)

const fromStatus = (status: unknown): string | null => {
  if (status === undefined || status === null) return null
  const message = STATUS_MESSAGES[String(status)]
  if (message) return message
  if (typeof status === "number" && status >= 500) return SERVER_ERROR
  return null
}

const readable = (text: string, status?: unknown) =>
  looksTechnical(text) ? fromStatus(status) ?? NETWORK_MESSAGE : text

/** Message porté par un corps de réponse API (Symfony / API Platform). */
const fromBody = (data: unknown): string | null => {
  if (typeof data === "string" && data.trim() !== "") return data
  if (data && typeof data === "object") {
    const body = data as Record<string, unknown>
    for (const key of ["message", "detail", "hydra:description", "title", "data"]) {
      const value = body[key]
      if (typeof value === "string" && value.trim() !== "") return value
    }
  }
  return null
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return readable(error.message)

  if (error && typeof error === "object") {
    const record = error as { status?: unknown; data?: unknown; error?: unknown; message?: unknown }
    const direct = fromBody(record.data)
    if (direct) return readable(direct, record.status)

    const nested = record.error
    if (typeof nested === "string") return readable(nested, record.status)
    const nestedMessage = fromBody(nested)
    if (nestedMessage) return readable(nestedMessage, record.status)

    const byStatus = fromStatus(record.status)
    if (byStatus) return byStatus

    if (typeof record.message === "string") return readable(record.message)
    return UNKNOWN_ERROR
  }

  if (typeof error === "string" && error.trim() !== "") return readable(error)
  return UNKNOWN_ERROR
}
