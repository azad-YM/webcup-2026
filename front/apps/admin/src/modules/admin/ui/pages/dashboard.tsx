import { ArrowUpRight, BookKey } from "@boilerplate/shared-ui/components/icon"
import { Link } from "react-router"
import { adminEntities } from "../data/entities"

export function AdminDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="bg-brand-gradient overflow-hidden rounded-3xl p-7 text-white shadow-xl sm:p-10">
        <div className="mb-5 inline-flex rounded-2xl bg-white/10 p-3">
          <BookKey className="size-6" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-300">Administration</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Administrer l’application
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-300">
          Retrouvez les rôles, les membres et le catalogue des permissions dans une navigation commune.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {adminEntities.map((entity) => (
          <Link
            key={entity.code}
            to={`/admin/${entity.code}`}
            className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
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
