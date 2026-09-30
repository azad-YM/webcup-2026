import { createApi } from "@reduxjs/toolkit/query/react"
import { fakeBaseQuery } from "@reduxjs/toolkit/query"
import { withUseCase } from "@/modules/shared/core/config/use-cases"
import type { Item } from "../../domain/item"
import type { CreateItemPayload, UpdateItemPayload } from "../dto/item.dto"
import { createItem, deleteItem, listItems, updateItem } from "../usecases/crud-item.usecase"

export const itemApi = createApi({
  reducerPath: "itemApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Item"],
  endpoints: (build) => ({
    listItems: build.query<Item[], void>({
      queryFn: withUseCase(listItems),
      providesTags: ["Item"],
    }),
    createItem: build.mutation<Item, CreateItemPayload>({
      queryFn: withUseCase(createItem),
      invalidatesTags: ["Item"],
    }),
    updateItem: build.mutation<Item, UpdateItemPayload>({
      queryFn: withUseCase(updateItem),
      invalidatesTags: ["Item"],
    }),
    deleteItem: build.mutation<void, { id: string }>({
      queryFn: withUseCase(deleteItem),
      invalidatesTags: ["Item"],
    }),
  }),
})

export const {
  useListItemsQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
} = itemApi
