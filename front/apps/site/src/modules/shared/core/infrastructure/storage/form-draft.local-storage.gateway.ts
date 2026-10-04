import type { FormDraft, FormDraftGateway } from "../../application/ports/form-draft.gateway"

/** Un brouillon est oublié au bout de sept jours. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Brouillons dans le stockage local, sous une seule clé. Un stockage indisponible (navigation privée,
 * quota) n’empêche pas de remplir le formulaire : le brouillon n’est simplement pas conservé.
 */
export class LocalStorageFormDraftGateway implements FormDraftGateway {
  constructor(private readonly storageKey: string, private readonly now: () => number = Date.now) {}

  private all(): Record<string, FormDraft> {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(this.storageKey) ?? "{}") as Record<string, FormDraft>
      if (!parsed || typeof parsed !== "object") return {}
      const fresh: Record<string, FormDraft> = {}
      for (const [key, draft] of Object.entries(parsed)) {
        if (draft && typeof draft.savedAt === "number" && this.now() - draft.savedAt < MAX_AGE_MS && draft.fields && typeof draft.fields === "object") fresh[key] = draft
      }
      return fresh
    } catch {
      return {}
    }
  }

  private save(drafts: Record<string, FormDraft>) {
    try {
      if (Object.keys(drafts).length === 0) window.localStorage.removeItem(this.storageKey)
      else window.localStorage.setItem(this.storageKey, JSON.stringify(drafts))
    } catch {
      /* Stockage indisponible : la saisie reste dans la page. */
    }
  }

  read(key: string) {
    return this.all()[key] ?? null
  }

  write(key: string, draft: FormDraft) {
    this.save({ ...this.all(), [key]: draft })
  }

  remove(key: string) {
    const drafts = this.all()
    delete drafts[key]
    this.save(drafts)
  }

  clear() {
    this.save({})
  }
}
