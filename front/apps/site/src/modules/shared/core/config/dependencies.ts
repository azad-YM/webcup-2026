import type { AuthGateway } from "@/modules/auth/core/application/ports/gateway/auth.gateway"
import type { AuthSessionGateway } from "@/modules/auth/core/application/ports/gateway/auth-session.gateway"
import type { AccountRegistrationGateway } from "@/modules/auth/core/application/ports/gateway/account-registration.gateway"
import type { CitizenGateway } from "@/modules/citizen/core/application/ports/gateway/citizen.gateway"
import type { CitizenSessionProvider } from "@/modules/citizen/core/application/ports/provider/citizen-session.provider"
import type { ServiceCatalogGateway } from "@/modules/public/core/application/ports/gateway/service-catalog.gateway"
import type { PublicationGateway } from "@/modules/public/core/application/ports/gateway/publication.gateway"
import type { AlertsGateway } from "@/modules/public/core/application/ports/gateway/alerts.gateway"
import type { CityFeedGateway } from "@/modules/public/core/application/ports/gateway/city-feed.gateway"

export type Dependencies = {
  // auth
  authGateway: AuthGateway
  authSessionGateway: AuthSessionGateway
  accountRegistrationGateway: AccountRegistrationGateway
  // citizen
  citizenGateway: CitizenGateway
  citizenSessionProvider: CitizenSessionProvider
  // public : services (Administration), publications et alertes (Communication), flux temps réel
  serviceCatalogGateway: ServiceCatalogGateway
  publicationGateway: PublicationGateway
  alertsGateway: AlertsGateway
  cityFeedGateway: CityFeedGateway
}
