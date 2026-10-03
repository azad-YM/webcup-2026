import { useRef, useState, type FormEvent } from "react"
import { Link } from "react-router"
import { Button } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { useListRequestsQuery, useChangeRequestStatusMutation } from "../../core/application/rtk-api/requests"
import { STATUS_LABELS, type ServiceRequest, type RequestStatus } from "../../core/domain/service-request"
export function RequestsPage(){
 const [page,setPage]=useState(1),[status,setStatus]=useState("")
 const query=useListRequestsQuery({page,status},{pollingInterval:60000})
 return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-5xl space-y-6"><Link className="underline" to="/espaces">Espaces disponibles</Link><header><h1 className="text-3xl font-semibold">Demandes citoyennes</h1><p aria-live="polite" className="mt-3 text-lg">{query.data?.pendingCount??"…"} demande(s) en attente de prise en charge</p></header>
 <label className="block">Statut<select className="ml-3 rounded border bg-white p-2" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">Tous les statuts</option>{Object.entries(STATUS_LABELS).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label>
 <Button variant="outline" onClick={()=>void query.refetch()} disabled={query.isFetching}>Actualiser</Button>
 {query.isLoading?<p role="status">Chargement…</p>:query.error?<div role="alert"><p>{getErrorMessage(query.error)}</p><Button onClick={()=>void query.refetch()}>Réessayer</Button></div>:<>
 {query.data?.items.length===0&&<p>Aucune demande pour ce statut.</p>}
 {query.data?.items.map(item=><RequestCard key={item.id+item.status} request={item} canWrite={query.data.canWrite}/>)}
 <nav aria-label="Pages de demandes" className="flex gap-4"><Button disabled={page===1} onClick={()=>setPage(page-1)}>Précédent</Button><span>Page {page}</span><Button disabled={page*20 >= (query.data?.total||0)} onClick={()=>setPage(page+1)}>Suivant</Button></nav>
 </>}</div></main>
}
function RequestCard({request,canWrite}:{request:ServiceRequest;canWrite:boolean}){
 const [status,setStatus]=useState<RequestStatus>(request.allowedStatuses[0]||request.status),[comment,setComment]=useState("")
 const [change,{isLoading,error}]=useChangeRequestStatusMutation(),sending=useRef(false)
 const submit=async(e:FormEvent)=>{e.preventDefault();if(sending.current)return;sending.current=true;try{await change({requestId:request.id,status,expectedStatus:request.status,comment:comment||null}).unwrap()}catch{}finally{sending.current=false}}
 return <article className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">{request.subject}</h2><p className="break-all text-sm">{request.reference} · {STATUS_LABELS[request.status]}</p><p className="mt-3 whitespace-pre-wrap">{request.description}</p>{request.location&&<p>Lieu : {request.location}</p>}
 <details className="my-4"><summary>Historique</summary><ol className="mt-2 space-y-2">{request.steps.map((step,i)=><li key={i}>{STATUS_LABELS[step.status]} · {new Date(step.at).toLocaleString("fr-FR")}{step.comment&&<p className="whitespace-pre-wrap">{step.comment}</p>}</li>)}</ol></details>
 {canWrite&&request.allowedStatuses.length>0&&<form className="space-y-3" onSubmit={submit}><label className="block">Nouveau statut<select className="ml-3 rounded border p-2" value={status} onChange={e=>setStatus(e.target.value as RequestStatus)}>{request.allowedStatuses.map(value=><option key={value} value={value}>{STATUS_LABELS[value]}</option>)}</select></label><label className="block">Commentaire visible par le citoyen {status==="rejected"?"(obligatoire)":"(facultatif)"}<textarea className="mt-1 block w-full rounded border p-3" maxLength={2000} required={status==="rejected"} value={comment} onChange={e=>setComment(e.target.value)}/></label>{error&&<p role="alert">{getErrorMessage(error)}</p>}<Button disabled={isLoading}>{isLoading?"Enregistrement…":"Enregistrer l’étape"}</Button></form>}
 </article>
}
