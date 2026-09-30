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

window.addEventListener("storage", event => {
  if (event.key === SESSION_STORAGE_KEY || event.key === null) {
    app.store.dispatch(sessionCleared())
  }
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DependenciesProvider dependencies={app.dependencies}>
      <Provider store={app.store}>
        <RouterProvider router={router} />
      </Provider>
    </DependenciesProvider>
  </React.StrictMode>
)
