import type { LocalePreferenceGateway } from "../../i18n/locale-preference.gateway"
import { isLocale, type Locale } from "../../i18n/locales"

/** Langue mémorisée dans le navigateur ; un stockage indisponible n’empêche pas de changer de langue. */
export class LocalStorageLocalePreferenceGateway implements LocalePreferenceGateway {
  constructor(private readonly key: string) {}

  read(): Locale | null {
    try {
      const value = window.localStorage.getItem(this.key)
      return isLocale(value) ? value : null
    } catch {
      return null
    }
  }

  write(locale: Locale) {
    try {
      window.localStorage.setItem(this.key, locale)
    } catch {
      /* Le choix reste valable pour la page en cours. */
    }
  }
}
