import { useNavigate } from "react-router"
import {
  useListSpacesQuery,
} from "@/modules/auth/core/application/rtk-api/auth"
import type { AuthSpace } from "@/modules/auth/core/application/dto/auth.dto"

const LOCAL_SPACE_ROUTES: Record<string, string> = {
  admin: "/admin",
  pilotage: "/pilotage",
  requests: "/demandes",
}

export const useListSpaces = () => {
  const navigate = useNavigate()
  const query = useListSpacesQuery()

  const openSpace = (space: AuthSpace) => {
    const route = LOCAL_SPACE_ROUTES[space.code]

    if (!route) {
      return
    }

    navigate(route)
  }

  return {
    spaces: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    openSpace,
  }
}
