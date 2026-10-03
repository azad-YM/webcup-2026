"use client"
import Link from "next/link"
import type { Route } from "next"
import { ArrowRight, LogIn, Newspaper, Search, UserPlus, UserRound } from "@boilerplate/shared-ui/components/icon"
import { useSession } from "@/modules/shared/ui/store-provider"
import { FeaturedServices, LatestPublications } from "../sections/content-lists"

function Tasks() {
  const { ready, hasToken } = useSession()
  const connected = ready && hasToken
  const tasks: { title: string; text: string; href: Route; icon: typeof Search }[] = [
    { title: "Trouver un service", text: "État civil, santé, transports, logement…", href: "/services", icon: Search },
    { title: "Lire les actualités", text: "Travaux, santé, vie municipale.", href: "/actualites", icon: Newspaper },
    connected
      ? { title: "Accéder à mon espace", text: "Mon profil et mes demandes.", href: "/espace", icon: UserRound }
      : { title: "Créer mon compte", text: "Devenez citoyen en ligne en une minute.", href: "/inscription", icon: UserPlus },
    connected
      ? { title: "Compléter mon profil", text: "Nom, quartier, langue préférée.", href: "/espace/profil", icon: UserRound }
      : { title: "Me connecter", text: "Retrouver mon espace citoyen.", href: "/connexion", icon: LogIn }
  ]
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tasks.map((task) => (
        <li key={task.title}>
          <Link href={task.href} className="flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-600 hover:shadow-md">
            <task.icon className="mt-0.5 size-6 shrink-0 text-teal-700" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-slate-950">{task.title}</span>
              <span className="mt-1 block text-sm text-slate-700">{task.text}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function AccountCallToAction() {
  const { ready, hasToken } = useSession()
  if (!ready) return null
  return (
    <section aria-labelledby="titre-compte" className="bg-teal-800 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="max-w-2xl">
          <h2 id="titre-compte" className="text-3xl font-semibold tracking-tight">
            {hasToken ? "Votre espace citoyen vous attend" : "Votre ville, dans votre poche"}
          </h2>
          <p className="mt-3 text-lg text-teal-50">
            {hasToken
              ? "Retrouvez votre profil, contactez la mairie et suivez toutes vos demandes."
              : "Créez votre compte citoyen pour suivre vos demandes, être informé de ce qui concerne votre quartier et contacter la mairie."}
          </p>
        </div>
        <Link href={hasToken ? "/espace" : "/inscription"} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-teal-900 hover:bg-teal-50">
          {hasToken ? "Accéder à mon espace" : "Créer mon compte citoyen"} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

/** Accueil (D07) : où l’on est, ce qu’on peut faire, les services principaux et les actualités. */
export function HomePage() {
  return (
    <>
      <section aria-labelledby="titre-accueil" className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-gradient-to-br from-teal-400 to-teal-900 opacity-40" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-40 h-6 w-[40rem] -rotate-12 rounded-full border-2 border-amber-300/60" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Portail officiel de la ville</p>
          <h1 id="titre-accueil" className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Bienvenue à Nova Terra</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            Nova Terra est la première ville fondée par l’humanité sur une autre planète. Sur ce portail, trouvez un service municipal,
            suivez l’actualité de la ville et suivez vos demandes dans votre espace citoyen.
          </p>
          <form action="/services/" method="get" role="search" aria-label="Rechercher un service" className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <label htmlFor="recherche-accueil" className="sr-only">Rechercher un service municipal</label>
            <input
              id="recherche-accueil"
              name="q"
              type="search"
              placeholder="Ex. : acte de naissance, médecin, navette…"
              className="h-12 flex-1 rounded-xl border border-white/30 bg-white px-4 text-base text-slate-950 placeholder:text-slate-500"
            />
            <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 font-semibold text-slate-950 hover:bg-amber-300">
              <Search className="size-5" aria-hidden="true" /> Rechercher
            </button>
          </form>
        </div>
      </section>

      <section aria-labelledby="titre-taches" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 id="titre-taches" className="text-2xl font-semibold tracking-tight">Que souhaitez-vous faire ?</h2>
        <div className="mt-6"><Tasks /></div>
      </section>

      <section aria-labelledby="titre-services" className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="titre-services" className="text-3xl font-semibold tracking-tight">Services les plus demandés</h2>
              <p className="mt-2 text-slate-700">Les services essentiels de la vie à Nova Terra.</p>
            </div>
            <Link href="/services" className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
              Tous les services <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8"><FeaturedServices /></div>
        </div>
      </section>

      <section aria-labelledby="titre-actualites" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="titre-actualites" className="text-3xl font-semibold tracking-tight">Dernières actualités</h2>
            <p className="mt-2 text-slate-700">Les informations publiées par la mairie.</p>
          </div>
          <Link href="/actualites" className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
            Toutes les actualités <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8"><LatestPublications /></div>
      </section>

      <AccountCallToAction />
    </>
  )
}
