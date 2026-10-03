import { SESSION_STORAGE_KEY } from "@/modules/auth/core/infrastructure/for-production/gateway/local/auth-session.local-storage.gateway"
import { sessionCleared } from "@/modules/shared/core/config/session"
import React from "react"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { RouterProvider } from "react-router"
import "@boilerplate/shared-ui/global.css"
import { router } from "./routes"
import { app } from "@/modules/shared/core/config/kernel"
import { DependenciesProvider } from "@/modules/shared/ui/context/dependencies.context"
import { AccessibilityPreferencesProvider, SkipLink } from "@boilerplate/shared-ui/components/a11y"
import { accessibilityGateways, applyStoredDisplayPreferences } from "@/modules/shared/core/config/accessibility"

// Préférences d’affichage (taille du texte, contraste, animations) appliquées avant le premier rendu.
applyStoredDisplayPreferences()

window.addEventListener("storage", event => {
  if (event.key === SESSION_STORAGE_KEY || event.key === null) {
    app.store.dispatch(sessionCleared())
  }
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AccessibilityPreferencesProvider displayGateway={accessibilityGateways.display} hintsGateway={accessibilityGateways.hints}>
      <SkipLink targetId="contenu" />
      <DependenciesProvider dependencies={app.dependencies}>
        <Provider store={app.store}>
          <RouterProvider router={router} />
        </Provider>
      </DependenciesProvider>
    </AccessibilityPreferencesProvider>
  </React.StrictMode>
)
