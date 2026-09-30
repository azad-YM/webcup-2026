import { useState } from "react"
import { ItemForm } from "../modals/item-form/item-form"
import { ListItemsSection } from "../sections/item-list/list-items"

export function ItemsPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Éléments</h1>
          <p className="mt-1 text-muted-foreground">
            Module d’exemple branché sur le BC Example de l’API. Dupliquez-le pour démarrer un nouveau module.
          </p>
        </div>
        <ItemForm open={open} setOpen={setOpen} triggerLabel="Ajouter un élément" />
      </div>
      <ListItemsSection />
    </div>
  )
}
