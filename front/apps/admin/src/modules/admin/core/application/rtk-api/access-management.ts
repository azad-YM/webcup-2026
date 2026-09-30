import { createApi } from "@reduxjs/toolkit/query/react"
import { fakeBaseQuery } from "@reduxjs/toolkit/query"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import type { AccessSpace, Permission } from "../../domain/permission"
import type { CreateRolePayload } from "../dto/create-role.dto"
import { listPermissions } from "../usecases/list-permissions.usecase"
import { createRole } from "../usecases/create-role.usecase"

export const accessManagementApi = createApi({
  reducerPath: "accessManagementApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (build) => ({
    listPermissions: build.query<Permission[], AccessSpace>({
      queryFn: withUseCase(listPermissions),
    }),
    createRole: build.mutation<void, CreateRolePayload>({
      queryFn: withUseCase(createRole),
    }),
  }),
})

export const { useListPermissionsQuery, useCreateRoleMutation } = accessManagementApi
