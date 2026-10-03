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
import { createStore, resetAccountCaches } from "../core/config/store"
import type { Dependencies } from "../core/config/dependencies"
import { AuthHttpGateway } from "@/modules/auth/core/infrastructure/for-production/gateway/http/auth.http.gateway"
import {
  LocalStorageAuthSessionGateway,
  SESSION_KEY
} from "@/modules/auth/core/infrastructure/for-production/gateway/auth-session.local-storage.gateway"
import { AuthCitizenSessionAdapter } from "@/modules/auth/core/infrastructure/adapter/citizen/auth-citizen-session.adapter"
import { CitizenHttpGateway } from "@/modules/citizen/core/infrastructure/for-production/gateway/http/citizen.http.gateway"
import { CitizenAccountRegistrationAdapter } from "@/modules/citizen/core/infrastructure/adapter/auth/citizen-account-registration.adapter"
import { ServiceRequestHttpGateway } from "@/modules/citizen/core/infrastructure/for-production/gateway/http/service-request.http.gateway"
import { REQUEST_EVENTS } from "@/modules/citizen/core/application/rtk-api/service-requests"
import { SseRealtimeSubscriber } from "../core/infrastructure/realtime/sse-realtime.subscriber"
import { HttpPublicContentGateway } from "@/modules/public/core/infrastructure/for-production/gateway/http/public-content.http.gateway"
import { AlertsHttpGateway } from "@/modules/public/core/infrastructure/for-production/gateway/http/alerts.http.gateway"
import { SseCityFeedGateway } from "@/modules/public/core/infrastructure/for-production/gateway/realtime/city-feed.sse.gateway"
import { AuthPublicSessionAdapter } from "@/modules/auth/core/infrastructure/adapter/public/auth-public-session.adapter"

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
  return {
    // Un seul flux SSE par onglet ; la liste réunit les événements écoutés par les écrans du site.
    realtime: new SseRealtimeSubscriber(siteEnv.apiBaseUrl, () => authSessionGateway.getToken(), [...REQUEST_EVENTS]),
    authGateway: new AuthHttpGateway(siteEnv.apiBaseUrl),
    authSessionGateway,
    accountRegistrationGateway: new CitizenAccountRegistrationAdapter(citizenGateway),
    citizenGateway,
    citizenSessionProvider: new AuthCitizenSessionAdapter(authSessionGateway),
    serviceRequestGateway: new ServiceRequestHttpGateway(siteEnv.apiBaseUrl),
    // Contenus publiés par les BC propriétaires (Administration, Communication) et flux temps réel.
    serviceCatalogGateway: publicContent,
    publicationGateway: publicContent,
    alertsGateway: new AlertsHttpGateway(siteEnv.apiBaseUrl, publicSession),
    cityFeedGateway: new SseCityFeedGateway(siteEnv.apiBaseUrl, publicSession)
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [runtime] = useState(() => {
    const dependencies = createDependencies()
    return {
      authSessionGateway: dependencies.authSessionGateway,
      cityFeedGateway: dependencies.cityFeedGateway,
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
      runtime.cityFeedGateway.restart()
    }
  }, [runtime])
  // Connexion ou déconnexion : le flux temps réel rouvre avec (ou sans) les topics privés du citoyen.
  useEffect(() => {
    if (session.ready) runtime.cityFeedGateway.restart()
  }, [session.ready, session.hasToken, runtime])
  useEffect(() => {
    refresh()
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY || event.key === null) {
        resetAccountCaches(runtime.store)
        runtime.cityFeedGateway.restart()
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
