import { useState } from "react"
import { useNavigate } from "react-router"
import { Building2, Check, ExternalLink, LogOut, UserRound } from "@boilerplate/shared-ui/components/icon"
import { Popover, PopoverContent, PopoverTrigger, Skeleton } from "@boilerplate/shared-ui/components"
import { useGetProfileQuery, useHasCitizenWorkspaceQuery, useLogoutMutation } from "../../core/application/rtk-api/auth"

export function AccountMenu() {
  const [open, setOpen] = useState(false)
  const { data: profile } = useGetProfileQuery()
  const citizen = useHasCitizenWorkspaceQuery(undefined, { skip: !open, refetchOnMountOrArgChange: true })
  const [logout, loggingOut] = useLogoutMutation()
  const navigate = useNavigate()
  const name = profile?.name || "Mon compte"
  const initials = name.split(" ").filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase()
  const siteUrl = (import.meta.env.VITE_SITE_URL || "http://localhost:5178").replace(/\/$/, "")
  const handleLogout = async () => {
    try { await logout().unwrap(); navigate("/login", { replace: true }) } catch { /* Erreur affichée dans le menu. */ }
  }
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><button type="button" aria-label={`Mon compte et mes espaces : ${name}`} className="flex size-11 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-sm font-semibold text-teal-900 hover:bg-teal-100">{initials}</button></PopoverTrigger>
    <PopoverContent side="right" align="end" sideOffset={12} aria-label="Mon compte et mes espaces" className="max-h-[80dvh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-slate-950">
      <div className="px-3 py-2"><p className="font-semibold">{name}</p><p className="break-all text-sm text-slate-600">{profile?.email}</p></div>
      <section className="my-2 border-y border-slate-200 py-3" aria-label="Espaces disponibles">
        <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Mes espaces</h2>
        <div className="flex items-center gap-3 rounded-xl bg-teal-50 px-3 py-3 text-teal-900"><Building2 className="size-5" aria-hidden="true" /><span className="flex-1 text-sm font-medium">Administration<span className="block text-xs font-normal">Espace actuel</span></span><Check className="size-4" aria-hidden="true" /></div>
        {citizen.isFetching ? <div role="status" aria-live="polite" className="mt-1 px-3 py-3">
          <span className="sr-only">Chargement des autres espaces…</span>
          <div aria-hidden="true" className="flex items-center gap-3">
            <Skeleton className="size-5 shrink-0 rounded-md bg-slate-100" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28 bg-slate-100" />
              <Skeleton className="h-3 w-40 max-w-full bg-slate-100" />
            </div>
          </div>
        </div> : citizen.isError ? <div className="px-3 py-2 text-sm"><p role="alert">Impossible de vérifier votre espace citoyen.</p><button className="mt-1 font-medium text-teal-800 underline" onClick={() => void citizen.refetch()}>Réessayer</button></div> : citizen.data === true ? <a href={`${siteUrl}/espace/`} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-slate-700 hover:bg-slate-50"><UserRound className="size-5" aria-hidden="true" /><span className="flex-1 text-sm font-medium">Espace citoyen<span className="block text-xs font-normal text-slate-600">Mes démarches et mon profil</span></span><ExternalLink className="size-4" aria-hidden="true" /></a> : null}
      </section>
      {loggingOut.isError && <p role="alert" className="px-3 text-sm text-red-800">La déconnexion a échoué. Réessayez.</p>}
      <button type="button" disabled={loggingOut.isLoading} onClick={() => void handleLogout()} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"><LogOut className="size-4" aria-hidden="true" />{loggingOut.isLoading ? "Déconnexion…" : "Se déconnecter"}</button>
    </PopoverContent>
  </Popover>
}
