import { sessionCleared } from "./session"
import { AuthAccessSessionProvider } from "@/modules/auth/core/infrastructure/adapter/admin/auth-access-session.provider"
import { AuthExampleSessionProvider } from "@/modules/auth/core/infrastructure/adapter/example/auth-example-session.provider"
import { PermissionHttpGateway } from "@/modules/admin/core/infrastructure/for-production/gateway/http/permission.http.gateway"
import { RoleHttpGateway } from "@/modules/admin/core/infrastructure/for-production/gateway/http/role.http.gateway"
import { AuthSessionLocalStorageGateway } from "@/modules/auth/core/infrastructure/for-production/gateway/local/auth-session.local-storage.gateway"
import { AuthHttpGateway } from "@/modules/auth/core/infrastructure/for-production/gateway/http/auth.http.gateway"
import { PortalLoginHttpGateway } from "@/modules/auth/core/infrastructure/for-production/gateway/http/portal-login.http.gateway"
import { ItemHttpGateway } from "@/modules/example/core/infrastructure/for-production/gateway/http/item.http.gateway"
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
    const exampleSession = new AuthExampleSessionProvider(authSessionGateway, onSessionInvalidated)

    return {
      authSessionGateway,
      authGateway: new AuthHttpGateway(apiBaseUrl, authSessionGateway, onSessionInvalidated),
      portalLoginGateway: new PortalLoginHttpGateway(apiBaseUrl, siteUrl, authSessionGateway),
      permissionGateway: new PermissionHttpGateway(apiBaseUrl, adminSession),
      roleGateway: new RoleHttpGateway(apiBaseUrl, adminSession),
      itemGateway: new ItemHttpGateway(apiBaseUrl, exampleSession),
    }
  }
}

export const app = new App()
