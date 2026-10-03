"use client"
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react"
import {
  applyDisplayPreferences,
  DEFAULT_DISPLAY_PREFERENCES,
  type DisplayPreferences,
  type DisplayPreferencesGateway,
} from "../../a11y/display-preferences"
import { createInMemorySeenHintsGateway, type SeenHintsGateway } from "../../a11y/seen-hints"

type Snapshot = {
  /** Faux pendant le rendu serveur et l’hydratation : les indications ne s’affichent qu’ensuite. */
  ready: boolean
  preferences: DisplayPreferences
  seenHints: string[]
}

const SERVER_SNAPSHOT: Snapshot = { ready: false, preferences: DEFAULT_DISPLAY_PREFERENCES, seenHints: [] }

function createPreferencesStore(display: DisplayPreferencesGateway, hints: SeenHintsGateway) {
  let snapshot: Snapshot | null = null
  const listeners = new Set<() => void>()
  const read = (): Snapshot => (snapshot ??= { ready: true, preferences: display.load(), seenHints: hints.list() })
  const emit = (next: Snapshot) => {
    snapshot = next
    listeners.forEach((listener) => listener())
  }
  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    getSnapshot: read,
    setPreferences(preferences: DisplayPreferences) {
      display.save(preferences)
      applyDisplayPreferences(preferences)
      emit({ ...read(), preferences })
    },
    markHintSeen(hintId: string) {
      hints.markSeen(hintId)
      const current = read()
      if (!current.seenHints.includes(hintId)) emit({ ...current, seenHints: [...current.seenHints, hintId] })
    },
    resetHints() {
      hints.reset()
      emit({ ...read(), seenHints: [] })
    },
  }
}

type PreferencesStore = ReturnType<typeof createPreferencesStore>
const PreferencesContext = createContext<PreferencesStore | null>(null)

/**
 * Fournit les préférences d’affichage et les indications déjà vues. Les
 * gateways sont composées par l’application (clé de stockage propre).
 */
export function AccessibilityPreferencesProvider({ displayGateway, hintsGateway, children }: {
  displayGateway: DisplayPreferencesGateway
  hintsGateway?: SeenHintsGateway
  children: ReactNode
}) {
  const [store] = useState(() => createPreferencesStore(displayGateway, hintsGateway ?? createInMemorySeenHintsGateway()))
  // Le script de démarrage (site) ou `main.tsx` (admin) a déjà appliqué les préférences ; on resynchronise par sécurité.
  useEffect(() => { applyDisplayPreferences(store.getSnapshot().preferences) }, [store])
  return <PreferencesContext.Provider value={store}>{children}</PreferencesContext.Provider>
}

export function useAccessibilityPreferences() {
  const store = useContext(PreferencesContext)
  if (!store) throw new Error("AccessibilityPreferencesProvider manquant")
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, () => SERVER_SNAPSHOT)
  return {
    ...snapshot,
    setPreferences: store.setPreferences,
    updatePreferences: (patch: Partial<DisplayPreferences>) => store.setPreferences({ ...snapshot.preferences, ...patch }),
    resetPreferences: () => store.setPreferences({ ...DEFAULT_DISPLAY_PREFERENCES }),
    isHintSeen: (hintId: string) => snapshot.seenHints.includes(hintId),
    markHintSeen: store.markHintSeen,
    resetHints: store.resetHints,
  }
}
