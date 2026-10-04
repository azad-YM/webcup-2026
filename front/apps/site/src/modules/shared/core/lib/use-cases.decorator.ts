import type { BaseQueryApi } from "@reduxjs/toolkit/query"
import type { Dependencies } from "../config/dependencies"

export type ErrorStatus = number | "NETWORK_ERROR" | "CLIENT_ERROR"

/**
 * Erreur contractuelle levée par les use cases et les gateways.
 * `message` est toujours un texte français affichable ; `code` et `field`
 * permettent à l’interface d’adapter son comportement sans analyser le texte.
 */
export class AppError extends Error {
  constructor(
    public status: ErrorStatus,
    message: string,
    public details: { code?: string; field?: string } = {}
  ) {
    super(message)
  }
}

/** Erreur historique du module auth, conservée pour compatibilité. */
export class AuthError extends AppError {}

export type UseCase<P, R> = (
  dependencies: Dependencies,
  params: P
) => Promise<R>

export type QueryError = {
  status: ErrorStatus
  data: string
  code?: string
  field?: string
}

const GENERIC_MESSAGE = "Une erreur est survenue. Veuillez réessayer."

export const withUseCase =
  <P, R>(useCase: UseCase<P, R>) =>
  async (params: P, api: BaseQueryApi) => {
    try {
      return { data: await useCase(api.extra as Dependencies, params) }
    } catch (error) {
      if (error instanceof AppError) {
        const queryError: QueryError = { status: error.status, data: error.message }
        if (error.details.code) queryError.code = error.details.code
        if (error.details.field) queryError.field = error.details.field
        return { error: queryError }
      }
      return { error: { status: "CLIENT_ERROR" as const, data: GENERIC_MESSAGE } }
    }
  }

/** Lit une erreur RTK Query produite par `withUseCase`. */
export function toQueryError(error: unknown): QueryError | null {
  if (!error || typeof error !== "object" || !("status" in error)) return null
  const candidate = error as Partial<QueryError>
  return {
    status: candidate.status ?? "CLIENT_ERROR",
    data: typeof candidate.data === "string" ? candidate.data : GENERIC_MESSAGE,
    code: candidate.code,
    field: candidate.field
  }
}

export const isUnauthorized = (error: unknown) => toQueryError(error)?.status === 401
