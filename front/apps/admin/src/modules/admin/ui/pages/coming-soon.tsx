import { ArrowLeft, Wrench } from "lucide-react"
import { Link, useLocation } from "react-router"
import { Button } from "@boilerplate/shared-ui/components"
import { findAdminEntity } from "@/modules/admin/ui/data/entities"

export function AdminComingSoonPage() {
  const entity = useLocation().pathname.split("/").at(-1)
  const definition = findAdminEntity(entity)

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
      <div className="w-full rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
          <Wrench className="size-6" />
        </div>
        <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Configuration à venir</p>
        <h1 className="mt-2 text-3xl font-semibold">{definition?.title ?? "Entité"}</h1>
        <p className="mt-3 leading-7 text-muted-foreground">{definition?.description ?? "Cette configuration sera disponible dans un prochain jalon."}</p>
        <Button className="mt-7" variant="outline" asChild>
          <Link to="/admin"><ArrowLeft /> Retour au tableau de bord</Link>
        </Button>
      </div>
    </section>
  )
}
