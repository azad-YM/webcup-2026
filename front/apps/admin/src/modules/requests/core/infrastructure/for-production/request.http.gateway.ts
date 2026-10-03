import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import type { RequestGateway } from "../../application/ports/gateway/request.gateway"
import type { RequestSessionProvider } from "../../application/ports/provider/request-session.provider"
import type { RequestFilter, RequestList, ServiceRequest, StatusChange } from "../../domain/service-request"
export class RequestHttpGateway extends ApiClient implements RequestGateway {
 constructor(baseUrl:string,private readonly session:RequestSessionProvider){super(baseUrl,()=>session.getToken())}
 private async execute<T>(run:()=>Promise<T>):Promise<T>{try{return await run()}catch(error){if(error instanceof ApiHttpError){if(error.status===401){this.session.invalidate();throw new Error("Votre session a expiré. Reconnectez-vous.")}if(error.status===403)throw new Error("Vous n’avez pas le droit de consulter ou traiter les demandes.");if(error.status===409)throw new Error("La demande a changé. Actualisez avant de réessayer.");if(error.status===422)throw new Error("Ce changement est refusé. Vérifiez le statut et le motif.")}throw new Error("Le service est indisponible. Réessayez.")}}
 list(filter:RequestFilter):Promise<RequestList>{const params=new URLSearchParams({page:String(filter.page)});if(filter.status)params.set("status",filter.status);return this.execute(()=>this.getAuth(`/citizen/agent/requests?${params}`))}
 change(change:StatusChange):Promise<ServiceRequest>{return this.execute(()=>this.postAuth("/citizen/agent/requests/status",change))}
 authorize(topic:string,socketId?:string):Promise<{token?:string;auth?:string}>{return this.execute(()=>this.postAuth("/citizen/requests/subscription",{topic,socketId}))}
}
