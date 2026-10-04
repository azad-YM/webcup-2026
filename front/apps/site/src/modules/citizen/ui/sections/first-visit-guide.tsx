"use client"
import Link from "@/modules/shared/ui/link"
import type { Route } from "next"
import { FirstVisitGuide } from "@boilerplate/shared-ui/components/a11y"
import type { CitizenProfile } from "../../core/domain/citizen-profile"

export const FIRST_VISIT_GUIDE_ID = "espace-citoyen-premiere-visite"

const action = "inline-flex rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"

/**
 * Première connexion guidée (D12) : trois étapes courtes, refermables et
 * mémorisées comme vues (préférences d’interface du site, voir L4).
 */
export function CitizenFirstVisitGuide({ profile }: { profile: CitizenProfile }) {
  return (
    <FirstVisitGuide
      hintId={FIRST_VISIT_GUIDE_ID}
      title="Bienvenue ! Par où commencer ?"
      intro={<>Trois étapes pour bien démarrer. Un mot vous semble difficile ? <Link href="/aide/glossaire" className="font-medium text-teal-800 underline underline-offset-4">Consultez le glossaire</Link>.</>}
      steps={[
        {
          title: "Compléter mon profil",
          text: "Votre nom et votre quartier aident la mairie à vous répondre et à vous prévenir.",
          done: profile.profileCompleted,
          action: profile.profileCompleted ? undefined : <Link href="/espace/profil" className={action}>Compléter mon profil</Link>
        },
        {
          title: "Trouver un service",
          text: "Cherchez un service de la ville par mot ou par thème : horaires, lieu, contact.",
          action: <Link href="/services" className={action}>Voir les services</Link>
        },
        {
          title: "Faire une demande",
          text: "Posez une question ou signalez un problème. Vous pourrez suivre la réponse ici.",
          action: <Link href={"/espace/demandes/nouvelle?type=contact" as Route} className={action}>Faire une demande</Link>
        }
      ]}
    />
  )
}
