/**
 * Support de test transverse : assemble les modules avec leurs doubles,
 * comme le fait `StoreProvider` en production. Jamais importé par le code livré.
 */
import { AuthCitizenSessionAdapter } from "@/modules/auth/core/infrastructure/adapter/citizen/auth-citizen-session.adapter"
import { InMemoryAuthGateway, InMemoryAuthSessionGateway } from "@/modules/auth/core/infrastructure/for-tests/auth.in-memory.gateway"
import { CitizenAccountRegistrationAdapter } from "@/modules/citizen/core/infrastructure/adapter/auth/citizen-account-registration.adapter"
import { InMemoryCitizenGateway } from "@/modules/citizen/core/infrastructure/for-tests/citizen.in-memory.gateway"
import { InMemoryPublicationGateway, InMemoryServiceCatalogGateway } from "@/modules/public/core/infrastructure/for-tests/public-content.in-memory.gateway"
import { InMemoryAlertsGateway } from "@/modules/public/core/infrastructure/for-tests/alerts.in-memory.gateway"
import { InMemoryCityFeedGateway } from "@/modules/public/core/infrastructure/for-tests/city-feed.in-memory.gateway"
import type { Dependencies } from "@/modules/shared/core/config/dependencies"
import { createStore } from "@/modules/shared/core/config/store"

export function createTestContext(overrides: Partial<Dependencies> = {}) {
  const authGateway = new InMemoryAuthGateway()
  const authSessionGateway = new InMemoryAuthSessionGateway()
  const citizenGateway = new InMemoryCitizenGateway()
  const serviceCatalogGateway = new InMemoryServiceCatalogGateway()
  const publicationGateway = new InMemoryPublicationGateway()
  const dependencies: Dependencies = {
    realtime: { subscribe: () => () => undefined, restart: () => undefined },
    authGateway,
    authSessionGateway,
    accountRegistrationGateway: new CitizenAccountRegistrationAdapter(citizenGateway),
    citizenGateway,
    citizenSessionProvider: new AuthCitizenSessionAdapter(overrides.authSessionGateway ?? authSessionGateway),
    serviceRequestGateway: {
      listMine: async () => [],
      getMine: async () => { throw new Error("Not configured") },
      submit: async () => { throw new Error("Not configured") }
    },
    notificationGateway: { list: async () => ({ items: [], unreadCount: 0 }), markRead: async () => undefined },
    appointmentGateway: {
      offer: async () => ({ services: [], slots: [], timezone: "Indian/Reunion", timezoneLabel: "heure de La Réunion (UTC+4)" }),
      listMine: async () => [],
      book: async () => { throw new Error("Not configured") },
      change: async () => { throw new Error("Not configured") }
    },
    participationGateway: {
      listPublicRequests: async () => [],
      support: async () => { throw new Error("Not configured") },
      listConcerns: async () => [],
      raiseConcern: async () => { throw new Error("Not configured") }
    },
    serviceCatalogGateway,
    publicationGateway,
    alertsGateway: new InMemoryAlertsGateway(),
    cityFeedGateway: new InMemoryCityFeedGateway(),
    cityParticipationGateway: {
      listProjects: async () => [],
      getProject: async () => { throw new Error("Not configured") },
      listConsultations: async () => [],
      getConsultation: async () => { throw new Error("Not configured") },
      listIdeas: async () => [],
      listDistricts: async () => [],
      myParticipation: async () => ({ contributions: [], ideas: [] }),
      contribute: async () => { throw new Error("Not configured") },
      proposeIdea: async () => { throw new Error("Not configured") }
    },
    participationSessionProvider: { getToken: () => null },
    ...overrides
  }
  return {
    store: createStore(dependencies),
    authGateway,
    authSessionGateway,
    citizenGateway,
    serviceCatalogGateway,
    publicationGateway
  }
}
