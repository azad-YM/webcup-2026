"use client"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react"
import { siteEnv } from "@/config/env"
import { Provider } from "react-redux"
import { setupListeners } from "@reduxjs/toolkit/query"
import { isLightModeActive } from "@boilerplate/shared-ui/a11y"
import { useLightMode } from "./sobriety/light-mode"
import { createStore, resetAccountCaches } from "../core/config/store"
import type { Dependencies } from "../core/config/dependencies"
import { AuthHttpGateway } from "@/modules/auth/core/infrastructure/for-production/gateway/http/auth.http.gateway"
import { ResidentAccessHttpGateway } from "@/modules/auth/core/infrastructure/for-production/gateway/http/resident-access.http.gateway"
import {
  LocalStorageAuthSessionGateway,
  SESSION_KEY
} from "@/modules/auth/core/infrastructure/for-production/gateway/auth-session.local-storage.gateway"
import { LocalStorageDeviceIdentityGateway } from "@/modules/auth/core/infrastructure/for-production/gateway/device-identity.local-storage.gateway"
import { AuthCitizenSessionAdapter } from "@/modules/auth/core/infrastructure/adapter/citizen/auth-citizen-session.adapter"
import { CitizenHttpGateway } from "@/modules/citizen/core/infrastructure/for-production/gateway/http/citizen.http.gateway"
import { CitizenAccountRegistrationAdapter } from "@/modules/citizen/core/infrastructure/adapter/auth/citizen-account-registration.adapter"
import { ServiceRequestHttpGateway } from "@/modules/citizen/core/infrastructure/for-production/gateway/http/service-request.http.gateway"
import { REQUEST_EVENTS } from "@/modules/citizen/core/application/rtk-api/service-requests"
import { NotificationHttpGateway } from "@/modules/citizen/core/infrastructure/for-production/gateway/http/notification.http.gateway"
import { NOTIFICATION_EVENTS } from "@/modules/citizen/core/application/rtk-api/notifications"
import { AppointmentHttpGateway } from "@/modules/citizen/core/infrastructure/for-production/gateway/http/appointment.http.gateway"
import { APPOINTMENT_EVENTS } from "@/modules/citizen/core/application/rtk-api/appointments"
import { ParticipationHttpGateway } from "@/modules/citizen/core/infrastructure/for-production/gateway/http/participation.http.gateway"
import { PersonalDataHttpGateway } from "@/modules/citizen/core/infrastructure/for-production/gateway/http/personal-data.http.gateway"
import { AuthIdentityCodeAdapter } from "@/modules/auth/core/infrastructure/adapter/citizen/auth-identity-code.adapter"
import { SseRealtimeSubscriber } from "../core/infrastructure/realtime/sse-realtime.subscriber"
import { HttpPublicContentGateway } from "@/modules/public/core/infrastructure/for-production/gateway/http/public-content.http.gateway"
import { OfficialMessageReadLocalStorageGateway } from "@/modules/public/core/infrastructure/for-production/gateway/local/official-message-read.local-storage.gateway"
import { AlertsHttpGateway } from "@/modules/public/core/infrastructure/for-production/gateway/http/alerts.http.gateway"
import { AssistanceHttpGateway } from "@/modules/public/core/infrastructure/for-production/gateway/http/assistance.http.gateway"
import { OrientationHttpGateway } from "@/modules/assistance/core/infrastructure/for-production/gateway/http/orientation.http.gateway"
import { CITY_FEED_EVENTS } from "@/modules/public/core/application/ports/gateway/city-feed.gateway"
import { RealtimeCityFeedAdapter } from "../core/infrastructure/adapter/public/realtime-city-feed.adapter"
import { AuthPublicSessionAdapter } from "@/modules/auth/core/infrastructure/adapter/public/auth-public-session.adapter"
import { ParticipationServiceRatingsAdapter } from "@/modules/participation/core/infrastructure/adapter/public/participation-service-ratings.adapter"
import { CityParticipationHttpGateway } from "@/modules/participation/core/infrastructure/for-production/gateway/http/city-participation.http.gateway"
import { AuthParticipationSessionAdapter } from "@/modules/auth/core/infrastructure/adapter/participation/auth-participation-session.adapter"

type Session = {
  ready: boolean
  hasToken: boolean
  storageError: boolean
  refresh: () => void
  logout: () => void
}
const SessionContext = createContext<Session | null>(null)

