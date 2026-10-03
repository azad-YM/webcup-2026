import { useState, type FormEvent, type ReactNode } from "react"
import { Link } from "react-router"
import { Button } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useServicesQuery, usePublicationsQuery, useSaveServiceMutation, useSavePublicationMutation } from "../../core/application/rtk-api/content"
import type { MunicipalService, Publication } from "../../core/domain/content"
const input = "mt-1 w-full rounded border border-slate-300 p-2 text-slate-950"
const Field = ({ label, children }: { label: string; children: ReactNode }) => <label className="block text-sm font-medium">{label}{children}</label>
const lines = (value: string) => value.split("\n").map(s => s.trim()).filter(Boolean)
const emptyService: MunicipalService = { id: "", name: "", category: "demarches", summary: "", description: "", actions: [], contact: { place: "", hours: "" }, featured: false, keywords: [], status: "operational", statusMessage: "", transport: null }
const emptyPublication: Publication = { id: "", title: "", category: "Vie municipale", summary: "", body: [], state: "draft", important: false, severity: null, audience: "all", district: null, startsAt: null, endsAt: null, recommendations: "" }
function ServiceEditor({ initial, onDone }: { initial: MunicipalService; onDone: () => void }) {
 const [value, set] = useState(initial)
 const [save, result] = useSaveServiceMutation()
 const field = (key: "id" | "name" | "summary" | "description" | "statusMessage", label: string, multiline = false) => <Field label={label}>{multiline ? <textarea className={input} required={key !== "statusMessage"} value={value[key]} onChange={e => set({ ...value, [key]: e.target.value })} /> : <input className={input} required value={value[key]} disabled={key === "id" && Boolean(initial.id)} pattern={key === "id" ? "[a-z0-9][a-z0-9-]{0,79}" : undefined} onChange={e => set({ ...value, [key]: e.target.value })} />}</Field>
 const submit = async (e: FormEvent) => { e.preventDefault(); if (result.isLoading) return; try { await save(value).unwrap(); onDone() } catch { /* RTK displays error */ } }
 return <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6"><h2 className="text-xl font-semibold">{initial.id ? "Modifier le service" : "Nouveau service"}</h2>
  {field("id", "Identifiant (minuscules et tirets)")}{field("name", "Nom")}
  <Field label="Thème"><select className={input} value={value.category} onChange={e => set({ ...value, category: e.target.value, transport: e.target.value === "mobilite" ? value.transport : null })}>{Object.entries({ demarches: "Démarches", "cadre-de-vie": "Cadre de vie", "sante-solidarite": "Santé et solidarité", mobilite: "Mobilité", habitat: "Habitat", famille: "Famille" }).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
  {field("summary", "Résumé", true)}{field("description", "Description", true)}
  <Field label="Démarches proposées (une par ligne)"><textarea className={input} value={value.actions.join("\n")} onChange={e => set({ ...value, actions: e.target.value.split("\n") })} /></Field>
  <Field label="Mots-clés (séparés par des virgules)"><input className={input} value={value.keywords.join(",")} onChange={e => set({ ...value, keywords: e.target.value.split(",") })} /></Field>
  <Field label="Lieu"><input className={input} value={value.contact.place} onChange={e => set({ ...value, contact: { ...value.contact, place: e.target.value } })} /></Field>
  <Field label="Horaires d’accueil"><input className={input} value={value.contact.hours} onChange={e => set({ ...value, contact: { ...value.contact, hours: e.target.value } })} /></Field>
  <Field label="Téléphone"><input className={input} value={value.contact.phone ?? ""} onChange={e => set({ ...value, contact: { ...value.contact, phone: e.target.value } })} /></Field>
  <label className="flex gap-2"><input type="checkbox" checked={value.featured} onChange={e => set({ ...value, featured: e.target.checked })} />Mettre en avant sur l’accueil</label>
  <Field label="État du service"><select className={input} value={value.status} onChange={e => set({ ...value, status: e.target.value as MunicipalService["status"] })}><option value="operational">Opérationnel</option><option value="maintenance">En maintenance</option><option value="interrupted">Interrompu</option></select></Field>
  {field("statusMessage", "Explication de la perturbation", true)}
  {value.category === "mobilite" && <fieldset className="space-y-3 border p-4"><legend>Transports</legend><label className="flex gap-2"><input type="checkbox" checked={value.transport !== null} onChange={e => set({ ...value, transport: e.target.checked ? { route: "", timetable: "", information: "" } : null })} />Publier les horaires de transport</label>{value.transport && ([['route', 'Trajet'], ['timetable', 'Horaires'], ['information', 'Informations pratiques']] as const).map(([key, label]) => <Field key={key} label={label}><textarea className={input} required={key !== "information"} value={value.transport?.[key]} onChange={e => set({ ...value, transport: { ...value.transport!, [key]: e.target.value } })} /></Field>)}</fieldset>}
  {result.error && <p role="alert">{getErrorMessage(result.error)}</p>}<Button disabled={result.isLoading}>{result.isLoading ? "Enregistrement…" : "Enregistrer le service"}</Button><Button type="button" variant="outline" onClick={onDone}>Annuler</Button>
 </form>
}
function PublicationEditor({ initial, onDone }: { initial: Publication; onDone: () => void }) {
 const [value, set] = useState(initial)
 const [body, setBody] = useState(initial.body.join("\n"))
 const [save, result] = useSavePublicationMutation()
 const [validation, setValidation] = useState("")
 const submit = async (e: FormEvent) => { e.preventDefault(); if (result.isLoading) return; setValidation(""); if (value.severity && (!value.startsAt || !value.endsAt || Date.parse(value.endsAt) <= Date.parse(value.startsAt))) { setValidation("Indiquez une période valide, avec une fin après le début."); return } try { await save({ ...value, body: lines(body) }).unwrap(); onDone() } catch { /* RTK displays error */ } }
 return <form onSubmit={submit} className="space-y-4 rounded-xl border bg-white p-6"><h2 className="text-xl font-semibold">{initial.id ? "Modifier la publication" : "Nouvelle publication"}</h2>
  {([['id', 'Identifiant (minuscules et tirets)'], ['title', 'Titre'], ['category', 'Catégorie'], ['summary', 'Résumé']] as const).map(([key, label]) => <Field key={key} label={label}><input className={input} required disabled={key === "id" && Boolean(initial.id)} pattern={key === "id" ? "[a-z0-9][a-z0-9-]{0,79}" : undefined} value={value[key]} onChange={e => set({ ...value, [key]: e.target.value })} /></Field>)}
  <Field label="Contenu (un paragraphe par ligne)"><textarea className={input} required rows={5} value={body} onChange={e => setBody(e.target.value)} /></Field>
  <Field label="État"><select className={input} value={value.state} onChange={e => set({ ...value, state: e.target.value as Publication["state"] })}><option value="draft">Brouillon</option><option value="published">Publiée</option><option value="withdrawn">Retirée</option></select></Field>
  <label className="flex gap-2"><input type="checkbox" checked={value.important} onChange={e => set({ ...value, important: e.target.checked })} />Annonce importante : afficher dans les notifications des citoyens</label>
  <Field label="Alerte"><select className={input} value={value.severity ?? ""} onChange={e => set({ ...value, severity: (e.target.value || null) as Publication["severity"], audience: e.target.value ? value.audience : "all" })}><option value="">Actualité classique</option><option value="info">Information</option><option value="warning">Vigilance</option><option value="critical">Urgence critique</option></select></Field>
  {value.severity && <fieldset className="space-y-3 border p-4"><legend>Diffusion de l’alerte</legend>
   <Field label="Audience"><select className={input} value={value.audience} onChange={e => set({ ...value, audience: e.target.value as Publication["audience"] })}><option value="all">Tous les habitants</option><option value="district">Un quartier</option><option value="health">Citoyens ayant consenti aux alertes sanitaires</option></select></Field>
   {value.audience === "district" && <Field label="Quartier"><select className={input} required value={value.district ?? ""} onChange={e => set({ ...value, district: e.target.value })}><option value="">Choisir</option>{["Nord", "Sud", "Est", "Ouest", "Centre", "Port"].map(d => <option key={d}>{d}</option>)}</select></Field>}
   {([['startsAt', 'Début'], ['endsAt', 'Fin']] as const).map(([key, label]) => <Field key={key} label={`${label} (UTC)`}><input className={input} type="datetime-local" required value={value[key]?.slice(0, 16) ?? ""} onChange={e => set({ ...value, [key]: e.target.value ? `${e.target.value}:00+00:00` : null })} /></Field>)}
   <Field label="Recommandations rédigées par l’agent"><textarea rows={4} className={input} value={value.recommendations} onChange={e => set({ ...value, recommendations: e.target.value })} /></Field>
  </fieldset>}
  {validation && <p role="alert">{validation}</p>}{result.error && <p role="alert">{getErrorMessage(result.error)}</p>}<Button disabled={result.isLoading}>{result.isLoading ? "Enregistrement…" : "Enregistrer la publication"}</Button><Button type="button" variant="outline" onClick={onDone}>Annuler</Button>
 </form>
}
export function ContentPage() {
 const [tab, setTab] = useState<"services" | "publications">("services")
 const services = useServicesQuery(undefined, { skip: tab !== "services" })
 const publications = usePublicationsQuery(undefined, { skip: tab !== "publications" })
 const [service, setService] = useState<MunicipalService | null>(null)
 const [publication, setPublication] = useState<Publication | null>(null)
 const query = tab === "services" ? services : publications
 return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-5xl space-y-6"><Link to="/espaces" className="underline">← Espaces</Link><h1 className="text-3xl font-semibold">Contenus de Nova Terra</h1><nav aria-label="Type de contenu" className="flex gap-4"><Button variant={tab === "services" ? "default" : "outline"} onClick={() => { setTab("services"); setPublication(null) }}>Services et transports</Button><Button variant={tab === "publications" ? "default" : "outline"} onClick={() => { setTab("publications"); setService(null) }}>Publications et alertes</Button></nav>
  {query.isLoading ? <p role="status">Chargement…</p> : query.error ? <div role="alert">{getErrorMessage(query.error)} <Button onClick={() => void query.refetch()}>Réessayer</Button></div> : <>
   <Button onClick={() => tab === "services" ? setService({ ...emptyService }) : setPublication({ ...emptyPublication })}>{tab === "services" ? "Nouveau service" : "Nouvelle publication"}</Button>
   {service && <ServiceEditor key={service.id} initial={service} onDone={() => setService(null)} />}{publication && <PublicationEditor key={publication.id} initial={publication} onDone={() => setPublication(null)} />}
   {(query.data?.length ?? 0) === 0 && <p>Aucun contenu enregistré.</p>}
   <ul className="space-y-3">{tab === "services" ? services.data?.map(s => <li key={s.id} className="flex items-center justify-between rounded-xl border bg-white p-4"><div><strong>{s.name}</strong><p>{s.status === "operational" ? "Opérationnel" : s.status === "maintenance" ? "En maintenance" : "Interrompu"}</p></div><Button variant="outline" onClick={() => setService(s)}>Modifier</Button></li>) : publications.data?.map(p => <li key={p.id} className="flex items-center justify-between rounded-xl border bg-white p-4"><div><strong>{p.title}</strong><p>{p.state === "published" ? "Publiée" : p.state === "draft" ? "Brouillon" : "Retirée"}{p.severity ? ` · ${p.severity} · ${p.audience === "district" ? p.district : p.audience === "health" ? "Consentement sanitaire" : "Tous"}` : ""}</p></div><Button variant="outline" onClick={() => setPublication(p)}>Modifier</Button></li>)}</ul>
  </>}
 </div></main>
}
