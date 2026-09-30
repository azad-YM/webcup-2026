import type { BaseQueryApi } from "@reduxjs/toolkit/query"
import type { Dependencies } from "../config/dependencies"
export class AuthError extends Error {
  constructor(
    public status: number | "NETWORK_ERROR" | "CLIENT_ERROR",
    message: string
  ) {
    super(message)
  }
}
export type UseCase<P, R> = (
  dependencies: Dependencies,
  params: P
) => Promise<R>
export type QueryError = {
  status: number | "NETWORK_ERROR" | "CLIENT_ERROR"
  data: string
}
export const withUseCase =
  <P, R>(useCase: UseCase<P, R>) =>
  async (params: P, api: BaseQueryApi) => {
    try {
      return { data: await useCase(api.extra as Dependencies, params) }
    } catch (error) {
      return {
        error: {
          status:
            error instanceof AuthError
              ? error.status
              : ("CLIENT_ERROR" as const),
          data:
            error instanceof AuthError
              ? error.message
              : "Une erreur est survenue. Veuillez réessayer."
        }
      }
    }
  }
