import { alertsApi } from "@/modules/public/core/application/rtk-api/alerts"
import { configureStore } from "@reduxjs/toolkit"
import { authApi } from "@/modules/auth/core/application/rtk-api/auth"
import { citizenApi } from "@/modules/citizen/core/application/rtk-api/citizen"
import { serviceRequestsApi } from "@/modules/citizen/core/application/rtk-api/service-requests"
import { notificationsApi } from "@/modules/citizen/core/application/rtk-api/notifications"
import { appointmentsApi } from "@/modules/citizen/core/application/rtk-api/appointments"
import { participationApi } from "@/modules/citizen/core/application/rtk-api/participation"
import { personalDataApi } from "@/modules/citizen/core/application/rtk-api/personal-data"
import { publicApi } from "@/modules/public/core/application/rtk-api/public"
import { cityParticipationApi } from "@/modules/participation/core/application/rtk-api/city-participation"
import type { Dependencies } from "./dependencies"

export const createStore = (dependencies: Dependencies) =>
  configureStore({
    reducer: {
      [alertsApi.reducerPath]: alertsApi.reducer,
      [authApi.reducerPath]: authApi.reducer,
      [citizenApi.reducerPath]: citizenApi.reducer,
      [serviceRequestsApi.reducerPath]: serviceRequestsApi.reducer,
      [publicApi.reducerPath]: publicApi.reducer,
      [notificationsApi.reducerPath]: notificationsApi.reducer,
      [appointmentsApi.reducerPath]: appointmentsApi.reducer,
      [participationApi.reducerPath]: participationApi.reducer,
      [cityParticipationApi.reducerPath]: cityParticipationApi.reducer,
      [personalDataApi.reducerPath]: personalDataApi.reducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: dependencies } }).concat(
        alertsApi.middleware,
        authApi.middleware,
        citizenApi.middleware,
        serviceRequestsApi.middleware,
        publicApi.middleware,
        notificationsApi.middleware,
        appointmentsApi.middleware,
        participationApi.middleware,
        cityParticipationApi.middleware,
        personalDataApi.middleware
      ),
    devTools: false
  })
export type AppStore = ReturnType<typeof createStore>
export type AppState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]

/** Vide les caches liés au compte connecté (déconnexion, changement de compte). */
export const resetAccountCaches = (store: AppStore) => {
  store.dispatch(alertsApi.util.resetApiState())
  store.dispatch(authApi.util.resetApiState())
  store.dispatch(citizenApi.util.resetApiState())
  store.dispatch(serviceRequestsApi.util.resetApiState())
  store.dispatch(notificationsApi.util.resetApiState())
  store.dispatch(appointmentsApi.util.resetApiState())
  store.dispatch(participationApi.util.resetApiState())
  store.dispatch(cityParticipationApi.util.resetApiState())
  store.dispatch(personalDataApi.util.resetApiState())
}
