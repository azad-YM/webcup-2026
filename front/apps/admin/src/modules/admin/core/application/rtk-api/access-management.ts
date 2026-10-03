import { createApi } from "@reduxjs/toolkit/query/react"
import { fakeBaseQuery } from "@reduxjs/toolkit/query"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import type { AccessSpace, Permission } from "../../domain/permission"
import type { AdminMember, AdminRole } from "../../domain/member"
import type { CreateRolePayload } from "../dto/create-role.dto"
import type { AddMemberPayload, AddMemberResult } from "../dto/add-member.dto"
import { listPermissions } from "../usecases/list-permissions.usecase"
import { createRole } from "../usecases/create-role.usecase"
import { listRoles } from "../usecases/list-roles.usecase"
import { listMembers } from "../usecases/list-members.usecase"
import { addMember } from "../usecases/add-member.usecase"

export const accessManagementApi = createApi({
  reducerPath: "accessManagementApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Roles", "Members"],
  endpoints: (build) => ({
    listPermissions: build.query<Permission[], AccessSpace>({
      queryFn: withUseCase(listPermissions),
    }),
    listRoles: build.query<AdminRole[], void>({
      queryFn: withUseCase(listRoles),
      providesTags: ["Roles"],
    }),
    createRole: build.mutation<void, CreateRolePayload>({
      queryFn: withUseCase(createRole),
      invalidatesTags: (_result, error) => error ? [] : ["Roles"],
    }),
    listMembers: build.query<AdminMember[], void>({
      queryFn: withUseCase(listMembers),
      providesTags: ["Members"],
    }),
    addMember: build.mutation<AddMemberResult, AddMemberPayload>({
      queryFn: withUseCase(addMember),
      invalidatesTags: (_result, error) => error ? [] : ["Members"],
    }),
  }),
})

export const {
  useListPermissionsQuery,
  useCreateRoleMutation,
  useListRolesQuery,
  useListMembersQuery,
  useAddMemberMutation,
} = accessManagementApi
