"use client"
import Link from "@/modules/shared/ui/link"
import type { Route } from "next"
import { ArrowRight, Compass, LogIn, Map as MapIcon, Newspaper, Search, Siren, UserPlus, UserRound, LifeBuoy } from "@boilerplate/shared-ui/components/icon"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { HOME_MESSAGES } from "../i18n/home-messages"
import { useSession } from "@/modules/shared/ui/store-provider"
import { FeaturedServices, LatestPublications } from "../sections/content-lists"

function Tasks() {
  const { ready, hasToken } = useSession()
  const connected = ready && hasToken
  const t = useMessages(HOME_MESSAGES)
  const tasks: { title: string; text: string; href: Route; icon: typeof Search }[] = [
    { title: t.findService, text: t.findServiceText, href: "/services", icon: Search },
    { title: t.map, text: t.mapText, href: "/carte", icon: MapIcon },
    { title: t.readNews, text: t.readNewsText, href: "/actualites", icon: Newspaper },
    connected
      ? { title: t.openSpace, text: t.openSpaceText, href: "/espace", icon: UserRound }
      : { title: t.createAccount, text: t.createAccountText, href: "/inscription", icon: UserPlus },
    connected
      ? { title: t.completeProfile, text: t.completeProfileText, href: "/espace/profil", icon: UserRound }
      : { title: t.logIn, text: t.logInText, href: "/connexion", icon: LogIn }
  ]
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
  const t = useMessages(HOME_MESSAGES)
  if (!ready) return null
  return (
    <section aria-labelledby="titre-compte" data-optional className="bg-teal-800 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="max-w-2xl">
          <h2 id="titre-compte" className="text-3xl font-semibold tracking-tight">
            {hasToken ? t.ctaConnected : t.ctaGuest}
          </h2>
          <p className="mt-3 text-lg text-teal-50">
            {hasToken ? t.ctaConnectedText : t.ctaGuestText}
          </p>
        </div>
        <Link href={hasToken ? "/espace" : "/inscription"} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-teal-900 hover:bg-teal-50">
          {hasToken ? t.ctaConnectedLink : t.ctaGuestLink} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

/** Accueil (D07) : où l’on est, ce qu’on peut faire, les services principaux et les actualités. */
/** F46, F72 : deux accès directs depuis l’accueil, les urgences et l’orientation des nouveaux arrivants. */
function QuickAccess() {
  const t = useMessages(HOME_MESSAGES)
  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 pt-8 sm:px-6 md:grid-cols-3 lg:px-8">
      <Link href="/urgences" className="flex items-start gap-4 rounded-2xl border-2 border-red-700 bg-red-50 p-5 hover:bg-red-100">
        <Siren className="mt-0.5 size-7 shrink-0 text-red-700" aria-hidden="true" />
        <span>
          <span className="block text-lg font-semibold text-red-950">{t.emergencyTitle} {t.emergencyLink}</span>
          <span className="mt-1 block text-red-950">{t.emergencyText}</span>
        </span>
      </Link>
      <Link href="/bienvenue" className="flex items-start gap-4 rounded-2xl border-2 border-teal-700 bg-teal-50 p-5 hover:bg-teal-100">
        <Compass className="mt-0.5 size-7 shrink-0 text-teal-700" aria-hidden="true" />
        <span>
          <span className="block text-lg font-semibold text-teal-950">{t.newcomerTitle} {t.newcomerLink}</span>
          <span className="mt-1 block text-teal-950">{t.newcomerText}</span>
        </span>
      </Link>
      {/* F93, F94 : l’essentiel (alertes, consignes, numéros) à un clic, lisible hors ligne. */}
      <Link href="/essentiel" className="flex items-start gap-4 rounded-2xl border-2 border-slate-700 bg-white p-5 hover:bg-slate-100">
        <LifeBuoy className="mt-0.5 size-7 shrink-0 text-slate-700" aria-hidden="true" />
        <span>
          <span className="block text-lg font-semibold text-slate-950">{t.essentialsTitle}</span>
          <span className="mt-1 block text-slate-800">{t.essentialsText}</span>
        </span>
      </Link>
    </div>
  )
}

export function HomePage() {
  const t = useMessages(HOME_MESSAGES)
  return (
    <>
      <section aria-labelledby="titre-accueil" className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" data-decorative className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-gradient-to-br from-teal-400 to-teal-900 opacity-40" />
        <div aria-hidden="true" data-decorative className="pointer-events-none absolute -right-40 top-40 h-6 w-[40rem] -rotate-12 rounded-full border-2 border-amber-300/60" />
        <div className="nt-mobile-compact relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">{t.kicker}</p>
          <h1 id="titre-accueil" className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{t.title}</h1>
          <p data-optional className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            {t.intro}
          </p>
          <form action="/services/" method="get" role="search" aria-label={t.searchForm} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <label htmlFor="recherche-accueil" className="sr-only">{t.searchLabel}</label>
            <input
              id="recherche-accueil"
              name="q"
              type="search"
              placeholder={t.searchPlaceholder}
              className="h-12 flex-1 rounded-xl border border-white/30 bg-white px-4 text-base text-slate-950 placeholder:text-slate-500"
            />
            <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 font-semibold text-slate-950 hover:bg-amber-300">
              <Search className="size-5" aria-hidden="true" /> {t.search}
            </button>
          </form>
        </div>
      </section>

      <QuickAccess />

      <section aria-labelledby="titre-taches" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 id="titre-taches" className="text-2xl font-semibold tracking-tight">{t.tasksTitle}</h2>
        <div className="mt-6"><Tasks /></div>
      </section>

      <section aria-labelledby="titre-services" className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="titre-services" className="text-3xl font-semibold tracking-tight">{t.servicesTitle}</h2>
              <p data-optional className="mt-2 text-slate-700">{t.servicesLead}</p>
            </div>
            <Link href="/services" className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
              {t.allServices} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8" data-mobile-limit><FeaturedServices /></div>
        </div>
      </section>

      <section aria-labelledby="titre-actualites" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="titre-actualites" className="text-3xl font-semibold tracking-tight">{t.newsTitle}</h2>
            <p data-optional className="mt-2 text-slate-700">{t.newsLead}</p>
          </div>
          <Link href="/actualites" className="inline-flex items-center gap-2 font-medium text-teal-800 underline underline-offset-4">
            {t.allNews} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8" data-mobile-limit><LatestPublications /></div>
      </section>

      <AccountCallToAction />
    </>
  )
}
