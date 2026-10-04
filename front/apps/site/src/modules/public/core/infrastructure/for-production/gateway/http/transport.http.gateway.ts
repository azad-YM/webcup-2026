import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { TransportGateway } from "../../../../application/ports/gateway/transport.gateway"
import type { TransportLine, TripHelp, TripRequest } from "../../../../domain/transport"

/** F97 : lignes de transport (Administration) et aide au trajet (Assistance), sans compte. */
export class TransportHttpGateway implements TransportGateway {
  constructor(private readonly apiBaseUrl: string) {}

  private async call<T>(path: string, what: string, body?: unknown): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${this.apiBaseUrl.replace(/\/$/, "")}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
        body: body === undefined ? undefined : JSON.stringify(body)
      })
    } catch {
      throw new AppError("NETWORK_ERROR", `Impossible de charger ${what}. Vérifiez votre connexion puis réessayez.`)
    }
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null
      if (response.status === 503) throw new AppError(503, "L’aide au trajet est suspendue pendant la surcharge du serveur : consultez l’état des lignes ci-dessous.")
      throw new AppError(response.status, (response.status === 429 || response.status === 422) && payload?.message ? payload.message : `${what[0]?.toUpperCase()}${what.slice(1)} ne répond pas pour le moment. Réessayez dans quelques instants.`)
    }
    return (await response.json()) as T
  }

  listLines() {
    return this.call<TransportLine[]>("/administration/transport-lines", "l’état des lignes")
  }

  findTrip(request: TripRequest) {
    return this.call<TripHelp>("/assistance/transport", "l’aide au trajet", request)
  }
}
