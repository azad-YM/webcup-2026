/**
 * Langues de l’interface du site (D14) : français par défaut, anglais et arabe.
 * Mécanisme volontairement simple pour l’export statique : chaque module déclare
 * ses propres messages avec `defineMessages` (français obligatoire, autres langues
 * facultatives clé par clé) et les lit avec `useMessages`. Une clé absente retombe
 * sur le français.
 */
export const LOCALES = ["fr", "en", "ar"] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "fr"

/** Nom de chaque langue écrit dans cette langue (sélecteur). */
export const LOCALE_LABELS: Record<Locale, string> = { fr: "Français", en: "English", ar: "العربية" }
/** Sens de lecture : l’arabe se lit de droite à gauche. */
export const LOCALE_DIRECTION: Record<Locale, "ltr" | "rtl"> = { fr: "ltr", en: "ltr", ar: "rtl" }
/** Locale `Intl` pour les dates et nombres (chiffres latins en arabe, plus lisibles pour les numéros). */
export const INTL_LOCALE: Record<Locale, string> = { fr: "fr-FR", en: "en-GB", ar: "ar-u-nu-latn" }

export const LOCALE_STORAGE_KEY = "nova-terra.site.langue"

export const isLocale = (value: unknown): value is Locale => typeof value === "string" && (LOCALES as readonly string[]).includes(value)

export type MessageCatalog = Record<string, string>
export type Messages<T extends MessageCatalog> = { fr: T } & { [L in Exclude<Locale, "fr">]?: Partial<T> }

/** Déclare les messages d’un écran ; le français sert de référence et de repli. */
export const defineMessages = <T extends MessageCatalog>(messages: Messages<T>): Messages<T> => messages

export function pickMessages<T extends MessageCatalog>(messages: Messages<T>, locale: Locale): T {
  if (locale === "fr") return messages.fr
  const translated = messages[locale] ?? {}
  return { ...messages.fr, ...Object.fromEntries(Object.entries(translated).filter(([, value]) => typeof value === "string" && value !== "")) } as T
}

/** Remplace `{nom}` par la valeur correspondante. */
export const format = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match))

/**
 * Script de `<head>` : applique la langue mémorisée (`lang`, `dir`) avant le premier rendu,
 * pour que la mise en page de droite à gauche ne saute pas à l’hydratation.
 */
export const localeBootScript = (key: string) =>
  `(function(){try{var l=localStorage.getItem(${JSON.stringify(key)});if(l==="en"||l==="ar"){document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";}}catch(e){}})();`
