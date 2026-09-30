import { ApiClient, ApiHttpError } from "@boilerplate/shared-utils/api-client"
import type { CreateItemPayload, UpdateItemPayload } from "../../../../application/dto/item.dto"
import { ExampleError } from "../../../../application/errors/example.error"
import type { ItemGateway } from "../../../../application/ports/gateway/item.gateway"
import type { AccessSessionProvider } from "../../../../application/ports/provider/access-session.provider"
import type { Item } from "../../../../domain/item"

const PATH = "/example/items"

export class ItemHttpGateway extends ApiClient implements ItemGateway {
  constructor(baseUrl: string, private readonly session: AccessSessionProvider) {
    super(baseUrl, () => session.getToken())
  }

  list(): Promise<Item[]> {
    return this.authorized(() => this.getAuth<Item[]>(PATH))
  }

  create(payload: CreateItemPayload): Promise<Item> {
    return this.authorized(() => this.postAuth<Item>(PATH, payload))
  }

  update(payload: UpdateItemPayload): Promise<Item> {
    return this.authorized(() => this.putAuth<Item>(PATH, payload))
  }

  async remove(id: string): Promise<void> {
    // The API reads the identifier from the JSON body (MapRequestPayload), as for the other commands.
    await this.authorized(() => this.deleteAuth<null>(PATH, {}, { id }))
  }

  private async authorized<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (error) {
      if (error instanceof ExampleError) throw error
      if (error instanceof ApiHttpError) {
        if (error.status === 401) {
          this.session.invalidate()
          throw new ExampleError("unauthenticated", "Votre session a expiré. Reconnectez-vous depuis le site.")
        }
        if (error.status === 403) throw new ExampleError("forbidden", "Vous n’avez pas les droits nécessaires pour cette opération.")
        if (error.status === 404) throw new ExampleError("not-found", "Cet élément n’existe plus. Actualisez la liste.")
        if (error.status === 422) throw new ExampleError("invalid", error.payload?.error ?? "Les informations saisies ont été refusées.")
      }
      throw new ExampleError("unavailable", "Le service est indisponible. Réessayez dans quelques instants.")
    }
  }
}
