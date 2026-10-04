import { useEffect, useRef, useState, type FormEvent } from "react"
import { Button, Input, Label } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useWelcomeMutation } from "../../core/application/rtk-api/citizen-accounts"
import { RESIDENT_LANGUAGES, type ResidentLanguage, type WelcomedResident } from "../../core/domain/citizen-account"
import { WelcomeSheet } from "../sections/welcome-sheet"

const SITE_URL = import.meta.env.VITE_SITE_URL || "http://localhost:5178"

/** Impression : seule la fiche est imprimée, sans le menu de l’espace de travail. */
const PRINT_STYLE = `@media print { body * { visibility: hidden !important; } .nt-welcome-sheet, .nt-welcome-sheet * { visibility: visible !important; } .nt-welcome-sheet { position: absolute; inset: 0; border: none; } }`

const emptyForm = { firstName: "", lastName: "", preferredLanguage: "fr" as ResidentLanguage, phone: "", email: "" }

/**
 * F71 : accueil des nouveaux arrivants. L’agent crée le compte (e-mail facultatif) ;
 * l’identifiant d’habitant et le code provisoire s’affichent une seule fois sur la fiche à imprimer.
 */
export function NewcomerReceptionPage() {
  const [form, setForm] = useState(emptyForm)
  const [welcome, mutation] = useWelcomeMutation()
  const [resident, setResident] = useState<WelcomedResident | null>(null)
  const sheetTitle = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (resident) sheetTitle.current?.focus() }, [resident])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (mutation.isLoading) return
    try {
      const created = await welcome({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        preferredLanguage: form.preferredLanguage,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      }).unwrap()
      setResident(created)
      setForm(emptyForm)
    } catch { /* erreur affichée sous le formulaire */ }
  }
  return (
    <section className="space-y-6 p-6">
      <style>{PRINT_STYLE}</style>
      <div>
        <h1 className="text-2xl font-semibold">Accueil des nouveaux arrivants</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Créez le compte d’un habitant au guichet, même sans adresse e-mail. Le système génère un identifiant d’habitant et un code provisoire,
          affichés une seule fois sur une fiche à imprimer dans sa langue. À sa première connexion, l’habitant choisit son propre code.
        </p>
      </div>

      {resident ? (
        <div className="space-y-4">
          <div role="status" className="rounded-lg border border-green-700 bg-green-50 p-4 text-green-950">
            <h2 ref={sheetTitle} tabIndex={-1} className="font-semibold">Compte créé : {resident.residentId}</h2>
            <p className="mt-1">Imprimez la fiche ou recopiez-la maintenant : le code provisoire ne sera plus jamais affiché. Ne le notez nulle part ailleurs.</p>
          </div>
          <WelcomeSheet resident={resident} siteUrl={SITE_URL} />
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => window.print()}>Imprimer la fiche</Button>
            <Button type="button" variant="outline" onClick={() => { mutation.reset(); setResident(null) }}>Accueillir une autre personne</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="max-w-2xl space-y-4 rounded-xl border bg-white p-5" noValidate={false}>
          <fieldset disabled={mutation.isLoading} className="space-y-4">
            <legend className="font-semibold">L’habitant</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="arrivant-prenom">Prénom</Label>
                <Input id="arrivant-prenom" required maxLength={100} autoComplete="off" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivant-nom">Nom</Label>
                <Input id="arrivant-nom" required maxLength={100} autoComplete="off" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrivant-langue">Langue préférée</Label>
              <select id="arrivant-langue" aria-describedby="arrivant-langue-aide" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs" value={form.preferredLanguage} onChange={(event) => setForm({ ...form, preferredLanguage: event.target.value as ResidentLanguage })}>
                {Object.entries(RESIDENT_LANGUAGES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <p id="arrivant-langue-aide" className="text-sm text-muted-foreground">La fiche est imprimée dans cette langue ; elle est aussi enregistrée dans son profil.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="arrivant-telephone">Téléphone (facultatif)</Label>
                <Input id="arrivant-telephone" type="tel" maxLength={30} autoComplete="off" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrivant-email">E-mail (facultatif)</Label>
                <Input id="arrivant-email" type="email" maxLength={255} autoComplete="off" aria-describedby="arrivant-email-aide" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                <p id="arrivant-email-aide" className="text-sm text-muted-foreground">Sans e-mail, l’habitant se connecte avec son identifiant d’habitant.</p>
              </div>
            </div>
          </fieldset>
          {mutation.isError && <p role="alert" className="text-sm text-destructive">{getErrorMessage(mutation.error)}</p>}
          <Button type="submit" disabled={mutation.isLoading || !form.firstName.trim() || !form.lastName.trim()}>
            {mutation.isLoading ? "Création du compte…" : "Créer le compte et préparer la fiche"}
          </Button>
        </form>
      )}
    </section>
  )
}
