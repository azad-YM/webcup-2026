import Link from "@/modules/shared/ui/link"
import type { Route } from "next"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"

type DataRow = { data: string; why: string; duration: string; access: string }

/**
 * Inventaire tenu à jour avec les BC propriétaires (IAM, Citizen, Communication) : voir
 * `api/src/Citizen/doc/participation.md#vos-données-f51`. Texte statique, sans appel à l'API.
 */
const ROWS: DataRow[] = [
  { data: "Adresse e-mail et mot de passe (stocké chiffré, jamais lisible)", why: "Vous connecter à votre espace", duration: "Tant que votre compte existe ; à la suppression, l’adresse est effacée", access: "Vous seul ; aucun agent ne voit votre mot de passe" },
  { data: "Profil : nom, prénom, téléphone, adresse, langue (tous facultatifs)", why: "Vous répondre et vous recontacter au sujet de vos demandes", duration: "Tant que votre compte existe ; effacé à la suppression", access: "Vous ; les agents habilités qui traitent vos demandes et rendez-vous" },
  { data: "Quartier et accord pour les alertes sanitaires (une simple case, aucune donnée de santé)", why: "Vous envoyer les alertes qui concernent votre quartier ou votre santé", duration: "Jusqu’à ce que vous les retiriez ou supprimiez votre compte", access: "Vous ; utilisé automatiquement pour cibler les alertes" },
  { data: "Demandes et signalements, et leurs étapes", why: "Traiter votre demande et vous informer de son avancement", duration: "Conservés pour le suivi du service ; à la suppression du compte, ils ne sont plus rattachés à votre identité", access: "Vous ; les agents habilités. Un signalement rendu public ne montre que son objet, son lieu et son état" },
  { data: "Rendez-vous, soutiens, inquiétudes et notifications", why: "Organiser vos rendez-vous, compter les soutiens, répondre à vos inquiétudes, vous prévenir", duration: "Tant que votre compte existe ; effacés à la suppression", access: "Vous ; les agents habilités (le nombre de soutiens est public, pas leurs auteurs)" },
  { data: "Appareils reconnus et connexions réussies (navigateur et système, date, méthode, adresse IP)", why: "Vous prévenir d’une connexion depuis un nouvel appareil et vous laisser vérifier qui utilise votre compte", duration: "Connexions : 90 jours ; appareils : tant que votre compte existe, effacés à la suppression", access: "Vous, dans « Sécurité du compte »" },
  { data: "Journal des tentatives de connexion (adresse IP, e-mail saisi)", why: "Protéger votre compte contre les intrusions", duration: "90 jours", access: "Les administrateurs chargés de la sécurité" }
]

const RIGHTS = [
  "Consulter et corriger votre profil à tout moment depuis « Mon profil ».",
  "Récupérer toutes vos données, rubrique par rubrique et dans un fichier JSON, depuis « Mes données » de votre espace.",
  "Retirer votre accord aux alertes sanitaires d’un clic, depuis votre espace.",
  "Supprimer votre compte vous-même : vos données personnelles sont effacées.",
  "Poser une question ou contester l’usage de vos données : un agent vous répond, avec un suivi visible."
]

/** « Vos données » (F51) : quelles données, pourquoi, combien de temps, qui y accède, vos droits. */
export function YourDataPage() {
  return (
    <>
      <PageHeader
        trail={[{ label: "Vos données" }]}
        title="Vos données"
        lead="Ce que la ville de Nova Terra conserve sur vous, pourquoi, combien de temps, qui peut le voir, et comment garder la main."
      />
      <PageBody>
        <div className="space-y-10">
          <section aria-labelledby="titre-donnees">
            <h2 id="titre-donnees" className="text-2xl font-semibold tracking-tight">Quelles données, et pourquoi</h2>
            <p className="mt-2 text-slate-700">Nous ne demandons que le nécessaire. Aucune donnée n’est vendue ni utilisée à des fins publicitaires.</p>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <caption className="sr-only">Données conservées, finalité, durée de conservation et personnes qui y accèdent</caption>
                <thead className="bg-slate-50 text-slate-900">
                  <tr>
                    <th scope="col" className="p-4 font-semibold">Donnée</th>
                    <th scope="col" className="p-4 font-semibold">Pourquoi</th>
                    <th scope="col" className="p-4 font-semibold">Combien de temps</th>
                    <th scope="col" className="p-4 font-semibold">Qui y accède</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {ROWS.map((row) => (
                    <tr key={row.data}>
                      <th scope="row" className="p-4 align-top font-medium text-slate-950">{row.data}</th>
                      <td className="p-4 align-top">{row.why}</td>
                      <td className="p-4 align-top">{row.duration}</td>
                      <td className="p-4 align-top">{row.access}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section aria-labelledby="titre-securite" className="rounded-2xl border border-teal-200 bg-teal-50 p-6">
            <h2 id="titre-securite" className="text-2xl font-semibold tracking-tight">Comment vos données sont protégées</h2>
            <p className="mt-2 text-slate-800">Coordonnées chiffrées, accès des agents limité et journalisé, tentatives répétées freinées : tout est expliqué simplement.</p>
            <Link href={"/vos-donnees/securite" as Route} className="mt-4 inline-flex rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">Sécurité de vos données</Link>
          </section>
          <section aria-labelledby="titre-droits" className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 id="titre-droits" className="text-2xl font-semibold tracking-tight">Vos droits</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-800">
              {RIGHTS.map((right) => <li key={right}>{right}</li>)}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={"/espace/participation" as Route} className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">Faire remonter une inquiétude</Link>
              <Link href="/espace/profil" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium hover:bg-slate-50">Gérer mon profil</Link>
              <Link href={"/espace/mes-donnees" as Route} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium hover:bg-slate-50">Récupérer mes données</Link>
            </div>
          </section>
        </div>
      </PageBody>
    </>
  )
}
