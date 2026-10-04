import type { AccountSecurityGateway, AuthGateway } from "@/modules/auth/core/application/ports/gateway/auth.gateway"
import type { DeviceIdentityGateway } from "@/modules/auth/core/application/ports/gateway/device-identity.gateway"
import type { AuthSessionGateway } from "@/modules/auth/core/application/ports/gateway/auth-session.gateway"
import type { ResidentAccessGateway } from "@/modules/auth/core/application/ports/gateway/resident-access.gateway"
import type { AccountRegistrationGateway } from "@/modules/auth/core/application/ports/gateway/account-registration.gateway"
import type { CitizenGateway } from "@/modules/citizen/core/application/ports/gateway/citizen.gateway"
import type { CitizenSessionProvider } from "@/modules/citizen/core/application/ports/provider/citizen-session.provider"
import type { ServiceCatalogGateway } from "@/modules/public/core/application/ports/gateway/service-catalog.gateway"
import type { PublicationGateway } from "@/modules/public/core/application/ports/gateway/publication.gateway"
import type { ServiceRequestGateway } from "@/modules/citizen/core/application/ports/gateway/service-request.gateway"
import type { NotificationGateway } from "@/modules/citizen/core/application/ports/gateway/notification.gateway"
import type { AppointmentGateway } from "@/modules/citizen/core/application/ports/gateway/appointment.gateway"
import type { ParticipationGateway } from "@/modules/citizen/core/application/ports/gateway/participation.gateway"
import type { PersonalDataGateway } from "@/modules/citizen/core/application/ports/gateway/personal-data.gateway"
import type { IdentityCodeProvider } from "@/modules/citizen/core/application/ports/provider/identity-code.provider"
import type { RealtimeSubscriber } from "../application/ports/realtime-subscriber"
import type { AlertsGateway } from "@/modules/public/core/application/ports/gateway/alerts.gateway"
import type { CityFeedGateway } from "@/modules/public/core/application/ports/gateway/city-feed.gateway"
import type { CityParticipationGateway } from "@/modules/participation/core/application/ports/gateway/city-participation.gateway"
import type { ParticipationSessionProvider } from "@/modules/participation/core/application/ports/provider/participation-session.provider"

export type Dependencies = {
  // temps réel (un flux SSE par onglet)
  realtime: RealtimeSubscriber
  // auth
  authGateway: AuthGateway
  authSessionGateway: AuthSessionGateway
  accountRegistrationGateway: AccountRegistrationGateway
  /** F71 : comptes créés à l’accueil (identifiant d’habitant, code provisoire). */
  residentAccessGateway: ResidentAccessGateway
  // L15 : appareil, lien de connexion, « Sécurité du compte »
  deviceIdentityGateway: DeviceIdentityGateway
  accountSecurityGateway: AccountSecurityGateway
  // citizen
  citizenGateway: CitizenGateway
  citizenSessionProvider: CitizenSessionProvider
  serviceRequestGateway: ServiceRequestGateway
  notificationGateway: NotificationGateway
  appointmentGateway: AppointmentGateway
  participationGateway: ParticipationGateway
  // F55 : « Mes données » (Citizen) et code de confirmation fourni par le module auth (IAM)
  personalDataGateway: PersonalDataGateway
  identityCodeProvider: IdentityCodeProvider
  // public : services (Administration), publications et alertes (Communication), flux temps réel
  serviceCatalogGateway: ServiceCatalogGateway
  publicationGateway: PublicationGateway
  alertsGateway: AlertsGateway
  cityFeedGateway: CityFeedGateway
  // participation (BC Participation) : projets, consultations, idées
  cityParticipationGateway: CityParticipationGateway
  participationSessionProvider: ParticipationSessionProvider
}
