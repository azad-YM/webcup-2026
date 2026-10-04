import { Activity, BookKey, Building2, CalendarClock, History, Inbox, LayoutDashboard, MessageCircleWarning, Newspaper, ShieldAlert, Siren, Users } from "@boilerplate/shared-ui/components/icon"
import type { NavGroup } from "../components/sidebar/nav-main"

export type ModuleCode = "admin" | "requests" | "pilotage"
export const MODULES = {
  admin: { title: "Administration", route: "/admin", icon: Building2, description: "Organisation et vie de la ville" },
  requests: { title: "Demandes citoyennes", route: "/demandes", icon: Inbox, description: "Accompagner les habitants" },
  pilotage: { title: "Pilotage", route: "/pilotage", icon: Activity, description: "Suivre l’activité de Nova Terra" },
} satisfies Record<ModuleCode, unknown>

export function moduleForPath(path: string): ModuleCode | null {
  const root = path.split("/")[1]
  if (root === "admin" || root === "contenus") return "admin"
  if (root === "demandes") return "requests"
  if (root === "pilotage") return "pilotage"
  return null
}

export const MODULE_NAVIGATION: Record<ModuleCode, NavGroup[]> = {
  admin: [
    { title: "Vue d’ensemble", items: [{ title: "Tableau de bord", url: "/admin", icon: LayoutDashboard }] },
    { title: "Configuration", items: [
      { title: "Membres", url: "/admin/member", icon: Users, description: "Agents et administrateurs" },
      { title: "Rôles", url: "/admin/role", icon: BookKey, description: "Permissions et habilitations" },
      { title: "Comptes citoyens", url: "/admin/citizens", icon: Users },
    ] },
    { title: "Contenus de la ville", items: [
      { title: "Publications", url: "/contenus", icon: Newspaper },
      { title: "Alertes", url: "/contenus/alertes", icon: Siren },
      { title: "Services et transports", url: "/contenus/services", icon: Building2 },
    ] },
    { title: "Suivi et sécurité", items: [
      { title: "Journal des actions", url: "/admin/journal", icon: History },
      { title: "Journal de sécurité", url: "/admin/security", icon: ShieldAlert },
    ] },
  ],
  requests: [{ title: "Relation citoyenne", items: [
    { title: "File des demandes", url: "/demandes", icon: Inbox, description: "Messages et signalements" },
    { title: "Rendez-vous", url: "/demandes/rendez-vous", icon: CalendarClock, description: "Créneaux et réservations" },
    { title: "Inquiétudes", url: "/demandes/inquietudes", icon: MessageCircleWarning, description: "Écouter et répondre aux habitants" },
  ] }],
  pilotage: [{ title: "Activité de la ville", items: [
    { title: "Flux Nova Terra", url: "/pilotage", icon: Activity, description: "Demandes de la ville et suivi de l’équipe" },
    { title: "Tableau de bord", url: "/pilotage/tableau-de-bord", icon: LayoutDashboard, description: "Chiffres clés et activité" },
  ] }],
}
