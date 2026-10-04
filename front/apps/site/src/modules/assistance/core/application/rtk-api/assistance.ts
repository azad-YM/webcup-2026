import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { withUseCase, type QueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { OrientationReply, OrientParams } from "../../domain/orientation"
import { orient } from "../usecases/orient.usecase"

export const assistanceApi = createApi({
  reducerPath: "assistanceApi",
  baseQuery: fakeBaseQuery<QueryError>(),
  endpoints: (build) => ({
    orient: build.mutation<OrientationReply, OrientParams>({ queryFn: withUseCase(orient) })
  })
})

export const { useOrientMutation } = assistanceApi
