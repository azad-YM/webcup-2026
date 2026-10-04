import type { ReactNode } from "react"
import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb"

/** En-tête de page : fil d’Ariane, titre unique (h1) et introduction. */
export function PageHeader({ trail, title, lead, children }: {
  trail: BreadcrumbItem[]
  title: string
  lead?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Breadcrumb trail={trail} />
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        {lead && <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">{lead}</p>}
        {children}
      </div>
    </div>
  )
}

export function PageBody({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto px-4 py-10 sm:px-6 lg:px-8 ${narrow ? "max-w-3xl" : "max-w-7xl"}`}>{children}</div>
}
