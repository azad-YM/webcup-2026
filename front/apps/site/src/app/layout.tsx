import { StoreProvider } from "@/modules/shared/ui/store-provider"
import type { Metadata } from "next"
import "@boilerplate/shared-ui/global.css"
import "./nova-terra.css"
import { siteEnv } from "@/config/env"
import { SkipLink, MAIN_CONTENT_ID } from "@/modules/shared/ui/layout/skip-link"
import { SiteHeader } from "@/modules/shared/ui/layout/site-header"
import { SiteFooter } from "@/modules/shared/ui/layout/site-footer"

const description = "Le portail officiel de Nova Terra, première ville humaine sur une autre planète : services municipaux, actualités et espace citoyen."

export const metadata: Metadata = {
  metadataBase: new URL(siteEnv.siteUrl),
  title: { default: "Nova Terra — portail des habitants", template: "%s | Nova Terra" },
  description,
  openGraph: { type: "website", locale: "fr_FR", url: "/", siteName: "Nova Terra", title: "Nova Terra — portail des habitants", description },
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col">
        <StoreProvider>
          <SkipLink />
          <SiteHeader />
          <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </StoreProvider>
      </body>
    </html>
  )
}
