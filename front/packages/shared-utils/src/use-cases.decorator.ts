import { useCaseBaseQuery } from "./rtk-query.decorator"
import type {
  UseCaseBaseQueryApi,
  UseCaseBaseQueryResult,
} from "./rtk-query.decorator"

export type UseCase<P, R, State, Dependencies, Dispatch> = (
  dispatch: Dispatch,
  getState: () => State,
  dependencies: Dependencies,
  params: P
) => Promise<R>

type UseCaseHandler<P, R> = (params: P, api: unknown) => Promise<UseCaseBaseQueryResult<R>>

export const withUseCase = <P, R, State, Dependencies, Dispatch>(
  useCase: UseCase<P, R, State, Dependencies, Dispatch>
): UseCaseHandler<P, R> =>
  async (params: P, api: unknown): Promise<UseCaseBaseQueryResult<R>> => {
    const typedApi = api as UseCaseBaseQueryApi<State, Dependencies, Dispatch>
    return useCaseBaseQuery(
      { executeCase: useCase, params },
      typedApi
    )
  }
