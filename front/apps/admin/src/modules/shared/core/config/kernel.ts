import { CitizenAccountsHttpGateway } from "@/modules/citizen-accounts/core/infrastructure/for-production/gateway/http/citizen-accounts.http.gateway"
import { AuthAccountSessionProvider } from "@/modules/auth/core/infrastructure/adapter/citizen-accounts/auth-account-session.provider"
import { SecurityJournalHttpGateway } from "@/modules/security/core/infrastructure/for-production/gateway/http/security-journal.http.gateway"
import { AuthSecuritySessionProvider } from "@/modules/auth/core/infrastructure/adapter/security/auth-security-session.provider"
import { ContentHttpGateway } from "@/modules/content/core/infrastructure/for-production/gateway/http/content.http.gateway"
import { AuthContentSessionProvider } from "@/modules/auth/core/infrastructure/adapter/content/auth-content-session.provider"
import { sessionCleared } from "./session"
import { AuthAccessSessionProvider } from "@/modules/auth/core/infrastructure/adapter/admin/auth-access-session.provider"
import { PermissionHttpGateway } from "@/modules/admin/core/infrastructure/for-production/gateway/http/permission.http.gateway"
import { RoleHttpGateway } from "@/modules/admin/core/infrastructure/for-production/gateway/http/role.http.gateway"
import { MemberHttpGateway } from "@/modules/admin/core/infrastructure/for-production/gateway/http/member.http.gateway"
import { AuthPilotageSessionProvider } from "@/modules/auth/core/infrastructure/adapter/pilotage/auth-pilotage-session.provider"
import { WebcupFeedHttpGateway } from "@/modules/pilotage/core/infrastructure/for-production/gateway/http/webcup-feed.http.gateway"
import { SeenRequestsLocalStorageGateway } from "@/modules/pilotage/core/infrastructure/for-production/gateway/local/seen-requests.local-storage.gateway"
import { AuthSessionLocalStorageGateway } from "@/modules/auth/core/infrastructure/for-production/gateway/local/auth-session.local-storage.gateway"
import { AuthHttpGateway } from "@/modules/auth/core/infrastructure/for-production/gateway/http/auth.http.gateway"
import { PortalLoginHttpGateway } from "@/modules/auth/core/infrastructure/for-production/gateway/http/portal-login.http.gateway"
import { AuthRequestSessionProvider } from "@/modules/auth/core/infrastructure/adapter/requests/auth-request-session.provider"
import { RequestQueueHttpGateway } from "@/modules/requests/core/infrastructure/for-production/gateway/http/request-queue.http.gateway"
import { REQUEST_EVENTS } from "@/modules/requests/core/application/rtk-api/requests"
import { AgentDeskHttpGateway } from "@/modules/requests/core/infrastructure/for-production/gateway/http/agent-desk.http.gateway"
import { DESK_EVENTS } from "@/modules/requests/core/application/rtk-api/agent-desk"
import { SseRealtimeSubscriber } from "../infrastructure/sse-realtime.subscriber"
import type { Dependencies } from "./dependencies"
import { createStore, type AppStore } from "./store"

export class App {
  public dependencies: Dependencies
  public store: AppStore

  constructor() {
    this.dependencies = this.setupDependencies()
    this.store = createStore({ dependencies: this.dependencies })
  }

  private setupDependencies(): Dependencies {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api"
    const siteUrl = import.meta.env.VITE_SITE_URL || "http://localhost:5178"
    const onSessionInvalidated = () => this.store.dispatch(sessionCleared())
    const authSessionGateway = new AuthSessionLocalStorageGateway()
    // Each consumer module owns its session port; the auth module provides one adapter per consumer.
    const adminSession = new AuthAccessSessionProvider(authSessionGateway, onSessionInvalidated)
    const pilotageSession = new AuthPilotageSessionProvider(authSessionGateway, onSessionInvalidated)
    const requestSession = new AuthRequestSessionProvider(authSessionGateway, onSessionInvalidated)
    const contentSession = new AuthContentSessionProvider(authSessionGateway, onSessionInvalidated)

    return {
      citizenAccountsGateway: new CitizenAccountsHttpGateway(apiBaseUrl, new AuthAccountSessionProvider(authSessionGateway, onSessionInvalidated)),
      securityJournalGateway: new SecurityJournalHttpGateway(apiBaseUrl, new AuthSecuritySessionProvider(authSessionGateway, onSessionInvalidated)),
      authSessionGateway,
      authGateway: new AuthHttpGateway(apiBaseUrl, authSessionGateway, onSessionInvalidated),
      portalLoginGateway: new PortalLoginHttpGateway(apiBaseUrl, siteUrl, authSessionGateway),
      permissionGateway: new PermissionHttpGateway(apiBaseUrl, adminSession),
      roleGateway: new RoleHttpGateway(apiBaseUrl, adminSession),
      memberGateway: new MemberHttpGateway(apiBaseUrl, adminSession),
      webcupFeedGateway: new WebcupFeedHttpGateway(apiBaseUrl, pilotageSession),
      seenRequestsGateway: new SeenRequestsLocalStorageGateway(),
      requestQueueGateway: new RequestQueueHttpGateway(apiBaseUrl, requestSession),
      agentDeskGateway: new AgentDeskHttpGateway(apiBaseUrl, requestSession),
      // One stream per tab; the list gathers the events listened to by the admin screens.
      realtime: new SseRealtimeSubscriber(apiBaseUrl, () => authSessionGateway.getToken(), [...REQUEST_EVENTS, ...DESK_EVENTS]),
      contentGateway: new ContentHttpGateway(apiBaseUrl, contentSession),
    }
  }
}

export const app = new App()
