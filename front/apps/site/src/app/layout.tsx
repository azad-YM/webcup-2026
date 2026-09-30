import { StoreProvider } from "@/modules/shared/ui/store-provider"
import type { Metadata } from "next"
import "@boilerplate/shared-ui/global.css"
import { siteEnv } from "@/config/env"

export const metadata: Metadata = {
  metadataBase: new URL(siteEnv.siteUrl),
  title: { default: "Boilerplate", template: "%s | Boilerplate" },
  description: "Site public du boilerplate : connexion centralisée et accès aux espaces applicatifs.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "fr_FR", url: "/", siteName: "Boilerplate", title: "Boilerplate", description: "Connexion centralisée et accès aux espaces applicatifs." },
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body><StoreProvider>{children}</StoreProvider></body></html>
}
