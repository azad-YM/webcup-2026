"use client"
import Link from "@/modules/shared/ui/link"
import { ArrowRight, Building2, Lightbulb, ListChecks, MessagesSquare } from "@boilerplate/shared-ui/components/icon"
import { useListConsultationsQuery } from "../../core/application/rtk-api/city-participation"

const LINKS = [
  { href: "/participer", title: "Consultations et avis", text: "Répondre aux questions de la ville.", icon: MessagesSquare },
  { href: "/participer/idees", title: "Boîte à idées", text: "Proposer une idée pour la colonie.", icon: Lightbulb },
  { href: "/espace/contributions", title: "Mes contributions", text: "Accusés de réception et suivi de vos idées.", icon: ListChecks },
  { href: "/projets", title: "Projets de la ville", text: "Ce qui avance dans votre quartier.", icon: Building2 },
] as const

/** Bloc composé dans `/espace/participation` (slot) : accès aux consultations, idées et contributions (L19). */
export function ParticipationLinks() {
  const consultations = useListConsultationsQuery()
  const open = (consultations.data ?? []).filter((item) => item.phase === "open").length
  return (
    <section aria-labelledby="titre-decisions">
      <h2 id="titre-decisions" className="text-2xl font-semibold tracking-tight">Participer aux décisions de la ville</h2>
      <p className="mt-1 text-slate-700" aria-live="polite">
        {consultations.data ? (open > 0 ? `${open} consultation${open > 1 ? "s" : ""} ouverte${open > 1 ? "s" : ""} en ce moment.` : "Aucune consultation ouverte en ce moment.") : ""}
      </p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-600 hover:shadow-md">
              <link.icon className="size-6 text-teal-700" aria-hidden="true" />
              <span className="mt-3 font-semibold text-slate-950">{link.title}</span>
              <span className="mt-1 flex-1 text-slate-700">{link.text}</span>
              <span className="mt-3 inline-flex items-center gap-2 font-medium text-teal-800">Ouvrir <ArrowRight className="size-4" aria-hidden="true" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
