import { MODULES } from "@/modules/shared/ui/layout/workspace-navigation"
import { Button } from "@boilerplate/shared-ui/components"
import { useListSpaces } from "./list-spaces.hook"

export const ListSpacesSection = () => {
  const { spaces, isLoading, isError, openSpace, refetch, isFetching } = useListSpaces()

  if (isLoading) {
    return <div className="text-sm text-slate-500">Chargement des modules…</div>
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Impossible de charger les modules.
        <Button variant="outline" className="mt-3" disabled={isFetching} onClick={() => void refetch()}>Réessayer</Button>
      </div>
    )
  }

  if (!spaces.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        Aucun module disponible.
      </div>
    )
  }

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {spaces.map((space) => {
        const Icon = MODULES[space.code].icon
        return (
        <article
          key={space.code}
          className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
        >
          <div className="flex h-full flex-col items-start gap-5">
            <div className="flex-1 space-y-3">
              <span className="mb-5 inline-flex rounded-xl bg-teal-50 p-3 text-teal-700"><Icon className="size-6" aria-hidden="true" /></span>
              <h2 className="text-xl font-semibold text-slate-950">{space.name}</h2>

              <p className="text-sm leading-6 text-slate-600">{space.description}</p>

            </div>

            <Button onClick={() => openSpace(space)}>
              Ouvrir
            </Button>
          </div>
        </article>
      )})}
    </div>
  )
}
