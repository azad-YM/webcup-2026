import { useEffect, useMemo, useState } from "react"
import { useForm } from "@boilerplate/shared-ui/hooks"
import { z, zodResolver } from "@boilerplate/shared-ui/lib"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useCreateItemMutation, useListItemsQuery, useUpdateItemMutation } from "@/modules/example/core/application/rtk-api/item"
import { ITEM_DESCRIPTION_MAX_LENGTH, ITEM_NAME_MAX_LENGTH, isDuplicateItemName } from "@/modules/example/core/domain/item"

const itemFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(ITEM_NAME_MAX_LENGTH, `${ITEM_NAME_MAX_LENGTH} caractères maximum.`),
  description: z.string().trim().max(ITEM_DESCRIPTION_MAX_LENGTH, `${ITEM_DESCRIPTION_MAX_LENGTH} caractères maximum.`),
  status: z.enum(["active", "archived"]),
})

export type ItemFormValues = z.infer<typeof itemFormSchema>

const defaultValues: ItemFormValues = { name: "", description: "", status: "active" }

export const useItemForm = ({ itemId, onClose }: { itemId?: string | null; onClose: () => void }) => {
  const { data } = useListItemsQuery()
  const [createItem, { isLoading: isCreating }] = useCreateItemMutation()
  const [updateItem, { isLoading: isUpdating }] = useUpdateItemMutation()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const item = useMemo(() => data?.find((candidate) => candidate.id === itemId) ?? null, [data, itemId])

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(item ? { name: item.name, description: item.description, status: item.status } : defaultValues)
  }, [item, form])

  const isSubmitting = isCreating || isUpdating

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSubmitting) return
    // Early feedback only: the API remains the authority on uniqueness.
    if (isDuplicateItemName(data ?? [], values.name, itemId)) {
      form.setError("name", { message: "Un élément porte déjà ce nom." })
      return
    }

    setSubmitError(null)
    try {
      if (itemId) {
        await updateItem({ id: itemId, ...values }).unwrap()
      } else {
        await createItem({ name: values.name, description: values.description }).unwrap()
      }
      onClose()
      form.reset(defaultValues)
    } catch (reason) {
      setSubmitError(getErrorMessage(reason))
    }
  })

  return {
    form,
    onSubmit,
    isSubmitting,
    submitError,
    isEditing: Boolean(itemId),
    title: itemId ? "Modifier un élément" : "Ajouter un élément",
    submitLabel: itemId ? "Enregistrer les modifications" : "Ajouter l’élément",
  }
}
