"use client"
import { useSyncExternalStore } from "react"
import { isLightModeActive } from "@boilerplate/shared-ui/a11y"
import { useAccessibilityPreferences } from "@boilerplate/shared-ui/components/a11y"

/**
 * Mode léger (L17, F62). Deux origines :
 * - le choix de l’habitant dans le panneau « Affichage » (mémorisé sur l’appareil par la gateway L4) ;
 * - une activation temporaire, pour la visite en cours, quand le serveur annonce un mode dégradé (surcharge).
 * Dans les deux cas `<html data-light="on">` porte l’état : le CSS, l’espacement des mises à jour et la coupure
 * du temps réel le lisent.
 */
export type TemporaryLightModeReason = "degraded"

let temporary: TemporaryLightModeReason | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** Active le mode léger pour cette visite seulement (sans modifier la préférence mémorisée). */
export function activateTemporaryLightMode(reason: TemporaryLightModeReason) {
  if (temporary || typeof document === "undefined") return
  temporary = reason
  document.documentElement.setAttribute("data-light", "on")
  emit()
}

/** Termine l’activation temporaire ; le mode léger reste actif si l’habitant l’a choisi. */
export function endTemporaryLightMode(chosenByResident: boolean) {
  if (!temporary) return
  temporary = null
  if (!chosenByResident) document.documentElement.removeAttribute("data-light")
  emit()
}

export function useLightMode() {
  const { preferences } = useAccessibilityPreferences()
  const reason = useSyncExternalStore(subscribe, () => temporary, () => null)
  return { active: preferences.lightMode || reason !== null, chosen: preferences.lightMode, temporaryReason: reason }
}

export { isLightModeActive }