/** Composition du site : chaque port reçoit son adaptateur de production. */
function createDependencies(): Dependencies {
  const authSessionGateway = new LocalStorageAuthSessionGateway()
  const citizenGateway = new CitizenHttpGateway(siteEnv.apiBaseUrl)
  const publicSession = new AuthPublicSessionAdapter(authSessionGateway)
  const publicContent = new HttpPublicContentGateway(siteEnv.apiBaseUrl)
  // Un seul flux SSE par onglet (ADR 004) : il écoute l'union des événements des modules et sert
  // `citizen` (demandes, notifications) comme `public` (alertes, publications, via `CityFeedGateway`).
  const realtime = new SseRealtimeSubscriber(siteEnv.apiBaseUrl, () => authSessionGateway.getToken(), [
    ...REQUEST_EVENTS,
    ...NOTIFICATION_EVENTS,
    ...APPOINTMENT_EVENTS,
    ...CITY_FEED_EVENTS
  ], isLightModeActive)
  const authGateway = new AuthHttpGateway(siteEnv.apiBaseUrl)
  const cityParticipation = new CityParticipationHttpGateway(siteEnv.apiBaseUrl)
  const assistance = new AssistanceHttpGateway(siteEnv.apiBaseUrl)
  return {
    realtime,
    authGateway,
    accountSecurityGateway: authGateway,
    deviceIdentityGateway: new LocalStorageDeviceIdentityGateway(),
    authSessionGateway,
    residentAccessGateway: new ResidentAccessHttpGateway(siteEnv.apiBaseUrl),
    accountRegistrationGateway: new CitizenAccountRegistrationAdapter(citizenGateway),
    citizenGateway,
    citizenSessionProvider: new AuthCitizenSessionAdapter(authSessionGateway),
    serviceRequestGateway: new ServiceRequestHttpGateway(siteEnv.apiBaseUrl),
    notificationGateway: new NotificationHttpGateway(siteEnv.apiBaseUrl),
    appointmentGateway: new AppointmentHttpGateway(siteEnv.apiBaseUrl),
    participationGateway: new ParticipationHttpGateway(siteEnv.apiBaseUrl),
    personalDataGateway: new PersonalDataHttpGateway(siteEnv.apiBaseUrl),
    identityCodeProvider: new AuthIdentityCodeAdapter(authSessionGateway, authGateway),
    // Contenus publiés par les BC propriétaires (Administration, Communication) et flux temps réel.
    serviceCatalogGateway: publicContent,
    publicationGateway: publicContent,
    alertsGateway: new AlertsHttpGateway(siteEnv.apiBaseUrl, publicSession),
    officialMessageReadGateway: new OfficialMessageReadLocalStorageGateway(),
    cityFeedGateway: new RealtimeCityFeedAdapter(realtime),
    serviceFinderGateway: assistance,
    explanationGateway: assistance,
    orientationGateway: new OrientationHttpGateway(siteEnv.apiBaseUrl),
    cityParticipationGateway: cityParticipation,
    serviceRatingsProvider: new ParticipationServiceRatingsAdapter(cityParticipation),
    participationSessionProvider: new AuthParticipationSessionAdapter(authSessionGateway)
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [runtime] = useState(() => {
    const dependencies = createDependencies()
    return {
      authSessionGateway: dependencies.authSessionGateway,
      realtime: dependencies.realtime,
      store: createStore(dependencies)
    }
  })
  const [session, setSession] = useState({
    ready: false,
    hasToken: false,
    storageError: false
  })
  const refresh = useCallback(() => {
    try {
      setSession({
        ready: true,
        hasToken: Boolean(runtime.authSessionGateway.getToken()),
        storageError: false
      })
    } catch {
      setSession({ ready: true, hasToken: false, storageError: true })
    }
  }, [runtime])
  const logout = useCallback(() => {
    try {
      runtime.authSessionGateway.clear()
    } catch {
      /* La session mémoire est fermée même si le stockage devient indisponible. */
    } finally {
      setSession({ ready: true, hasToken: false, storageError: false })
      resetAccountCaches(runtime.store)
      runtime.realtime.restart()
    }
  }, [runtime])
  // L17 : suivi de la visibilité de l'onglet et du réseau (pas de rafraîchissement de secours onglet caché).
  useEffect(() => setupListeners(runtime.store.dispatch), [runtime])
  // Mode léger (F62) : pas de temps réel ; le flux rouvre quand le mode léger est désactivé.
  const lightMode = useLightMode().active
  // Connexion ou déconnexion : l'unique flux temps réel rouvre avec (ou sans) les topics privés du citoyen.
  useEffect(() => {
    if (session.ready) runtime.realtime.restart()
  }, [session.ready, session.hasToken, lightMode, runtime])
  useEffect(() => {
    refresh()
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY || event.key === null) {
        resetAccountCaches(runtime.store)
        runtime.realtime.restart()
        refresh()
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [refresh, runtime])
  return (
    <Provider store={runtime.store}>
      <SessionContext.Provider value={{ ...session, refresh, logout }}>
        {children}
      </SessionContext.Provider>
    </Provider>
  )
}
export function useSession() {
  const session = useContext(SessionContext)
  if (!session) throw new Error("StoreProvider manquant")
  return session
}
