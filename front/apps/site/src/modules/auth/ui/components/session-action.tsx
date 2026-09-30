"use client"
import Link from "next/link"
import { useSession } from "@/modules/shared/ui/store-provider"

export function SessionAction() {
  const { ready, hasToken, logout } = useSession()

  if (!ready || !hasToken)
    return (
      <Link
        href="/login"
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium"
      >
        Se connecter
      </Link>
    )

  return (
    <button
      onClick={logout}
      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium"
    >
      Se déconnecter
    </button>
  )
}