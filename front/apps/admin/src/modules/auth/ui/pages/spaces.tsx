import { ListSpacesSection } from "@/modules/auth/ui/sections/spaces/list-spaces"

export const SpacesPage = () => (
  <div className="mx-auto w-full max-w-6xl space-y-8">
    <header className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-sm font-medium text-teal-800">Nova Terra · Espace administration</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Bienvenue dans votre espace de travail</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Choisissez un module pour gérer la ville, accompagner les habitants ou suivre l’activité.</p>
    </header>
    <section aria-label="Modules disponibles"><ListSpacesSection /></section>
  </div>
)
