/**
 * Préférences d’affichage (F23, F24, F43, F44) : taille du texte, contraste
 * élevé, réduction des animations. Module pur (sans React) : utilisable dans
 * un composant serveur Next.js pour générer le script d’initialisation.
 *
 * Les préférences sont appliquées sur `<html>` par des attributs `data-*`
 * que `global.css` interprète :
 * - `data-text-size="100|125|150"` : taille de base du texte (les tailles sont en `rem`) ;
 * - `data-contrast="high"` : palette renforcée et soulignement des liens ;
 * - `data-motion="reduce"` : animations et transitions coupées ;
 * - `data-light="on"` : mode léger (F62, L17) — pas d’images décoratives, pas d’animations,
 *   mise en page simplifiée ; l’application concernée coupe aussi le temps réel et espace les mises à jour.
 */

export const TEXT_SIZES = ["100", "125", "150"] as const
export type TextSize = (typeof TEXT_SIZES)[number]

export type DisplayPreferences = {
  textSize: TextSize
  highContrast: boolean
  reduceMotion: boolean
  /** Mode léger (F62) : proposé par le site, ignoré par les applications qui ne l’affichent pas. */
  lightMode: boolean
}

export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  textSize: "100",
  highContrast: false,
  reduceMotion: false,
  lightMode: false,
}

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  "100": "Normale (100 %)",
  "125": "Grande (125 %)",
  "150": "Très grande (150 %)",
}

/** Port : lecture et enregistrement des préférences d’affichage de la personne. */
export interface DisplayPreferencesGateway {
  load(): DisplayPreferences
  save(preferences: DisplayPreferences): void
}

const isTextSize = (value: unknown): value is TextSize => TEXT_SIZES.includes(value as TextSize)

/** Valide une valeur stockée : toute donnée inattendue retombe sur les valeurs par défaut. */
export function normalizeDisplayPreferences(value: unknown): DisplayPreferences {
  if (!value || typeof value !== "object") return { ...DEFAULT_DISPLAY_PREFERENCES }
  const raw = value as Record<string, unknown>
  return {
    textSize: isTextSize(raw.textSize) ? raw.textSize : DEFAULT_DISPLAY_PREFERENCES.textSize,
    highContrast: raw.highContrast === true,
    reduceMotion: raw.reduceMotion === true,
    lightMode: raw.lightMode === true,
  }
}

/** Applique les préférences sur l’élément racine (par défaut `<html>`). */
export function applyDisplayPreferences(preferences: DisplayPreferences, root: HTMLElement = document.documentElement) {
  root.setAttribute("data-text-size", preferences.textSize)
  if (preferences.highContrast) root.setAttribute("data-contrast", "high")
  else root.removeAttribute("data-contrast")
  if (preferences.reduceMotion) root.setAttribute("data-motion", "reduce")
  else root.removeAttribute("data-motion")
  if (preferences.lightMode) root.setAttribute("data-light", "on")
  else root.removeAttribute("data-light")
}

/** Vrai si le mode léger est appliqué sur la page (préférence ou activation temporaire). Faux côté serveur. */
export function isLightModeActive(root?: HTMLElement): boolean {
  if (!root && typeof document === "undefined") return false
  return (root ?? document.documentElement).getAttribute("data-light") === "on"
}

/**
 * Adaptateur navigateur : stockage local sous une clé propre à l’application.
 * Un stockage indisponible (navigation privée, quota) n’empêche pas
 * l’affichage : on retombe sur les valeurs par défaut et l’enregistrement
 * échoue silencieusement (les préférences restent actives pour la page).
 */
export function createLocalStorageDisplayPreferencesGateway(storageKey: string): DisplayPreferencesGateway {
  return {
    load() {
      try {
        const stored = window.localStorage.getItem(storageKey)
        return normalizeDisplayPreferences(stored ? JSON.parse(stored) : null)
      } catch {
        return { ...DEFAULT_DISPLAY_PREFERENCES }
      }
    },
    save(preferences) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(normalizeDisplayPreferences(preferences)))
      } catch {
        /* Stockage indisponible : la préférence reste appliquée pour cette page. */
      }
    },
  }
}

/**
 * Script bloquant à placer dans `<head>` (site exporté statiquement) : applique
 * les préférences enregistrées avant le premier affichage, sans flash. Il lit
 * la même clé et le même format que `createLocalStorageDisplayPreferencesGateway`.
 */
export function displayPreferencesBootScript(storageKey: string): string {
  return `(function(){try{var r=document.documentElement,p=JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})||"null")||{};` +
    `r.setAttribute("data-text-size",["100","125","150"].indexOf(p.textSize)>=0?p.textSize:"100");` +
    `if(p.highContrast===true)r.setAttribute("data-contrast","high");` +
    `if(p.reduceMotion===true)r.setAttribute("data-motion","reduce");` +
    `if(p.lightMode===true)r.setAttribute("data-light","on");}catch(e){}})();`
}
