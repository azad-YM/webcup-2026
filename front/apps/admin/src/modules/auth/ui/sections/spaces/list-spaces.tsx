import { Button } from "@boilerplate/shared-ui/components"
import { useListSpaces } from "./list-spaces.hook"

export const ListSpacesSection = () => {
  const { spaces, isLoading, isError, openSpace } = useListSpaces()

  if (isLoading) {
    return <div className="text-sm text-slate-500">Chargement des espaces...</div>
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Impossible de charger les espaces.
      </div>
    )
  }

  if (!spaces.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        Aucun espace disponible.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {spaces.map((space) => (
        <article
          key={space.code}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-950">{space.name}</h2>

              <p className="text-sm leading-6 text-slate-600">{space.description}</p>

            </div>

            <Button onClick={() => openSpace(space)}>
              Ouvrir
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}
