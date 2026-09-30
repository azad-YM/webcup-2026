"use client"
import { useSession } from "@/modules/shared/ui/store-provider"
export function LogoutButton() {
  const { logout } = useSession()
  return (
    <button
      onClick={logout}
      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium"
    >
      Se déconnecter
    </button>
  )
}
