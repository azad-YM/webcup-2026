import type { Locale } from "./locales"

/** Mémorisation de la langue choisie par le visiteur (D14). */
export interface LocalePreferenceGateway {
  read(): Locale | null
  write(locale: Locale): void
}
