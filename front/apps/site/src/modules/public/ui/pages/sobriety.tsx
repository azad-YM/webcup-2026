import Link from "next/link"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { SOBRIETY_FIGURES, SOBRIETY_MEASURED_ON } from "./sobriety-figures"

const DONE = [
  { title: "Moins de code téléchargé", text: "Les fenêtres (réglages d’affichage, menu du compte, notifications), la carte et les espaces réservés aux personnes connectées ne sont chargés qu’au moment où l’on s’en sert." },
  { title: "Pas de police ni d’image lourde", text: "Le site utilise la police déjà présente sur votre appareil et des pictogrammes dessinés en SVG : aucune police à télécharger, aucune photo décorative." },
  { title: "Des mises à jour économes", text: "Les informations se mettent à jour en temps réel par un seul canal. Les vérifications de secours s’arrêtent quand l’onglet est caché." },
  { title: "Un mode léger", text: "Dans « Affichage », le mode léger retire images décoratives et animations, remplace la carte par la liste et espace les mises à jour. Il vous est proposé si votre connexion est lente ou en économie de données." },
  { title: "Connexion lente ou coupée", text: "Les pages essentielles et les dernières informations publiques lues restent consultables hors ligne, avec leur date. Une demande en cours de saisie est gardée sur votre appareil si l’envoi échoue." }
]

/** « Une plateforme plus légère » (L17, F57) : page statique, sans JavaScript propre ni appel à l’API. */
export function SobrietyPage() {
  return (
    <>
      <PageHeader
        trail={[{ label: "Une plateforme plus légère" }]}
        title="Une plateforme plus légère"
        lead="Un site plus léger se charge plus vite sur un vieux téléphone ou une connexion faible, et consomme moins d’énergie. Voici ce que nous avons fait et ce que nous avons mesuré."
      />
      <PageBody narrow>
        <section aria-labelledby="titre-fait">
          <h2 id="titre-fait" className="text-2xl font-semibold tracking-tight">Ce que nous avons fait</h2>
          <ul className="mt-4 space-y-4">
            {DONE.map((item) => (
              <li key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-slate-700">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="titre-chiffres" className="mt-10">
          <h2 id="titre-chiffres" className="text-2xl font-semibold tracking-tight">Les chiffres</h2>
          <p className="mt-2 text-slate-700">
            Poids transféré au premier chargement (compressé), nombre de fichiers demandés et score EcoIndex sur 100 (plus il est haut, plus la page est sobre), mesurés le {SOBRIETY_MEASURED_ON} sur notre propre serveur, sans service extérieur.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <caption className="sr-only">Mesures avant et après l’allègement, par page</caption>
              <thead>
                <tr className="border-b border-slate-300">
                  <th scope="col" className="py-2 pe-3">Page</th>
                  <th scope="col" className="py-2 pe-3">Poids avant</th>
                  <th scope="col" className="py-2 pe-3">Poids après</th>
                  <th scope="col" className="py-2 pe-3">Fichiers avant / après</th>
                  <th scope="col" className="py-2">EcoIndex avant / après</th>
                </tr>
              </thead>
              <tbody>
                {SOBRIETY_FIGURES.map((row) => (
                  <tr key={row.page} className="border-b border-slate-200">
                    <th scope="row" className="py-2 pe-3 font-medium">{row.page}</th>
                    <td className="py-2 pe-3" dir="ltr">{row.before.kb.toLocaleString("fr-FR")} Ko</td>
                    <td className="py-2 pe-3" dir="ltr">{row.after.kb.toLocaleString("fr-FR")} Ko</td>
                    <td className="py-2 pe-3" dir="ltr">{row.before.requests} / {row.after.requests}</td>
                    <td className="py-2" dir="ltr">{row.before.score} / {row.after.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Les informations chargées ensuite depuis nos services (actualités, alertes…) ne sont pas comptées : elles sont petites et ne sont demandées que si nécessaire.
          </p>
        </section>
        <section aria-labelledby="titre-vous" className="mt-10">
          <h2 id="titre-vous" className="text-2xl font-semibold tracking-tight">Et vous ?</h2>
          <p className="mt-2 text-slate-700">
            Activez le mode léger depuis le bouton « Affichage » en haut de chaque page. Toutes les informations et démarches restent disponibles. En cas d’urgence, la page <Link href="/urgences" className="font-medium text-teal-800 underline underline-offset-4">Urgences</Link> reste consultable même hors ligne.
          </p>
        </section>
      </PageBody>
    </>
  )
}
