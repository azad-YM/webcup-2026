/**
 * Indications déjà vues (D12, F35) : guide de première visite et astuces
 * contextuelles refermées par la personne. Préférence d’interface, propre
 * au navigateur : aucune donnée métier.
 */

/** Port : identifiants des indications que la personne a déjà vues ou refermées. */
export interface SeenHintsGateway {
  list(): string[]
  markSeen(hintId: string): void
  /** Réaffiche toutes les indications (bouton « Revoir les astuces »). */
  reset(): void
}

export function createLocalStorageSeenHintsGateway(storageKey: string): SeenHintsGateway {
  const read = (): string[] => {
    try {
      const value: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]")
      return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
    } catch {
      return []
    }
  }
  return {
    list: read,
    markSeen(hintId) {
      const seen = read()
      if (seen.includes(hintId)) return
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...seen, hintId]))
      } catch {
        /* Stockage indisponible : l’indication est masquée pour cette page seulement. */
      }
    },
    reset() {
      try {
        window.localStorage.removeItem(storageKey)
      } catch {
        /* Rien à effacer. */
      }
    },
  }
}

/** Adaptateur mémoire (tests, rendu serveur) : rien n’est conservé. */
export function createInMemorySeenHintsGateway(initial: string[] = []): SeenHintsGateway {
  let seen = [...initial]
  return {
    list: () => [...seen],
    markSeen(hintId) {
      if (!seen.includes(hintId)) seen = [...seen, hintId]
    },
    reset() {
      seen = []
    },
  }
}
