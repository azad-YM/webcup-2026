"use client"
import { useEffect, type ReactNode } from "react"
import Link from "next/link"
import type { Route } from "next"
import { LogIn, ShieldAlert } from "@boilerplate/shared-ui/components/icon"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { useGetMyProfileQuery } from "../../core/application/rtk-api/citizen"
import { CitizenErrorCode } from "../../core/application/ports/gateway/citizen.gateway"

/**
 * Garde de l’espace citoyen : une session, puis un profil citoyen
 * (`GET /api/citizen/me`). Un 401 ferme la session ; une panne réseau non.
 */
export function useCitizenAccess() {
  const { ready, hasToken, logout } = useSession()
  const query = useGetMyProfileQuery(undefined, { skip: !ready || !hasToken })
  const error = toQueryError(query.error)
  const unauthorized = error?.status === 401
  useEffect(() => {
    if (unauthorized) logout()
  }, [unauthorized, logout])
  const profile = ready && hasToken && !query.error ? query.data ?? null : null
  return { ready, hasToken, query, error, unauthorized, profile }
}

type Access = ReturnType<typeof useCitizenAccess>

/** Affiche l’état de la garde tant que le profil n’est pas disponible. */
export function CitizenAccessState({ access, returnTo, nonCitizenFallback }: {
  access: Access
  returnTo: "/espace" | "/espace/profil"
  nonCitizenFallback?: ReactNode
}) {
  const { ready, hasToken, query, error } = access
  if (!ready) return <LoadingState label="Vérification de votre session…" />
  if (!hasToken)
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8" role="status">
        <LogIn className="size-8 text-teal-700" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold">Connectez-vous pour accéder à votre espace</h2>
        <p className="mt-2 text-slate-700">{access.unauthorized ? "Votre session a expiré. " : ""}Votre espace citoyen est réservé aux habitants connectés.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/connexion?retour=${returnTo}` as Route} className="rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">Se connecter</Link>
          <Link href="/inscription" className="rounded-xl border border-slate-300 px-5 py-3 font-medium hover:bg-slate-50">Créer un compte</Link>
        </div>
      </div>
    )
  if (error?.code === CitizenErrorCode.notCitizen)
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8" role="status">
          <ShieldAlert className="size-8 text-amber-800" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-slate-950">Ce compte n’est pas un compte citoyen</h2>
          <p className="mt-2 text-slate-800">
            Vous êtes connecté avec un compte qui n’a pas d’espace citoyen, par exemple un compte d’agent municipal.
            Si vous êtes membre de l’administration, ouvrez votre espace de travail ci-dessous.
          </p>
        </div>
        {nonCitizenFallback}
      </div>
    )
  if (error && !access.unauthorized)
    return <ErrorState message={error.data} onRetry={() => void query.refetch()} retrying={query.isFetching} />
  return (
    <LoadingState label="Chargement de votre espace…">
      <SkeletonCards count={3} />
    </LoadingState>
  )
}
