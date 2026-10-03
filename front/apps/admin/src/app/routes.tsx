import { AuditJournalPage } from "@/modules/audit/ui/pages/audit-journal"
import { LoginSecurityPage } from "@/modules/security/ui/pages/login-security"
import { CitizenAccountsPage } from "@/modules/citizen-accounts/ui/pages/citizen-accounts"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { createBrowserRouter, Navigate, Outlet } from "react-router"
import { useGetProfileQuery } from "@/modules/auth/core/application/rtk-api/auth"
import { PortalLoginStart, PortalLoginCallback } from "@/modules/auth/ui/pages/portal-login"
import { SiteLoginRedirect } from "@/modules/auth/ui/pages/site-login-redirect"
import { SpacesPage } from "@/modules/auth/ui/pages/spaces"
import { AdminLayout } from "@/modules/admin/ui/layouts/admin.layout"
import { MembersPage } from "@/modules/admin/ui/pages/members"
import { AdminDashboardPage } from "@/modules/admin/ui/pages/dashboard"
import { RolesPage } from "@/modules/admin/ui/pages/roles"
import { PilotageLayout } from "@/modules/pilotage/ui/layouts/pilotage.layout"
import { WebcupFeedPage } from "@/modules/pilotage/ui/pages/webcup-feed"
import { ActivityDashboardPage } from "@/modules/pilotage/ui/pages/activity-dashboard"
import { RequestsLayout } from "@/modules/requests/ui/layouts/requests.layout"
import { RequestQueuePage } from "@/modules/requests/ui/pages/request-queue"
import { ContentLayout } from "@/modules/content/ui/layouts/content.layout"
import { PublicationsPage } from "@/modules/content/ui/pages/publications"
import { AlertsPage } from "@/modules/content/ui/pages/alerts"
import { ServicesPage } from "@/modules/content/ui/pages/services"

const ProtectedRoutes = () => {
  const profile = useGetProfileQuery()

  if (profile.data === null) {
    return <SiteLoginRedirect />
  }

  if (profile.isError) {
    return <main id="contenu" className="grid min-h-screen place-items-center p-6"><div>
      <h1 className="text-xl font-semibold">Impossible de vérifier votre accès</h1>
      <p role="alert" className="mt-2">{getErrorMessage(profile.error)}</p>
      <button type="button" className="mt-4 underline" onClick={() => void profile.refetch()}>Réessayer</button>
      <a className="ml-4 underline" href={import.meta.env.VITE_SITE_URL || "http://localhost:5178"}>Revenir au site</a>
    </div></main>
  }

  if (profile.isLoading) {
    return <main id="contenu" className="grid min-h-screen place-items-center"><p role="status">Vérification de votre accès…</p></main>
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
          { path: "member", element: <MembersPage /> },
          { path: "citizens", element: <CitizenAccountsPage /> },
          { path: "security", element: <LoginSecurityPage /> },
          { path: "journal", element: <AuditJournalPage /> },
        ],
      },
      {
        path: "/contenus",
        element: <ContentLayout />,
        children: [
          { index: true, element: <PublicationsPage /> },
          { path: "alertes", element: <AlertsPage /> },
          { path: "services", element: <ServicesPage /> },
        ],
      },
      {
        path: "/pilotage",
        element: <PilotageLayout />,
        children: [
          { index: true, element: <WebcupFeedPage /> },
          { path: "tableau-de-bord", element: <ActivityDashboardPage /> },
        ],
      },
      {
        path: "/demandes",
        element: <RequestsLayout />,
        children: [
          { index: true, element: <RequestQueuePage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/espaces" replace /> },
])
