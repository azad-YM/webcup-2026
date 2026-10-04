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
    description: "Consulter les membres de l’administration, en ajouter et leur attribuer des rôles.",
    icon: UserRound,
  },
]
