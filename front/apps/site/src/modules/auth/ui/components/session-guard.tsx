"use client"
import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/modules/shared/ui/store-provider"
export function SessionGuard({ children }: { children: ReactNode }) {
  const { ready, hasToken } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (ready && !hasToken) router.replace("/connexion")
  }, [ready, hasToken, router])
  if (!ready || !hasToken)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16" role="status">
        <p>Vérification de votre session…</p>
      </div>
    )
  return children
}
