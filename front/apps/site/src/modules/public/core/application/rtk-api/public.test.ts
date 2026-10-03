import { describe, expect, it } from "vitest"
import { createTestContext } from "@/test-support/test-dependencies"
import { DEMO_PUBLICATIONS, DEMO_SERVICES } from "../../infrastructure/for-production/gateway/local/demo-content"
import { LocalPublicationGateway, LocalServiceCatalogGateway } from "../../infrastructure/for-production/gateway/local/public-content.local.gateway"
import { publicApi } from "./public"

describe("Vitrine — cas d’usage", () => {
  it("liste les services du catalogue", async () => {
    const { store, serviceCatalogGateway } = createTestContext()
    serviceCatalogGateway.services = DEMO_SERVICES.slice(0, 2)
    const services = await store.dispatch(publicApi.endpoints.listServices.initiate(undefined, { subscribe: false })).unwrap()
    expect(services.map((s) => s.id)).toEqual(["etat-civil", "sante"])
  })

  it("trie les publications de la plus récente à la plus ancienne", async () => {
    const { store, publicationGateway } = createTestContext()
    publicationGateway.publications = [...DEMO_PUBLICATIONS].reverse()
    const publications = await store.dispatch(publicApi.endpoints.listPublications.initiate(undefined, { subscribe: false })).unwrap()
    expect(publications[0]?.id).toBe("centre-sante-aurore")
  })

  it("expose une erreur temporaire distincte d’une liste vide", async () => {
    const { store, publicationGateway } = createTestContext()
    expect(await store.dispatch(publicApi.endpoints.listPublications.initiate(undefined, { subscribe: false })).unwrap()).toEqual([])
    publicationGateway.failing = true
    await expect(store.dispatch(publicApi.endpoints.listPublications.initiate(undefined, { subscribe: false, forceRefetch: true })).unwrap())
      .rejects.toMatchObject({ status: "NETWORK_ERROR" })
  })

  it("les adaptateurs locaux renvoient une copie du contenu de démonstration", async () => {
    const services = await new LocalServiceCatalogGateway().listServices()
    services[0]!.name = "modifié"
    expect((await new LocalServiceCatalogGateway().listServices())[0]?.name).toBe(DEMO_SERVICES[0]?.name)
    expect(await new LocalPublicationGateway().listPublications()).toHaveLength(3)
  })
})
