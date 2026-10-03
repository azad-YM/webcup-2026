"use client"
import { AlertsHttpGateway } from "@/modules/public/core/infrastructure/for-production/gateway/http/alerts.http.gateway"
import { AuthPublicSessionAdapter } from "@/modules/auth/core/infrastructure/adapter/public/auth-public-session.adapter"
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
import { HttpPublicContentGateway } from "@/modules/public/core/infrastructure/for-production/gateway/http/public-content.http.gateway"

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
  return {
    alertsGateway: new AlertsHttpGateway(siteEnv.apiBaseUrl, new AuthPublicSessionAdapter(authSessionGateway), { transport: process.env.NEXT_PUBLIC_REALTIME_TRANSPORT ?? "mercure", url: process.env.NEXT_PUBLIC_REALTIME_URL ?? "", key: process.env.NEXT_PUBLIC_PUSHER_KEY, cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER }),
    authGateway: new AuthHttpGateway(siteEnv.apiBaseUrl),
    authSessionGateway,
    accountRegistrationGateway: new CitizenAccountRegistrationAdapter(citizenGateway),
    citizenGateway,
    citizenSessionProvider: new AuthCitizenSessionAdapter(authSessionGateway),
    // Les contenus publiés proviennent des BC propriétaires.
    serviceCatalogGateway: new HttpPublicContentGateway(siteEnv.apiBaseUrl),
    publicationGateway: new HttpPublicContentGateway(siteEnv.apiBaseUrl)
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [runtime] = useState(() => {
    const dependencies = createDependencies()
    return {
      authSessionGateway: dependencies.authSessionGateway,
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
    }
  }, [runtime])
  useEffect(() => {
    refresh()
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY || event.key === null) {
        resetAccountCaches(runtime.store)
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
