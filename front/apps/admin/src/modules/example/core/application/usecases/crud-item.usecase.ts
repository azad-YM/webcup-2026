import type { UseCase } from "@/modules/shared/core/config/use-cases"
import type { Item } from "../../domain/item"
import type { CreateItemPayload, UpdateItemPayload } from "../dto/item.dto"

export const listItems: UseCase<void, Item[]> = async (_dispatch, _getState, dependencies) =>
  dependencies.itemGateway.list()

export const createItem: UseCase<CreateItemPayload, Item> = async (_dispatch, _getState, dependencies, payload) =>
  dependencies.itemGateway.create({ name: payload.name.trim(), description: payload.description.trim() })

export const updateItem: UseCase<UpdateItemPayload, Item> = async (_dispatch, _getState, dependencies, payload) =>
  dependencies.itemGateway.update({ ...payload, name: payload.name.trim(), description: payload.description.trim() })

export const deleteItem: UseCase<{ id: string }, void> = async (_dispatch, _getState, dependencies, { id }) =>
  dependencies.itemGateway.remove(id)
