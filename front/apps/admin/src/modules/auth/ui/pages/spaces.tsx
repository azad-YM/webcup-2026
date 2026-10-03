import { ListSpacesSection } from "@/modules/auth/ui/sections/spaces/list-spaces"
import { useLogoutMutation } from "@/modules/auth/core/application/rtk-api/auth"
import { Button } from "@boilerplate/shared-ui/components"
import { Link, useNavigate } from "react-router"

export const SpacesPage = () => {
  const navigate = useNavigate()
  const [logout, { isLoading }] = useLogoutMutation()

  const handleLogout = async () => {
    await logout().unwrap()
    navigate("/login", { replace: true })
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Boilerplate
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Espaces disponibles
            </h1>
            <p className="text-sm text-slate-600">
              Choisis l'espace que tu veux ouvrir.
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
            {isLoading ? "Déconnexion..." : "Se déconnecter"}
          </Button>
        </header>

        <ListSpacesSection />
        <Link to="/contenus" className="rounded-xl border bg-white p-6 font-semibold">Services, transports, publications et alertes →</Link>
      </div>
    </main>
  )
}
