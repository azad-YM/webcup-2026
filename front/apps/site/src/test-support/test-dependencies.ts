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
    deviceIdentityGateway: { deviceId: () => "test-device-identifier", saveLoginLinkSecret: () => undefined, loginLinkSecret: () => null, clearLoginLinkSecret: () => undefined },
    accountSecurityGateway: {
      getSecurity: async () => { throw new Error("Not configured") },
      sendReconfirmationCode: async () => { throw new Error("Not configured") },
      setEmailVerification: async () => { throw new Error("Not configured") },
      reportDevice: async () => { throw new Error("Not configured") },
      changePassword: async () => { throw new Error("Not configured") }
    },
    personalDataGateway: { export: async () => { throw new Error("Not configured") } },
    identityCodeProvider: { sendCode: async () => { throw new Error("Not configured") } },
    accountRegistrationGateway: new CitizenAccountRegistrationAdapter(citizenGateway),
    residentAccessGateway: { accountStatus: async () => ({ residentId: null, passwordChangeRequired: false }) },
    citizenGateway,
    citizenSessionProvider: new AuthCitizenSessionAdapter(overrides.authSessionGateway ?? authSessionGateway),
    serviceRequestGateway: {
      listMine: async () => [],
      getMine: async () => { throw new Error("Not configured") },
      submit: async () => { throw new Error("Not configured") },
      listMessages: async () => ({ items: [], canReply: false }),
      postMessage: async () => { throw new Error("Not configured") },
      getReceipt: async () => { throw new Error("Not configured") },
      verifyReceipt: async (reference: string) => ({ valid: false, reference, submittedAt: null })
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
    officialMessageReadGateway: { readIds: async () => [], markRead: async (id: string) => [id] },
    cityFeedGateway: new InMemoryCityFeedGateway(),
    serviceFinderGateway: {
      search: async ({ query }) => ({ query, results: [], suggestion: null, reformulation: null, source: "local", modelAvailable: false }),
      refine: async ({ query }) => ({ query, results: [], suggestion: null, reformulation: null, source: "local", modelAvailable: false })
    },
    explanationGateway: { explain: async () => ({ explanation: null, terms: [], source: "local", modelAvailable: false }) },
    orientationGateway: { orient: async () => { throw new Error("Not configured") } },
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
