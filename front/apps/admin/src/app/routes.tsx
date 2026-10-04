import { lazy, Suspense, type ComponentType } from "react"
import { BackofficeLayout } from "./backoffice-layout"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { createBrowserRouter, Navigate, Outlet } from "react-router"
import { useGetProfileQuery } from "@/modules/auth/core/application/rtk-api/auth"
import { PortalLoginStart, PortalLoginCallback } from "@/modules/auth/ui/pages/portal-login"
import { SiteLoginRedirect } from "@/modules/auth/ui/pages/site-login-redirect"

const AuditJournalPage = lazy(() => import("@/modules/audit/ui/pages/audit-journal").then((module) => ({ default: module.AuditJournalPage })))
const UnusualActivityPage = lazy(() => import("@/modules/security/ui/pages/unusual-activity").then((module) => ({ default: module.UnusualActivityPage })))
const BackupsPage = lazy(() => import("@/modules/security/ui/pages/backups").then((module) => ({ default: module.BackupsPage })))
const LoginSecurityPage = lazy(() => import("@/modules/security/ui/pages/login-security").then((module) => ({ default: module.LoginSecurityPage })))
const CitizenAccountsPage = lazy(() => import("@/modules/citizen-accounts/ui/pages/citizen-accounts").then((module) => ({ default: module.CitizenAccountsPage })))
const NewcomerReceptionPage = lazy(() => import("@/modules/citizen-accounts/ui/pages/newcomer-reception").then((module) => ({ default: module.NewcomerReceptionPage })))
const SpacesPage = lazy(() => import("@/modules/auth/ui/pages/spaces").then((module) => ({ default: module.SpacesPage })))
const MembersPage = lazy(() => import("@/modules/admin/ui/pages/members").then((module) => ({ default: module.MembersPage })))
const AdminDashboardPage = lazy(() => import("@/modules/admin/ui/pages/dashboard").then((module) => ({ default: module.AdminDashboardPage })))
const RolesPage = lazy(() => import("@/modules/admin/ui/pages/roles").then((module) => ({ default: module.RolesPage })))
const WebcupFeedPage = lazy(() => import("@/modules/pilotage/ui/pages/webcup-feed").then((module) => ({ default: module.WebcupFeedPage })))
const ActivityDashboardPage = lazy(() => import("@/modules/pilotage/ui/pages/activity-dashboard").then((module) => ({ default: module.ActivityDashboardPage })))
const DataExportsPage = lazy(() => import("@/modules/pilotage/ui/pages/data-exports").then((module) => ({ default: module.DataExportsPage })))
const RequestQueuePage = lazy(() => import("@/modules/requests/ui/pages/request-queue").then((module) => ({ default: module.RequestQueuePage })))
const AppointmentsPage = lazy(() => import("@/modules/requests/ui/pages/appointments").then((module) => ({ default: module.AppointmentsPage })))
const ConcernsPage = lazy(() => import("@/modules/requests/ui/pages/concerns").then((module) => ({ default: module.ConcernsPage })))
const PublicationsPage = lazy(() => import("@/modules/content/ui/pages/publications").then((module) => ({ default: module.PublicationsPage })))
const AlertsPage = lazy(() => import("@/modules/content/ui/pages/alerts").then((module) => ({ default: module.AlertsPage })))
const ServicesPage = lazy(() => import("@/modules/content/ui/pages/services").then((module) => ({ default: module.ServicesPage })))
const ParticipationProjectsPage = lazy(() => import("@/modules/participation/ui/pages/projects").then((module) => ({ default: module.ParticipationProjectsPage })))
const ParticipationConsultationsPage = lazy(() => import("@/modules/participation/ui/pages/consultations").then((module) => ({ default: module.ParticipationConsultationsPage })))
const ServiceReviewsPage = lazy(() => import("@/modules/participation/ui/pages/service-reviews").then((module) => ({ default: module.ServiceReviewsPage })))
const ParticipationIdeasPage = lazy(() => import("@/modules/participation/ui/pages/ideas").then((module) => ({ default: module.ParticipationIdeasPage })))

/**
 * L17 (F58/F61) : chaque page est un morceau chargé à la première visite de sa route ;
 * l’enveloppe, la connexion et les gardes restent dans le paquet principal.
 */
function page(Page: ComponentType) {
  return (
    <Suspense fallback={<p role="status" className="p-6 text-sm text-muted-foreground">Chargement de la page…</p>}>
      <Page />
    </Suspense>
  )
}


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

  return <BackofficeLayout />
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/espaces" replace /> },
  { path: "/auth/start", element: <PortalLoginStart /> },
  { path: "/auth/callback", element: <PortalLoginCallback /> },
  { path: "/login", element: <SiteLoginRedirect /> },
  {
    element: <ProtectedRoutes />,
    children: [
      { path: "/espaces", element: page(SpacesPage) },
      {
        path: "/admin",
        element: <Outlet />,
        children: [
          { index: true, element: page(AdminDashboardPage) },
          { path: "role", element: page(RolesPage) },
          { path: "member", element: page(MembersPage) },
          { path: "citizens", element: page(CitizenAccountsPage) },
          { path: "security", element: page(LoginSecurityPage) },
          { path: "journal", element: page(AuditJournalPage) },
          { path: "activite-inhabituelle", element: page(UnusualActivityPage) },
          { path: "sauvegardes", element: page(BackupsPage) },
        ],
      },
      {
        path: "/contenus",
        element: <Outlet />,
        children: [
          { index: true, element: page(PublicationsPage) },
          { path: "alertes", element: page(AlertsPage) },
          { path: "services", element: page(ServicesPage) },
        ],
      },
      {
        path: "/pilotage",
        element: <Outlet />,
        children: [
          { index: true, element: page(WebcupFeedPage) },
          { path: "tableau-de-bord", element: page(ActivityDashboardPage) },
          { path: "exports", element: page(DataExportsPage) },
        ],
      },
      {
        path: "/demandes",
        element: <Outlet />,
        children: [
          { index: true, element: page(RequestQueuePage) },
          { path: "rendez-vous", element: page(AppointmentsPage) },
          { path: "inquietudes", element: page(ConcernsPage) },
          { path: "accueil", element: page(NewcomerReceptionPage) },
        ],
      },
      {
        path: "/participation",
        element: <Outlet />,
        children: [
          { index: true, element: page(ParticipationProjectsPage) },
          { path: "consultations", element: page(ParticipationConsultationsPage) },
          { path: "idees", element: page(ParticipationIdeasPage) },
          { path: "avis", element: page(ServiceReviewsPage) },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/espaces" replace /> },
])
