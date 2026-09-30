import type { Dispatch, UnknownAction } from "@reduxjs/toolkit"
import { withUseCase as withSharedUseCase } from "@boilerplate/shared-utils/use-cases.decorator"
import type { Dependencies } from "./dependencies"
import type { AppState } from "./store"
import type { UseCaseBaseQueryResult } from "@boilerplate/shared-utils/rtk-query.decorator"

export type UseCaseDispatch = Dispatch<UnknownAction>

// Keep a function signature here: eagerly instantiating the shared generic with
// AppState creates a type cycle through the store's RTK Query endpoints.
export type UseCase<P = void, R = unknown> = (
  dispatch: UseCaseDispatch,
  getState: () => AppState,
  dependencies: Dependencies,
  params: P
) => Promise<R>

type UseCaseHandler<P, R> = (params: P, api: unknown) => Promise<UseCaseBaseQueryResult<R>>

export const withUseCase = <P, R>(useCase: UseCase<P, R>): UseCaseHandler<P, R> =>
  withSharedUseCase<P, R, AppState, Dependencies, UseCaseDispatch>(useCase)
