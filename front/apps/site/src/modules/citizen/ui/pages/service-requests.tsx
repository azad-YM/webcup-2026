"use client"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { CitizenAccessState, useCitizenAccess } from "../components/citizen-access"
import { useListRequestsQuery, useSubmitRequestMutation } from "../../core/application/rtk-api/service-requests"
import { STATUS_LABELS, type RequestDraft, type ServiceRequest } from "../../core/domain/service-request"
const empty: RequestDraft = {type:"contact",subject:"",description:"",location:null,serviceId:null}
const input = "mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"
export function ServiceRequestsPage() {
 const access=useCitizenAccess()
 return <><PageHeader trail={[{label:"Mon espace",href:"/espace"},{label:"Mes demandes"}]} title="Mes demandes" lead="Contactez la mairie, signalez un problème et suivez chaque étape."/><PageBody>{access.profile ? <RequestWorkspace/> : <CitizenAccessState access={access} returnTo="/espace/demandes"/>}</PageBody></>
}
function RequestWorkspace() {
 const [page,setPage]=useState(1),[status,setStatus]=useState("")
 const query=useListRequestsQuery({page,status},{pollingInterval:60000})
 const [submit,{isLoading,error}]=useSubmitRequestMutation()
 const [draft,setDraft]=useState<RequestDraft>(empty),[confirmation,setConfirmation]=useState<ServiceRequest|null>(null)
 const sending=useRef(false), confirmationRef=useRef<HTMLDivElement>(null)
 const {logout}=useSession()
 const failure=toQueryError(error), readFailure=toQueryError(query.error)
 useEffect(()=>{if(failure?.status===401||readFailure?.status===401)logout()},[failure?.status,readFailure?.status,logout])
 useEffect(()=>{if(confirmation)confirmationRef.current?.focus()},[confirmation])
 const send=async(event:FormEvent)=>{event.preventDefault();if(sending.current)return;sending.current=true;try{const result=await submit(draft).unwrap();setConfirmation(result);setDraft(empty)}catch{}finally{sending.current=false}}
 return <div className="space-y-8">
 {confirmation&&<div ref={confirmationRef} tabIndex={-1} role="status" className="rounded-2xl border border-teal-300 bg-teal-50 p-6"><h2 className="text-xl font-semibold">Votre demande a bien été envoyée</h2><p className="mt-2 break-all">Référence : <strong>{confirmation.reference}</strong></p><p>Retrouvez son suivi ci-dessous. La mairie vous informera de chaque étape.</p></div>}
 <section className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">Nouvelle demande</h2><form onSubmit={send} className="mt-4 space-y-4">
 <label className="block">Type de demande<select className={input} value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value as RequestDraft["type"]})}><option value="contact">Contacter la mairie</option><option value="report">Signaler un problème</option></select></label>
 <label className="block">Objet (obligatoire)<input required maxLength={160} className={input} value={draft.subject} onChange={e=>setDraft({...draft,subject:e.target.value})}/></label>
 <label className="block">Description (obligatoire)<textarea required maxLength={5000} rows={5} className={input} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
 <label className="block">Lieu {draft.type==="report"?"(obligatoire)":"(facultatif)"}<input required={draft.type==="report"} maxLength={255} className={input} value={draft.location||""} onChange={e=>setDraft({...draft,location:e.target.value||null})}/></label>
 {failure&&<p role="alert" className="text-red-800">{failure.data}</p>}
 <button disabled={isLoading} className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white disabled:opacity-60">{isLoading?"Envoi en cours…":"Envoyer ma demande"}</button>
 </form></section>
 <section><h2 className="text-2xl font-semibold">Historique et suivi</h2><label className="mt-4 block">Filtrer par statut<select className={input} value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">Tous les statuts</option>{Object.entries(STATUS_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
 {query.isLoading?<p role="status">Chargement des demandes…</p>:readFailure?<div role="alert"><p>{readFailure.data}</p><button className="underline" onClick={()=>void query.refetch()}>Réessayer</button></div>:<>
 <p className="my-4" aria-live="polite">{query.data?.total||0} demande(s)</p>
 {query.data?.items.length===0&&<p>Aucune demande pour le moment.</p>}
 <div className="space-y-4">{query.data?.items.map(item=><article key={item.id} className="rounded-2xl border bg-white p-6"><h3 className="text-lg font-semibold">{item.subject}</h3><p className="mt-1 text-sm break-all">{item.reference} · {STATUS_LABELS[item.status]}</p><details className="mt-4"><summary className="cursor-pointer font-medium">Voir la demande et ses étapes</summary><p className="mt-4 whitespace-pre-wrap">{item.description}</p>{item.location&&<p>Lieu : {item.location}</p>}<ol className="mt-4 space-y-3">{item.steps.map((step,index)=><li key={index} className="border-l-2 border-teal-600 pl-4"><strong>{STATUS_LABELS[step.status]}</strong> · <time dateTime={step.at}>{new Date(step.at).toLocaleString("fr-FR")}</time>{step.comment&&<p className="whitespace-pre-wrap">{step.comment}</p>}</li>)}</ol></details></article>)}</div>
 <nav aria-label="Pages des demandes" className="mt-4 flex gap-4"><button disabled={page===1} onClick={()=>setPage(page-1)}>Précédent</button><span>Page {page}</span><button disabled={page*20 >= (query.data?.total||0)} onClick={()=>setPage(page+1)}>Suivant</button></nav>
 </>}
 </section></div>
}
