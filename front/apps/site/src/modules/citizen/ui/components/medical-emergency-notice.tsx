import Link from "@/modules/shared/ui/link"
import type { Route } from "next"
import { Phone, TriangleAlert } from "@boilerplate/shared-ui/components/icon"

/**
 * F86 : message immédiat et très visible quand une urgence médicale est cochée ou repérée dans le texte.
 * N'empêche pas l'envoi : la demande part en priorité aux agents, mais seuls le 15 et le 112 sont des services d'urgence.
 */
export function MedicalEmergencyNotice({ detected }: { detected: boolean }) {
  return (
    <section role="alert" aria-labelledby="urgence-titre" className="rounded-2xl border-4 border-double border-red-700 bg-red-50 p-5 text-red-950">
      <h2 id="urgence-titre" className="flex items-center gap-2 text-xl font-bold">
        <TriangleAlert className="size-7 shrink-0" aria-hidden="true" /> Urgence médicale : appelez le 15 ou le 112
      </h2>
      <p className="mt-2">
        {detected ? "Votre message semble décrire une urgence médicale. " : ""}
        Cette plateforme n’est pas un service d’urgence : si une vie est en danger, appelez immédiatement.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href="tel:15" className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-lg font-bold text-white hover:bg-red-800">
          <Phone className="size-5" aria-hidden="true" /> Appeler le <span dir="ltr">15</span> (SAMU)
        </a>
        <a href="tel:112" className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-lg font-bold text-white hover:bg-red-800">
          <Phone className="size-5" aria-hidden="true" /> Appeler le <span dir="ltr">112</span>
        </a>
        <Link href={"/urgences" as Route} className="inline-flex items-center rounded-xl border-2 border-red-700 bg-white px-5 py-3 font-semibold text-red-900 underline-offset-4 hover:underline">
          Tous les numéros d’urgence
        </Link>
      </div>
      <p className="mt-3 text-sm">Vous pouvez quand même envoyer votre demande : elle sera traitée en priorité par les agents de la mairie, sans remplacer les secours.</p>
    </section>
  )
}

/** Rappel permanent sous le formulaire : la plateforme ne remplace pas les secours. */
export function NotAnEmergencyServiceNote() {
  return (
    <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-800">
      Cette plateforme n’est pas un service d’urgence. En cas de danger pour une personne, appelez le{" "}
      <a href="tel:15" className="font-semibold underline underline-offset-4"><span dir="ltr">15</span></a>, le{" "}
      <a href="tel:112" className="font-semibold underline underline-offset-4"><span dir="ltr">112</span></a> ou consultez la page{" "}
      <Link href={"/urgences" as Route} className="font-semibold underline underline-offset-4">Urgences</Link>.
    </p>
  )
}
