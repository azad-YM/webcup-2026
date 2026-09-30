import { ShieldCheck, UserRound, type LucideIcon } from "@boilerplate/shared-ui/components/icon"

export type AdminEntity = {
  code: "role" | "member"
  title: string
  shortLabel: string
  description: string
  icon: LucideIcon
}

export const adminEntities: AdminEntity[] = [
  {
    code: "role",
    title: "Rôles",
    shortLabel: "Rôle",
    description: "Configurer les rôles et les permissions des utilisateurs.",
    icon: ShieldCheck,
  },
  {
    code: "member",
    title: "Membres",
    shortLabel: "Membre",
    description: "Ajouter les membres de l’administration et leur attribuer des rôles (à venir).",
    icon: UserRound,
  },
]

export const findAdminEntity = (entityCode?: string) =>
  adminEntities.find((entity) => entity.code === entityCode)
