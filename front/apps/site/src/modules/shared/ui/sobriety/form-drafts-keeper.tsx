"use client"
import { useState } from "react"
import { LocalStorageFormDraftGateway } from "../../core/infrastructure/storage/form-draft.local-storage.gateway"
import { FormDrafts } from "./form-drafts"

export const FORM_DRAFTS_KEY = "nova-terra.site.brouillons"

/** Composition des brouillons de formulaire (L17, F59) : adaptateur de stockage local injecté derrière le port. */
export function FormDraftsKeeper() {
  const [gateway] = useState(() => new LocalStorageFormDraftGateway(FORM_DRAFTS_KEY))
  return <FormDrafts gateway={gateway} />
}
