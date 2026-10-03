import Link from "next/link"
import { MAIN_NAVIGATION } from "../navigation"
import { NovaTerraWordmark } from "./nova-terra-logo"

export function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <NovaTerraWordmark inverted />
          <p className="mt-4 max-w-xs text-sm leading-6">
            Le portail officiel de Nova Terra, première ville fondée par l’humanité sur une autre planète.
          </p>
        </div>
        <nav aria-label="Liens du pied de page">
          <h2 className="text-sm font-semibold text-white">Le site</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {MAIN_NAVIGATION.map((item) => (
              <li key={item.href}><Link href={item.href} className="hover:text-white hover:underline">{item.label}</Link></li>
            ))}
            <li><Link href="/espace" className="hover:text-white hover:underline">Mon espace citoyen</Link></li>
            <li><Link href="/aide/glossaire" className="hover:text-white hover:underline">Glossaire : les mots du site expliqués</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-semibold text-white">Hôtel de ville</h2>
          <address className="mt-4 text-sm not-italic leading-6">
            Dôme central, place de la Fondation<br />
            Du lundi au vendredi, 8 h 30 – 17 h
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm sm:px-6 lg:px-8">© {new Date().getFullYear()} Ville de Nova Terra</p>
      </div>
    </footer>
  )
}
