"use client"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  DEFAULT_LOCALE,
  INTL_LOCALE,
  LOCALE_DIRECTION,
  LOCALE_STORAGE_KEY,
  pickMessages,
  type Locale,
  type MessageCatalog,
  type Messages
} from "../../core/i18n/locales"
import { LocalStorageLocalePreferenceGateway } from "../../core/infrastructure/i18n/locale-preference.local-storage.gateway"

type I18n = { locale: Locale; dir: "ltr" | "rtl"; intlLocale: string; setLocale: (locale: Locale) => void }

const I18nContext = createContext<I18n>({
  locale: DEFAULT_LOCALE,
  dir: "ltr",
  intlLocale: INTL_LOCALE[DEFAULT_LOCALE],
  setLocale: () => undefined
})

/**
 * Langue de l’interface (D14). Le rendu statique est en français ; la langue mémorisée
 * est appliquée après l’hydratation, et `<html lang dir>` suit le choix.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [gateway] = useState(() => new LocalStorageLocalePreferenceGateway(LOCALE_STORAGE_KEY))
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  useEffect(() => {
    const stored = gateway.read()
    // Lecture unique du stockage après l’hydratation (export statique rendu en français).
    if (stored) setLocaleState(stored)
  }, [gateway])
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = LOCALE_DIRECTION[locale]
  }, [locale])
  const setLocale = useCallback((next: Locale) => {
    gateway.write(next)
    setLocaleState(next)
  }, [gateway])
  const value = useMemo(() => ({ locale, dir: LOCALE_DIRECTION[locale], intlLocale: INTL_LOCALE[locale], setLocale }), [locale, setLocale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useLocale = () => useContext(I18nContext)

/** Messages de l’écran dans la langue choisie, avec repli en français clé par clé. */
export function useMessages<T extends MessageCatalog>(messages: Messages<T>): T {
  const { locale } = useLocale()
  return useMemo(() => pickMessages(messages, locale), [messages, locale])
}
