import { useEffect, useRef, useState, type FormEvent } from "react"
import { Button } from "@boilerplate/shared-ui/components"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useListQuery, useSuspendMutation } from "../../core/application/rtk-api/citizen-accounts"
import type { CitizenAccount } from "../../core/domain/citizen-account"
import { MaskedValue, SensitiveDataBar } from "@/modules/shared/ui/components/custom/sensitive-data"

export function CitizenAccountsPage() {
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [reveal, setReveal] = useState(false)
  const query = useListQuery({ search: appliedSearch, reveal })
  const [target, setTarget] = useState<CitizenAccount | null>(null)
  const [suspend, mutation] = useSuspendMutation()
  const items = query.data?.items ?? []
  // Confirmation : le focus va sur son titre, puis revient au bouton d’origine (F41).
  const confirmationTitle = useRef<HTMLHeadingElement>(null)
  const origin = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (target) confirmationTitle.current?.focus()
    else if (origin.current?.isConnected) origin.current.focus()
  }, [target])
  function applySearch(event: FormEvent) { event.preventDefault(); setAppliedSearch(search.trim()) }
  async function confirm() {
    if (!target || mutation.isLoading) return
    try { await suspend({ citizenId: target.profile.id, suspended: target.status === "active" }).unwrap(); setTarget(null) } catch { /* visible error below */ }
  }
  return <section className="space-y-6 p-6">
    <div><h1 className="text-2xl font-semibold">Comptes citoyens</h1><p className="mt-2 text-muted-foreground">Consultez les profils et gérez l’accès des habitants. Suspendre un compte ferme ses sessions immédiatement.</p></div>
    {query.isLoading && <p role="status">Chargement des comptes…</p>}
    {query.isError && <div role="alert" className="rounded-lg border border-red-700 bg-red-50 p-4 text-red-950"><p>{getErrorMessage(query.error)}</p><Button onClick={() => void query.refetch()} className="mt-3">Réessayer</Button></div>}
    {query.data && !query.isError && <>
      <form role="search" onSubmit={applySearch} className="flex flex-wrap items-end gap-3">
        <label className="block min-w-0 flex-1 basis-64">Rechercher (nom, e-mail, quartier{reveal ? ", téléphone" : ""})<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 block w-full rounded-md border px-3 py-2" /></label>
        <Button type="submit" disabled={query.isFetching}>{query.isFetching ? "Recherche…" : "Rechercher"}</Button>
        {appliedSearch && <Button type="button" variant="outline" onClick={() => { setSearch(""); setAppliedSearch("") }}>Effacer</Button>}
      </form>
      <p role="status" className="text-sm text-muted-foreground">{query.data.total} compte{query.data.total > 1 ? "s" : ""}{appliedSearch ? ` pour « ${appliedSearch} »` : ""}{query.data.total > items.length ? ` — ${items.length} premiers affichés, affinez la recherche` : ""}. Les mots de passe ne sont jamais affichés.</p>
      <SensitiveDataBar meta={query.data.sensitive} revealed={reveal} onChange={setReveal} busy={query.isFetching} />
      {!query.data.canManage && <p>Vous disposez d’un accès en consultation.</p>}
      {items.length === 0 ? <p role="status">Aucun compte citoyen ne correspond.</p> : <ul className="space-y-4">{items.map((account) => <li key={account.profile.id} className="rounded-xl border p-4">
        <h2 className="font-semibold">{[account.profile.firstName, account.profile.lastName].filter(Boolean).join(" ") || "Profil non renseigné"}</h2>
        <p><span className="sr-only">E-mail : </span>{account.email}{account.maskedFields?.includes("email") && <span className="ms-2 text-xs italic text-muted-foreground">(adresse partielle — accès réservé)</span>}</p><p className="mt-1 flex flex-wrap items-center gap-2"><StatusBadge tone={account.status === "active" ? "success" : "danger"} label={account.status === "active" ? "Actif" : "Suspendu"} srPrefix="Compte :" /> Quartier : {account.profile.district ?? "Non renseigné"}</p>
        <details className="mt-3"><summary className="cursor-pointer">Voir les informations du profil</summary><dl className="mt-2 space-y-1"><div><dt>Téléphone</dt><dd><MaskedValue field="phone" masked={account.maskedFields} value={account.profile.phone} /></dd></div><div><dt>Adresse</dt><dd><MaskedValue field="address" masked={account.maskedFields} value={account.profile.address} empty="Non renseignée" /></dd></div><div><dt>Langue préférée</dt><dd>{account.profile.preferredLanguage ?? "Non renseignée"}</dd></div><div><dt>Inscription</dt><dd>{new Date(account.profile.registeredAt).toLocaleDateString("fr-FR")}</dd></div></dl></details>
        {account.canSuspend ? <Button variant="outline" className="mt-3" disabled={mutation.isLoading} onClick={(event) => { mutation.reset(); origin.current = event.currentTarget; setTarget(account) }}>{account.status === "active" ? "Suspendre" : "Réactiver"}</Button> : query.data.canManage && <p className="mt-3 text-sm">Compte partagé avec un agent actif : accès protégé.</p>}
      </li>)}</ul>}
    </>}
    {target && <section aria-labelledby="suspension-confirmation" className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-slate-900"><h2 id="suspension-confirmation" ref={confirmationTitle} tabIndex={-1} className="font-semibold">{target.status === "active" ? "Confirmer la suspension" : "Confirmer la réactivation"}</h2><p className="mt-2">{target.email} — {target.status === "active" ? "Ce citoyen ne pourra plus se connecter jusqu’à réactivation." : "Ce citoyen pourra se reconnecter avec son mot de passe. Les anciennes sessions restent invalides."}</p>
      {mutation.isError && <p role="alert" className="mt-3 text-red-800">{getErrorMessage(mutation.error)}</p>}
      <div className="mt-3 flex gap-3"><Button disabled={mutation.isLoading} onClick={() => void confirm()}>{mutation.isLoading ? "Enregistrement…" : "Confirmer"}</Button><Button variant="outline" disabled={mutation.isLoading} onClick={() => setTarget(null)}>Annuler</Button></div>
    </section>}
    {mutation.isSuccess && !target && <p role="status">Le statut du compte a été mis à jour.</p>}
  </section>
}
