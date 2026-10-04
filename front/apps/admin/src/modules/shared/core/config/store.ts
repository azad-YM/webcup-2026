import {
  combineReducers,
  configureStore,
  createListenerMiddleware,
  type Action,
} from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { citizenAccountsApi } from "@/modules/citizen-accounts/core/application/rtk-api/citizen-accounts"
import { securityApi } from "@/modules/security/core/application/rtk-api/security"
import { authApi } from "@/modules/auth/core/application/rtk-api/auth"
import { accessManagementApi } from "@/modules/admin/core/application/rtk-api/access-management"
import { pilotageApi } from "@/modules/pilotage/core/application/rtk-api/pilotage"
import { requestsApi } from "@/modules/requests/core/application/rtk-api/requests"
import { contentApi } from "@/modules/content/core/application/rtk-api/content"
import { participationApi } from "@/modules/participation/core/application/rtk-api/participation"
import { auditApi } from "@/modules/audit/core/application/rtk-api/audit"
import type { Dependencies } from "./dependencies"
import { sessionCleared } from "./session"

export type AppStore = ReturnType<typeof createStore>
export type AppState = ReturnType<typeof reducers>

export type AppDispatch = AppStore["dispatch"]
export type AppGetState = AppStore["getState"]

const reducers = combineReducers({
  [citizenAccountsApi.reducerPath]: citizenAccountsApi.reducer,
  [securityApi.reducerPath]: securityApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [accessManagementApi.reducerPath]: accessManagementApi.reducer,
  [pilotageApi.reducerPath]: pilotageApi.reducer,
  [requestsApi.reducerPath]: requestsApi.reducer,
  [contentApi.reducerPath]: contentApi.reducer,
  [participationApi.reducerPath]: participationApi.reducer,
  [auditApi.reducerPath]: auditApi.reducer,
})

// A session change (logout, 401, other tab) wipes every cache.
const reducer = (state: AppState | undefined, action: Action) => {
  return reducers(sessionCleared.match(action) ? undefined : state, action)
}

export const createStore = (config: {
  initialState?: AppState,
  dependencies: Dependencies
}) => {
  const store = configureStore({
    preloadedState: config.initialState,
    reducer: reducer,
    devTools: true,
    middleware: (getDefaultMiddleware) => {
      const listener = createListenerMiddleware()
      const middleware = getDefaultMiddleware({
        thunk: {
          extraArgument: config.dependencies
        }
      })

      middleware.unshift(listener.middleware)
      middleware.push(
        citizenAccountsApi.middleware,
        securityApi.middleware,
        authApi.middleware,
        accessManagementApi.middleware,
        pilotageApi.middleware,
        requestsApi.middleware,
        contentApi.middleware,
        participationApi.middleware,
        auditApi.middleware,
      )

      return middleware
    }
  })

  return store
}

export const useAppDispatch = () => useDispatch<AppDispatch>()
