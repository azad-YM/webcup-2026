import Link from "next/link"
import type { Route } from "next"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"

type GlossaryEntry = { id: string; term: string; definition: string; link?: { href: Route; label: string } }

/**
 * Glossaire (D13) : les mots qu’on ne peut pas éviter, expliqués simplement.
 * Chaque terme a une ancre (`/aide/glossaire#numero-de-suivi`) pour y renvoyer depuis les écrans.
 */
export const GLOSSARY: GlossaryEntry[] = [
  { id: "espace-citoyen", term: "Espace citoyen", definition: "Votre page personnelle sur ce site. Vous y retrouvez vos informations, vos demandes et les alertes qui vous concernent.", link: { href: "/espace", label: "Ouvrir mon espace" } },
  { id: "demande", term: "Demande", definition: "Un message envoyé à la mairie : une question, ou un problème que vous signalez (une panne, un trou dans la rue…).", link: { href: "/espace/demandes" as Route, label: "Voir mes demandes" } },
  { id: "signalement", term: "Signalement", definition: "Une demande qui prévient la mairie d’un problème dans la ville, avec le lieu concerné." },
  { id: "numero-de-suivi", term: "Numéro de suivi", definition: "Le numéro donné à chaque demande. Il permet de la retrouver et d’en parler avec la mairie." },
  { id: "etats-demande", term: "États d’une demande", definition: "« Envoyée » : la mairie l’a reçue. « Prise en charge » : un agent s’en occupe. « En cours de traitement » : le travail a commencé. « Résolue » : c’est terminé. « Refusée » : la mairie ne peut pas y donner suite et explique pourquoi." },
  { id: "profil", term: "Profil", definition: "Vos informations : nom, quartier, téléphone, langue. Elles sont facultatives et vous pouvez les changer à tout moment.", link: { href: "/espace/profil" as Route, label: "Modifier mon profil" } },
  { id: "quartier", term: "Quartier", definition: "La partie de la ville où vous habitez. Elle sert à vous prévenir de ce qui se passe près de chez vous." },
  { id: "alerte", term: "Alerte", definition: "Un message urgent de la mairie (inondation, coupure, danger). Il s’affiche en haut des pages pendant toute sa durée." },
  { id: "gravite", term: "Information, vigilance, urgence", definition: "Le niveau d’une alerte. « Information » : à savoir. « Vigilance » : soyez prudent. « Urgence » : suivez les consignes tout de suite." },
  { id: "alerte-sanitaire", term: "Alerte sanitaire", definition: "Un conseil de santé (chaleur, air, épidémie) envoyé seulement aux personnes qui l’ont demandé. Aucune information médicale ne vous est demandée." },
  { id: "consentement", term: "Accepter de recevoir", definition: "Vous choisissez vous-même de recevoir certains messages. Vous pouvez changer d’avis à tout moment dans votre espace." },
  { id: "service-municipal", term: "Service municipal", definition: "Un bureau de la mairie qui s’occupe d’un sujet : papiers, santé, transports, logement…", link: { href: "/services", label: "Voir les services" } },
  { id: "connexion", term: "Se connecter", definition: "Entrer votre adresse e-mail et votre mot de passe pour ouvrir votre espace citoyen.", link: { href: "/connexion", label: "Se connecter" } },
  { id: "deconnexion-securite", term: "Déconnecté pour votre sécurité", definition: "Après un certain temps, vous êtes déconnecté automatiquement. Il suffit de vous reconnecter : rien n’est perdu." },
  { id: "affichage", term: "Affichage et accessibilité", definition: "Le bouton « Affichage » en haut de chaque page permet d’agrandir le texte, d’augmenter le contraste et de réduire les animations." }
]

export function GlossaryPage() {
  return (
    <>
      <PageHeader
        trail={[{ label: "Aide" }, { label: "Glossaire" }]}
        title="Glossaire"
        lead="Les mots utilisés sur ce site, expliqués simplement."
      />
      <PageBody narrow>
        <nav aria-label="Termes du glossaire" className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Aller à un terme</h2>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {GLOSSARY.map((entry) => (
              <li key={entry.id}><a href={`#${entry.id}`} className="text-teal-800 underline underline-offset-4">{entry.term}</a></li>
            ))}
          </ul>
        </nav>
        <dl className="mt-8 space-y-6">
          {GLOSSARY.map((entry) => (
            <div key={entry.id} id={entry.id} tabIndex={-1} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5">
              <dt className="text-lg font-semibold text-slate-950">{entry.term}</dt>
              <dd className="mt-2 text-slate-800">
                {entry.definition}
                {entry.link && (
                  <> <Link href={entry.link.href} className="font-medium text-teal-800 underline underline-offset-4">{entry.link.label}</Link></>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </PageBody>
    </>
  )
}
