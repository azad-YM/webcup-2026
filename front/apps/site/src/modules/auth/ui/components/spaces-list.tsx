"use client"
import { useEffect } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Building2
} from "@boilerplate/shared-ui/components/icon"
import { siteEnv } from "@/config/env"
import { useListSpacesQuery } from "../../core/application/rtk-api/auth"
import { useSession } from "@/modules/shared/ui/store-provider"
import { ErrorState, LoadingState } from "@/modules/shared/ui/components/states"

const portals = [
  {
    code: "admin",
    title: "Administration",
    description:
      "Traitez les demandes des habitants et gérez les membres et leurs rôles.",
    href: siteEnv.adminUrl,
    action: "Ouvrir l’administration",
    icon: Building2,
    accent: "bg-slate-900 text-white"
  }
]

/**
 * Espaces IAM accessibles au compte connecté (`/api/iam/me/spaces`).
 * - `full` : tous les états, y compris « aucun espace disponible ».
 * - `compact` : n’affiche rien tant qu’il n’y a pas d’espace (cas courant d’un citoyen).
 */
export function SpacesList({ variant = "full" }: { variant?: "full" | "compact" }) {
  const { ready, hasToken, logout } = useSession()
  const { data, error, refetch, isFetching } = useListSpacesQuery(undefined, {
    skip: !ready || !hasToken,
    refetchOnMountOrArgChange: true,
    pollingInterval: 60_000
  })
  const unauthorized = error && "status" in error && error.status === 401
  const compact = variant === "compact"
  useEffect(() => {
    if (unauthorized) logout()
  }, [unauthorized, logout])
  if (unauthorized)
    return compact ? null : (
      <p role="status" className="mt-6">
        Votre session a expiré. Reconnectez-vous.
      </p>
    )
  if (ready && !hasToken)
    return compact ? null : (
      <p role="status" className="mt-6 rounded-2xl bg-slate-50 p-6">
        <Link href="/connexion" className="font-medium text-teal-800 underline">
          Connectez-vous
        </Link>
        {" pour afficher les espaces accessibles à votre compte."}
      </p>
    )
  if (error)
    return (
      <div className="mt-6">
        <ErrorState message="Impossible de charger vos espaces de travail." onRetry={() => void refetch()} retrying={isFetching} />
      </div>
    )
  if (!data)
    return compact ? null : (
      <div className="mt-6">
        <LoadingState label="Chargement des espaces">
          <div className="grid gap-5 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="min-h-56 rounded-3xl bg-slate-100 p-7 motion-safe:animate-pulse">
                <div className="size-12 rounded-2xl bg-slate-200" />
                <div className="mt-7 h-7 w-2/3 rounded bg-slate-200" />
                <div className="mt-5 h-4 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </LoadingState>
      </div>
    )
  const availablePortals = portals.filter((portal) =>
    data.some((space) => space.code === portal.code)
  )
  if (availablePortals.length === 0)
    return compact ? null : (
      <p role="status" className="mt-6 rounded-2xl bg-slate-50 p-6">
        Aucun espace de travail disponible pour votre compte.
      </p>
    )
  return (
    <section aria-labelledby="titre-espaces" className={compact ? "" : "mt-6"}>
      <h2 id="titre-espaces" className="text-2xl font-semibold tracking-tight">Vos espaces de travail</h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {availablePortals.map((portal) => {
          const space = data.find((item) => item.code === portal.code)
          return (
            <a
              key={portal.title}
              href={portal.code === "admin" ? `${portal.href}/auth/start` : portal.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-56 flex-col rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <span className={`flex size-12 items-center justify-center rounded-2xl ${portal.accent}`}>
                <portal.icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-2xl font-semibold">{space?.name ?? portal.title}</h3>
              <p className="mt-3 flex-1 leading-7 text-slate-700">{space?.description ?? portal.description}</p>
              <p className="mt-3 text-sm text-slate-700">{space?.roles.join(" · ")}</p>
              <span className="mt-6 inline-flex items-center gap-2 font-medium text-slate-950">
                {portal.action}
                <span className="sr-only"> (nouvel onglet)</span>
                <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </a>
          )
        })}
      </div>
    </section>
  )
}
