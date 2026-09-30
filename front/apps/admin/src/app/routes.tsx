import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { createBrowserRouter, Navigate, Outlet } from "react-router"
import { useGetProfileQuery } from "@/modules/auth/core/application/rtk-api/auth"
import { PortalLoginStart, PortalLoginCallback } from "@/modules/auth/ui/pages/portal-login"
import { SiteLoginRedirect } from "@/modules/auth/ui/pages/site-login-redirect"
import { SpacesPage } from "@/modules/auth/ui/pages/spaces"
import { AdminLayout } from "@/modules/admin/ui/layouts/admin.layout"
import { AdminComingSoonPage } from "@/modules/admin/ui/pages/coming-soon"
import { AdminDashboardPage } from "@/modules/admin/ui/pages/dashboard"
import { RolesPage } from "@/modules/admin/ui/pages/roles"
import { ExampleLayout } from "@/modules/example/ui/layouts/example.layout"
import { ItemsPage } from "@/modules/example/ui/pages/items"

const ProtectedRoutes = () => {
  const profile = useGetProfileQuery()

  if (profile.data === null) {
    return <SiteLoginRedirect />
  }

  if (profile.isError) {
    return <main className="grid min-h-screen place-items-center p-6"><div>
      <p role="alert">{getErrorMessage(profile.error)}</p>
      <button className="mt-4 underline" onClick={() => void profile.refetch()}>Réessayer</button>
      <a className="ml-4 underline" href={import.meta.env.VITE_SITE_URL || "http://localhost:5178"}>Revenir au site</a>
    </div></main>
  }

  if (profile.isLoading) {
    return <main className="grid min-h-screen place-items-center">Chargement...</main>
  }

  return <Outlet />
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/espaces" replace /> },
  { path: "/auth/start", element: <PortalLoginStart /> },
  { path: "/auth/callback", element: <PortalLoginCallback /> },
  { path: "/login", element: <SiteLoginRedirect /> },
  {
    element: <ProtectedRoutes />,
    children: [
      { path: "/espaces", element: <SpacesPage /> },
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "role", element: <RolesPage /> },
          { path: "member", element: <AdminComingSoonPage /> },
        ],
      },
      {
        path: "/example",
        element: <ExampleLayout />,
        children: [
          { index: true, element: <Navigate to="/example/items" replace /> },
          { path: "items", element: <ItemsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/espaces" replace /> },
])
