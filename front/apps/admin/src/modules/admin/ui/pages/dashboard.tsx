import { ArrowUpRight, BookKey } from "@boilerplate/shared-ui/components/icon"
import { Link } from "react-router"
import { adminEntities } from "../data/entities"

export function AdminDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="mb-5 inline-flex rounded-xl bg-teal-50 p-3 text-teal-700">
          <BookKey className="size-6" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-600">Administration</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Administrer l’application
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Retrouvez les rôles, les membres et le catalogue des permissions dans une navigation commune.
        </p>
      </section>

      <Link
        to="/pilotage/tableau-de-bord"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600 hover:shadow-md"
      >
        <span>
          <span className="block text-lg font-semibold">Tableau de bord de l’activité</span>
          <span className="mt-1 block text-sm text-muted-foreground">Demandes en attente, citoyens inscrits, alertes en cours, comptes suspendus, connexions bloquées.</span>
        </span>
        <ArrowUpRight className="size-5 shrink-0 text-slate-400 transition group-hover:text-slate-900" />
      </Link>

      <section className="grid gap-4 md:grid-cols-2">
        {adminEntities.map((entity) => (
          <Link
            key={entity.code}
            to={`/admin/${entity.code}`}
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                <entity.icon className="size-5" />
              </span>
              <ArrowUpRight className="size-5 text-slate-400 transition group-hover:text-slate-900" />
            </div>
            <h2 className="mt-5 text-lg font-semibold">{entity.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{entity.description}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
