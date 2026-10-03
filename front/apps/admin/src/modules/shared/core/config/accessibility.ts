import {
  applyDisplayPreferences,
  createLocalStorageDisplayPreferencesGateway,
  createLocalStorageSeenHintsGateway,
} from "@boilerplate/shared-ui/a11y"

/**
 * Composition des préférences d’interface de l’admin (L4) : adaptateurs de
 * stockage local propres à l’admin derrière les ports de `@boilerplate/shared-ui`.
 */
export const accessibilityGateways = {
  display: createLocalStorageDisplayPreferencesGateway("nova-terra.admin.affichage"),
  hints: createLocalStorageSeenHintsGateway("nova-terra.admin.indications-vues"),
}

/** Appelé avant le premier rendu React : les préférences s’appliquent sans flash. */
export function applyStoredDisplayPreferences() {
  applyDisplayPreferences(accessibilityGateways.display.load())
}
