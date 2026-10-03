import {
  combineReducers,
  configureStore,
  createListenerMiddleware,
  type Action,
} from "@reduxjs/toolkit"
import { useDispatch } from "react-redux"
import { authApi } from "@/modules/auth/core/application/rtk-api/auth"
import { accessManagementApi } from "@/modules/admin/core/application/rtk-api/access-management"
import { pilotageApi } from "@/modules/pilotage/core/application/rtk-api/pilotage"
import { contentApi } from "@/modules/content/core/application/rtk-api/content"
import type { Dependencies } from "./dependencies"
import { sessionCleared } from "./session"

export type AppStore = ReturnType<typeof createStore>
export type AppState = ReturnType<typeof reducers>

export type AppDispatch = AppStore["dispatch"]
export type AppGetState = AppStore["getState"]

const reducers = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [accessManagementApi.reducerPath]: accessManagementApi.reducer,
  [pilotageApi.reducerPath]: pilotageApi.reducer,
  [contentApi.reducerPath]: contentApi.reducer,
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
        authApi.middleware,
        accessManagementApi.middleware,
        pilotageApi.middleware,
        contentApi.middleware,
      )

      return middleware
    }
  })

  return store
}

export const useAppDispatch = () => useDispatch<AppDispatch>()
