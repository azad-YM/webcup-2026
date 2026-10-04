import { SpacesPage } from "@/modules/auth/ui/pages/spaces"
import { SecurityEvents } from "@/modules/security/ui/sections/security-events"

/** Composition de l’accueil : modules (auth) et derniers événements de sécurité (security, F100). */
export function WorkspaceHomePage() {
  return <SpacesPage aside={<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6"><SecurityEvents compact /></div>} />
}
