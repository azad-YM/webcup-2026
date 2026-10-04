import type { Metadata } from "next"
import { AccountSecurityPage } from "@/modules/auth/ui/pages/account-security"

export const metadata: Metadata = { title: "Sécurité du compte" }

/** F53, F54 : page du module auth (IAM) rangée dans l’espace citoyen. */
export default AccountSecurityPage
