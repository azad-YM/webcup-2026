import { configureStore } from "@reduxjs/toolkit"
import { authApi } from "@/modules/auth/core/application/rtk-api/auth"
import { citizenApi } from "@/modules/citizen/core/application/rtk-api/citizen"
import { publicApi } from "@/modules/public/core/application/rtk-api/public"
import type { Dependencies } from "./dependencies"
import { serviceRequestsApi } from "@/modules/citizen/core/application/rtk-api/service-requests"
export const createStore = (dependencies: Dependencies) =>
  configureStore({
    reducer: {
      [serviceRequestsApi.reducerPath]: serviceRequestsApi.reducer,
      [authApi.reducerPath]: authApi.reducer,
      [citizenApi.reducerPath]: citizenApi.reducer,
      [publicApi.reducerPath]: publicApi.reducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: dependencies } }).concat(
        serviceRequestsApi.middleware,
        authApi.middleware,
        citizenApi.middleware,
        publicApi.middleware
      ),
    devTools: false
  })
export type AppStore = ReturnType<typeof createStore>
export type AppState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]

/** Vide les caches liés au compte connecté (déconnexion, changement de compte). */
export const resetAccountCaches = (store: AppStore) => {
  store.dispatch(serviceRequestsApi.util.resetApiState())
  store.dispatch(authApi.util.resetApiState())
  store.dispatch(citizenApi.util.resetApiState())
}
