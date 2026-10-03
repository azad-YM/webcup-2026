import { ListSpacesSection } from "@/modules/auth/ui/sections/spaces/list-spaces"
import { useLogoutMutation } from "@/modules/auth/core/application/rtk-api/auth"
import { Button } from "@boilerplate/shared-ui/components"
import { DisplayPreferencesButton } from "@boilerplate/shared-ui/components/a11y"
import { useNavigate } from "react-router"

export const SpacesPage = () => {
  const navigate = useNavigate()
  const [logout, { isLoading }] = useLogoutMutation()

  const handleLogout = async () => {
    await logout().unwrap()
    navigate("/login", { replace: true })
  }

  return (
    <main id="contenu" tabIndex={-1} className="min-h-screen bg-slate-50 px-4 py-10 outline-none sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Nova Terra — administration
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Espaces disponibles
            </h1>
            <p className="text-sm text-slate-600">
              Choisissez l’espace de travail à ouvrir.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <DisplayPreferencesButton />
          <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
            {isLoading ? "Déconnexion…" : "Se déconnecter"}
          </Button>
          </div>
        </header>

        <ListSpacesSection />
      </div>
    </main>
  )
}
