import Link from "next/link"
import type { Route } from "next"
import {
  ArrowRight,
  Building2,
  Bus,
  Droplets,
  FileText,
  GraduationCap,
  HeartPulse,
  House,
  Lightbulb,
  Recycle,
  type LucideIcon
} from "@boilerplate/shared-ui/components/icon"
import { SERVICE_CATEGORIES, type MunicipalService } from "../../core/domain/municipal-service"
import { formatPublicationDate, type Publication } from "../../core/domain/publication"

const SERVICE_ICONS: Record<string, LucideIcon> = {
  "etat-civil": FileText,
  sante: HeartPulse,
  "voirie-eclairage": Lightbulb,
  transports: Bus,
  "eau-energie": Droplets,
  logement: House,
  education: GraduationCap,
  "proprete-recyclage": Recycle
}

export const serviceIcon = (id: string) => SERVICE_ICONS[id] ?? Building2
export const serviceHref = (id: string) => `/services?service=${encodeURIComponent(id)}` as Route
export const publicationHref = (id: string) => `/actualites?article=${encodeURIComponent(id)}` as Route

export function ServiceCard({ service, headingLevel = 3 }: { service: MunicipalService; headingLevel?: 2 | 3 }) {
  const Icon = serviceIcon(service.id)
  const Heading = headingLevel === 2 ? "h2" : "h3"
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600 hover:shadow-md">
      <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-medium text-slate-600">{SERVICE_CATEGORIES[service.category]}</p>
      <Heading className="mt-1 text-lg font-semibold text-slate-950">
        {/* Le lien couvre toute la carte ; son nom accessible reste le titre du service. */}
        <Link href={serviceHref(service.id)} className="after:absolute after:inset-0 after:rounded-2xl">
          {service.name}
        </Link>
      </Heading>
      <p className="mt-2 flex-1 text-slate-700">{service.summary}</p>
        {service.status && service.status !== "operational" && <p className="mt-2 font-semibold text-amber-800">{service.status === "maintenance" ? "En maintenance" : "Service interrompu"}</p>}
      <span className="mt-4 inline-flex items-center gap-2 font-medium text-teal-800" aria-hidden="true">
        Voir le service <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </span>
    </article>
  )
}

export function PublicationCard({ publication, headingLevel = 3 }: { publication: Publication; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3"
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-600 hover:shadow-md">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="rounded-full bg-amber-100 px-3 py-0.5 font-medium text-amber-900">{publication.category}</span>
        <time dateTime={publication.publishedAt} className="text-slate-600">{formatPublicationDate(publication.publishedAt)}</time>
      </p>
      <Heading className="mt-3 text-lg font-semibold text-slate-950">
        <Link href={publicationHref(publication.id)} className="after:absolute after:inset-0 after:rounded-2xl">
          {publication.title}
        </Link>
      </Heading>
      <p className="mt-2 flex-1 text-slate-700">{publication.summary}</p>
      <span className="mt-4 inline-flex items-center gap-2 font-medium text-teal-800" aria-hidden="true">
        Lire l’article <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </span>
    </article>
  )
}
