import { useMemo, useState } from "react"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useDeleteItemMutation, useListItemsQuery } from "@/modules/example/core/application/rtk-api/item"

export const useListItems = () => {
  const { data, isLoading, isError, error, refetch } = useListItemsQuery()
  const [deleteItem, { isLoading: isDeleting }] = useDeleteItemMutation()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const items = useMemo(() => data ?? [], [data])

  const onDelete = async (itemId: string) => {
    if (isDeleting || !window.confirm("Supprimer cet élément ?")) {
      return
    }

    setDeleteError(null)
    try {
      await deleteItem({ id: itemId }).unwrap()
    } catch (reason) {
      setDeleteError(getErrorMessage(reason))
    }
  }

  return {
    items,
    isLoading,
    isError,
    errorMessage: isError ? getErrorMessage(error) : null,
    deleteError,
    isDeleting,
    onDelete,
    retry: () => void refetch(),
    columns: [
      { name: "Nom", key: "name" },
      { name: "Description", key: "description" },
      { name: "Statut", key: "status" },
    ],
  }
}
