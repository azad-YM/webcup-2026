"use client"
import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/modules/shared/ui/store-provider"
export function SessionGuard({ children }: { children: ReactNode }) {
  const { ready, hasToken } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (ready && !hasToken) router.replace("/login")
  }, [ready, hasToken, router])
  if (!ready || !hasToken)
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-slate-50"
        role="status"
      >
        <p>Vérification de votre session…</p>
      </main>
    )
  return children
}
