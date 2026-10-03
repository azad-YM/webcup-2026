"use client"
import { useState, type ReactNode } from "react"
import {
  AccessibilityPreferencesProvider,
  createLocalStorageDisplayPreferencesGateway,
  createLocalStorageSeenHintsGateway
} from "@boilerplate/shared-ui/components/a11y"
import { DISPLAY_PREFERENCES_KEY, SEEN_HINTS_KEY } from "./accessibility-keys"

/**
 * Composition des préférences d’affichage et des indications vues (L4) :
 * adaptateurs de stockage local propres au site, injectés derrière les ports
 * de `@boilerplate/shared-ui`. Aucun accès direct au stockage ailleurs.
 */
export function SiteAccessibilityProvider({ children }: { children: ReactNode }) {
  const [gateways] = useState(() => ({
    display: createLocalStorageDisplayPreferencesGateway(DISPLAY_PREFERENCES_KEY),
    hints: createLocalStorageSeenHintsGateway(SEEN_HINTS_KEY)
  }))
  return (
    <AccessibilityPreferencesProvider displayGateway={gateways.display} hintsGateway={gateways.hints}>
      {children}
    </AccessibilityPreferencesProvider>
  )
}
