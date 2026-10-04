import { HeaderNotifications, HeaderSpaces } from "./header-slots"
import { FormDraftsKeeper } from "@/modules/shared/ui/sobriety/form-drafts-keeper"
import { ConnectionStatus } from "@/modules/shared/ui/sobriety/connection-status"
import { AlertBanner } from "@/modules/public/ui/sections/alerts"
import { AssistantLauncher } from "@/modules/assistance/ui/components/assistant-launcher"
import { StoreProvider } from "@/modules/shared/ui/store-provider"
import type { Metadata } from "next"
import "@boilerplate/shared-ui/global.css"
import "./nova-terra.css"
import { siteEnv } from "@/config/env"
import { contentSecurityPolicy } from "@/config/content-security-policy"
import { SkipLink, MAIN_CONTENT_ID } from "@/modules/shared/ui/layout/skip-link"
import { SiteHeader } from "@/modules/shared/ui/layout/site-header"
import { SiteFooter } from "@/modules/shared/ui/layout/site-footer"
import { displayPreferencesBootScript } from "@boilerplate/shared-ui/a11y"
import { SiteAccessibilityProvider } from "@/modules/shared/ui/accessibility-provider"
import { DISPLAY_PREFERENCES_KEY } from "@/modules/shared/ui/accessibility-keys"
import { I18nProvider } from "@/modules/shared/ui/i18n/i18n-provider"
import { LOCALE_STORAGE_KEY, localeBootScript } from "@/modules/shared/core/i18n/locales"

const description = "Le portail officiel de Nova Terra, première ville humaine sur une autre planète : services municipaux, actualités et espace citoyen."

export const metadata: Metadata = {
  metadataBase: new URL(siteEnv.siteUrl),
  title: { default: "Nova Terra — portail des habitants", template: "%s | Nova Terra" },
  description,
  openGraph: { type: "website", locale: "fr_FR", url: "/", siteName: "Nova Terra", title: "Nova Terra — portail des habitants", description },
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const csp = contentSecurityPolicy()
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* F69 : politique de sécurité du contenu (export statique : balise meta), voir ADR 007. */}
        {csp && <meta httpEquiv="Content-Security-Policy" content={csp} />}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        {/* Préférences d’affichage appliquées avant le premier rendu : pas de flash (L4). */}
        <script dangerouslySetInnerHTML={{ __html: displayPreferencesBootScript(DISPLAY_PREFERENCES_KEY) }} />
        {/* Langue mémorisée (D14) : `lang` et `dir` (arabe de droite à gauche) avant le premier rendu. */}
        <script dangerouslySetInnerHTML={{ __html: localeBootScript(LOCALE_STORAGE_KEY) }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <SiteAccessibilityProvider>
        <I18nProvider>
        <StoreProvider>
          <SkipLink />
          <SiteHeader notifications={<HeaderNotifications />} spaces={<HeaderSpaces variant="menu" />} />
          <ConnectionStatus />
          <AlertBanner />
          <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <FormDraftsKeeper />
          {/* F91, F92 : assistant d'orientation, chargé à la première ouverture. */}
          <AssistantLauncher />
        </StoreProvider>
        </I18nProvider>
        </SiteAccessibilityProvider>
      </body>
    </html>
  )
}
