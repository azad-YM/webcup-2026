import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  Workflow,
} from "@boilerplate/shared-ui/components/icon"
import { SessionAction } from "@/modules/auth/ui/components/session-action"
import { SpacesList } from "@/modules/auth/ui/components/spaces-list"

const features = [
  { icon: ShieldCheck, title: "Connexion unique", text: "Le site porte le seul formulaire ; les applications reçoivent un code à usage unique avec PKCE." },
  { icon: Boxes, title: "Modules isolés", text: "Chaque module expose ses ports et ne dépend jamais des détails internes d’un autre." },
  { icon: Workflow, title: "Cas d’usage testés", text: "Commandes et requêtes passent par des use cases injectés, testés avec des doubles." },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <a href="#accueil" className="flex items-center gap-3" aria-label="Boilerplate, accueil">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-green text-white"><Boxes className="size-5" /></span>
          <strong className="text-lg leading-none">Boilerplate</strong>
        </a>
        <a href="#espaces" className="hidden rounded-full bg-white px-5 py-2.5 text-sm font-medium shadow-sm transition hover:shadow-md sm:inline-flex">Accéder à un espace</a>
        <SessionAction />
      </header>

      <section id="accueil" className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-28 lg:pt-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-900"><CheckCircle2 className="size-4" /> Point d’entrée public</div>
          <h1 className="mt-7 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl">Un socle prêt à accueillir votre produit.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">Remplacez ce contenu par la présentation de votre produit. Le site gère la connexion et oriente chaque compte vers les espaces auxquels il a accès.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="/login" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-green px-6 font-medium text-white transition hover:bg-brand-green/90">Se connecter <ArrowRight className="size-4" /></a>
            <a href="#espaces" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-red px-6 font-medium text-white transition hover:bg-brand-red/90">Choisir mon espace <ArrowRight className="size-4" /></a>
          </div>
        </div>

        <div className="bg-brand-gradient relative overflow-hidden rounded-[2rem] p-8 text-white shadow-2xl sm:p-10">
          <LockKeyhole className="relative size-8 text-emerald-300" />
          <h2 className="relative mt-8 text-3xl font-semibold">Ce qui est déjà branché</h2>
          <div className="relative mt-8 space-y-5">
            {["Authentification JWT via l’API", "Liste des espaces autorisés", "Passage sécurisé vers l’application admin"].map((item) => (
              <p key={item} className="flex items-center gap-3 text-emerald-50"><CheckCircle2 className="size-5 shrink-0 text-emerald-300" />{item}</p>
            ))}
          </div>
        </div>
      </section>

      <section id="espaces" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Vos espaces</p><h2 className="mt-3 text-4xl font-semibold tracking-tight">Les applications accessibles à votre compte</h2><p className="mt-4 leading-7 text-slate-600">La liste vient de l’API ; seuls les espaces autorisés sont affichés.</p></div>
          <SpacesList />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-3 lg:px-8">
        {features.map((feature) => (
          <article key={feature.title} className="flex gap-4"><feature.icon className="mt-1 size-6 shrink-0 text-emerald-800" /><div><h2 className="font-semibold">{feature.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p></div></article>
        ))}
      </section>

      <footer className="bg-brand-gradient px-6 py-10 text-white/80"><div className="mx-auto max-w-7xl text-sm"><p>© {new Date().getFullYear()} Boilerplate.</p></div></footer>
    </main>
  )
}
