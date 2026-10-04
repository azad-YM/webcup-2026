import { AppError } from "@/modules/shared/core/lib/use-cases.decorator"
import type { OrientationGateway } from "../../../../application/ports/gateway/orientation.gateway"
import type { OrientationReply, OrientParams } from "../../../../domain/orientation"

/** `POST /assistance/orientation`, sans compte et sans donnée d’identité. */
export class OrientationHttpGateway implements OrientationGateway {
  constructor(private readonly apiBaseUrl: string) {}

  async orient({ messages, locale }: OrientParams): Promise<OrientationReply> {
    let response: Response
    try {
      response = await fetch(`${this.apiBaseUrl.replace(/\/$/, "")}/assistance/orientation`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ messages, language: locale })
      })
    } catch {
      throw new AppError("NETWORK_ERROR", "Impossible de joindre l’assistant. Vérifiez votre connexion puis réessayez.")
    }
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null
      const message = response.status === 429 || response.status === 422 ? payload?.message ?? payload?.error : undefined
      throw new AppError(response.status, message ?? "L’assistant ne répond pas pour le moment. Réessayez dans quelques instants, ou contactez la mairie.")
    }
    return (await response.json()) as OrientationReply
  }
}
