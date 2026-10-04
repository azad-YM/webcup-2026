import Link from "next/link"
import type { Route } from "next"
import { Clock, Eye, KeyRound, Lock, ShieldCheck, UserCheck } from "@boilerplate/shared-ui/components/icon"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"

type Protection = { icon: typeof Lock; title: string; text: string; forYou: string }

/**
 * « Sécurité de vos données » (F69) : les protections réellement en place, en langage clair.
 * Source technique : ADR 007 (`doc/technique/decisions/007-protection-des-donnees.md`). Texte statique.
 */
const PROTECTIONS: Protection[] = [
  {
    icon: Lock,
    title: "Vos coordonnées sont chiffrées",
    text: "Votre numéro de téléphone et votre adresse sont enregistrés sous une forme chiffrée. Même une personne qui obtiendrait une copie de la base de données ne pourrait pas les lire sans la clé, conservée à part.",
    forYou: "Rien à faire : c’est automatique."
  },
  {
    icon: KeyRound,
    title: "Votre mot de passe n’est jamais lisible",
    text: "Il est transformé de façon irréversible avant d’être enregistré. Personne à la mairie ne peut le voir ni vous le demander.",
    forYou: "Choisissez un mot de passe que vous n’utilisez nulle part ailleurs."
  },
  {
    icon: UserCheck,
    title: "Seuls les agents habilités voient vos coordonnées",
    text: "Dans l’espace des agents, votre téléphone, votre adresse et votre e-mail complet sont masqués. Seuls les agents qui en ont besoin peuvent les afficher, et chaque affichage est inscrit dans un journal contrôlé par la mairie.",
    forYou: "Vous pouvez demander qui a consulté vos données en faisant remonter une inquiétude."
  },
  {
    icon: ShieldCheck,
    title: "Les tentatives répétées sont freinées",
    text: "Inscriptions, envois de demandes, connexions : au-delà d’un certain nombre d’essais en peu de temps, le service demande de patienter quelques minutes. Cela bloque les robots sans gêner un usage normal.",
    forYou: "Si ce message apparaît, attendez le délai indiqué puis réessayez."
  },
  {
    icon: Clock,
    title: "Les sessions des agents expirent vite",
    text: "L’espace des agents se ferme automatiquement après une courte durée ; l’agent est prévenu quelques minutes avant. Un poste oublié ouvert à l’accueil ne reste donc pas accessible.",
    forYou: "Pensez aussi à vous déconnecter sur un ordinateur partagé."
  },
  {
    icon: Eye,
    title: "Le site et l’application refusent les contenus étrangers",
    text: "Le navigateur n’exécute que les programmes du site de la ville, et nos pages ne peuvent pas être affichées à l’intérieur d’un autre site. Les messages d’erreur ne révèlent aucun détail technique utile à un attaquant.",
    forYou: "Vérifiez que l’adresse de la page est bien celle du portail de Nova Terra avant de saisir votre mot de passe."
  }
]

export function DataSecurityPage() {
  return (
    <>
      <PageHeader
        trail={[{ label: "Vos données", href: "/vos-donnees" }, { label: "Sécurité de vos données" }]}
        title="Sécurité de vos données"
        lead="Comment la ville de Nova Terra protège vos informations, même en cas d’attaque, sans vous compliquer la vie."
      />
      <PageBody>
        <div className="space-y-10">
          <ul className="grid gap-5 md:grid-cols-2">
            {PROTECTIONS.map(({ icon: Icon, title, text, forYou }) => (
              <li key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <Icon className="size-8 text-teal-700" aria-hidden="true" />
                <h2 className="mt-3 text-xl font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-slate-800">{text}</p>
                <p className="mt-3 rounded-lg bg-teal-50 p-3 text-sm text-teal-950"><strong>Pour vous :</strong> {forYou}</p>
              </li>
            ))}
          </ul>
          <section aria-labelledby="titre-incident" className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 id="titre-incident" className="text-2xl font-semibold tracking-tight">Un doute, un problème ?</h2>
            <p className="mt-3 text-slate-800">
              Si vous pensez que quelqu’un a utilisé votre compte, changez votre mot de passe et prévenez la mairie. En cas d’incident touchant vos données, la ville vous informe dans votre espace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={"/espace/participation" as Route} className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">Signaler une inquiétude</Link>
              <Link href="/vos-donnees" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium hover:bg-slate-50">Revenir à « Vos données »</Link>
            </div>
          </section>
        </div>
      </PageBody>
    </>
  )
}
