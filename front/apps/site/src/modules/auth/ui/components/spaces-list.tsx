"use client"
import { useEffect } from "react"
import {
  ArrowRight,
  Building2
} from "@boilerplate/shared-ui/components/icon"
import { siteEnv } from "@/config/env"
import { useListSpacesQuery } from "../../core/application/rtk-api/auth"
import { useSession } from "@/modules/shared/ui/store-provider"

const portals = [
  {
    code: "admin",
    title: "Administration",
    description:
      "Gérez les comptes, les rôles et les modules de l’application.",
    href: siteEnv.adminUrl,
    action: "Ouvrir l’administration",
    icon: Building2,
    accent: "bg-slate-200 text-slate-800"
  }
]

export function SpacesList() {
  const { ready, hasToken, logout } = useSession()
  const { data, error, refetch } = useListSpacesQuery(undefined, {
    skip: !ready || !hasToken,
    refetchOnMountOrArgChange: true,
    pollingInterval: 60_000
  })
  const unauthorized = error && "status" in error && error.status === 401
  useEffect(() => {
    if (unauthorized) logout()
  }, [unauthorized, logout])
  if (unauthorized)
    return (
      <p role="status" className="mt-10">
        Votre session a expiré. Redirection…
      </p>
    )
  if (ready && !hasToken)
    return (
      <p role="status" className="mt-10 rounded-2xl bg-slate-50 p-6">
        <a href="/login" className="font-medium text-emerald-800 underline">
          Connectez-vous
        </a>
        {" pour afficher les espaces accessibles à votre compte."}
      </p>
    )
  if (error)
    return (
      <div
        role="alert"
        className="mt-10 rounded-2xl bg-red-50 p-6 text-red-800"
      >
        <p>Impossible de charger vos espaces.</p>
        <button
          onClick={() => void refetch()}
          className="mt-4 rounded-lg border px-4 py-2"
        >
          Réessayer
        </button>
      </div>
    )
  if (!data)
    return (
      <div
        role="status"
        aria-label="Chargement des espaces"
        className="mt-10 grid gap-5 lg:grid-cols-3"
      >
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            aria-hidden="true"
            className="min-h-72 rounded-3xl bg-slate-50 p-7 motion-safe:animate-pulse"
          >
            <div className="size-12 rounded-2xl bg-slate-200" />
            <div className="mt-7 h-7 w-2/3 rounded bg-slate-200" />
            <div className="mt-5 h-4 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-4/5 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    )
  const availablePortals = portals.filter((portal) =>
    data.some((space) => space.code === portal.code)
  )
  if (availablePortals.length === 0)
    return (
      <p role="status" className="mt-10 rounded-2xl bg-slate-50 p-6">
        Aucun espace disponible pour votre compte.
      </p>
    )
  return (
    <div className="mt-10 grid gap-5 lg:grid-cols-3">
      {availablePortals.map((portal) => (
        <a
          key={portal.title}
          href={portal.code === "admin" ? `${portal.href}/auth/start` : portal.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-h-72 flex-col rounded-3xl bg-slate-50 p-7 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl"
        >
          <span
            className={`flex size-12 items-center justify-center rounded-2xl ${portal.accent}`}
          >
            <portal.icon className="size-6" />
          </span>
          <h3 className="mt-7 text-2xl font-semibold">{data.find(space => space.code === portal.code)?.name ?? portal.title}</h3>
          <p className="mt-3 flex-1 leading-7 text-slate-600">
            {data.find(space => space.code === portal.code)?.description ?? portal.description}
          </p>
          <p className="mt-3 text-sm text-slate-600">{data.find(space => space.code === portal.code)?.roles.join(" · ")}</p>
          <span className="mt-8 inline-flex items-center gap-2 font-medium text-slate-950">
            {portal.action}
            <span className="sr-only"> (nouvel onglet)</span>
            <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </span>
        </a>
      ))}
    </div>
  )
}
