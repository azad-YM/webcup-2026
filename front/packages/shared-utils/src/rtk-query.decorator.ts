import { getErrorMessage } from "./error.utils"
import type { UseCase } from "./use-cases.decorator"

export type UseCaseBaseQueryApi<State, Dependencies, Dispatch> = {
  dispatch: Dispatch
  getState: () => State
  extra: Dependencies
}

export type UseCaseBaseQueryResult<R> =
  | { data: R }
  | {
      error: {
        status: "USE_CASE_ERROR"
        data: string
      }
    }

export const useCaseBaseQuery =
  async <P, R, State, Dependencies, Dispatch>(
    args: {
      executeCase: UseCase<P, R, State, Dependencies, Dispatch>
      params: P
    },
    api: UseCaseBaseQueryApi<State, Dependencies, Dispatch>
  ): Promise<UseCaseBaseQueryResult<R>> => {
    const { executeCase, params } = args
    const { extra: dependencies, getState, dispatch } = api

    try {
      const data = await executeCase(
        dispatch,
        getState,
        dependencies,
        params
      )

      return { data }
    } catch (error) {
      const message = getErrorMessage(error)
      return {
        error: {
          status: "USE_CASE_ERROR",
          data: message,
        },
      }
    }
  }
