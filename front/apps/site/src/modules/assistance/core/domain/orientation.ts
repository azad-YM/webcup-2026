import type { Locale } from "@/modules/shared/core/i18n/locales"

/**
 * Assistant d’orientation (F91, F92), servi par le BC Assistance (`POST /assistance/orientation`).
 * La conversation reste dans la page : elle est renvoyée entière à chaque tour et n’est stockée nulle part.
 */
export type OrientationRole = "user" | "assistant"
export type OrientationMessage = { role: OrientationRole; text: string }

export type OrientationActionType = "service" | "request" | "report" | "appointment" | "call" | "emergency" | "welcome" | "participation"

export type OrientationAction = {
  type: OrientationActionType
  href: string
  serviceId?: string
  serviceName?: string
  number?: string
}

export type OrientationReply = {
  reply: string
  /** Question de précision posée par le modèle, le cas échéant. */
  question: string | null
  /** Réponses rapides proposées (thèmes, choix entre deux services). */
  suggestions: string[]
  /** De 0 à 3 actions concrètes, déjà validées par l’API contre le catalogue. */
  actions: OrientationAction[]
  urgent: boolean
  emergencyNumbers: string[]
  source: "model" | "local"
  modelAvailable: boolean
}

export type OrientParams = { messages: OrientationMessage[]; locale: Locale }

/** Conversation courte : au plus 4 questions de l’habitant, 8 messages envoyés, 600 caractères par message. */
export const MAX_USER_TURNS = 4
export const MAX_SENT_MESSAGES = 8
export const MAX_MESSAGE_LENGTH = 600

export const userTurns = (messages: OrientationMessage[]) => messages.filter((message) => message.role === "user").length

/** Derniers messages envoyés à l’API, en commençant par un message de l’habitant. */
export function messagesToSend(messages: OrientationMessage[]): OrientationMessage[] {
  const recent = messages.slice(-MAX_SENT_MESSAGES)
  const firstUser = recent.findIndex((message) => message.role === "user")
  return firstUser < 0 ? [] : recent.slice(firstUser)
}
