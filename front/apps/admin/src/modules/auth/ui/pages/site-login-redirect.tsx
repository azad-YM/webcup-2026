import { useEffect } from "react"

export function SiteLoginRedirect() {
  const configuredUrl = import.meta.env.VITE_SITE_URL
  const siteUrl = configuredUrl || (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:5178` : null)
  const loginUrl = siteUrl ? new URL("login/", `${siteUrl.replace(/\/$/, "")}/`).href : null
  useEffect(() => { if (loginUrl) window.location.replace(loginUrl) }, [loginUrl])
  return <main className="grid min-h-screen place-items-center"><div role="status">
    <p>{loginUrl ? "Redirection vers la connexion…" : "Le service de connexion est indisponible."}</p>
    {loginUrl && <a className="mt-4 block underline" href={loginUrl}>Continuer vers le site</a>}
  </div></main>
}
