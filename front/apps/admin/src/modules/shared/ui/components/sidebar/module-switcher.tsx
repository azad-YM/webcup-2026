import { Link } from "react-router"
import { Orbit } from "@boilerplate/shared-ui/components/icon"
import type { ReactNode } from "react"
import { MODULES, type ModuleCode } from "../../layout/workspace-navigation"

/** Barre des modules internes ; les espaces du compte sont un slot distinct. */
export function ModuleSwitcher({ current, modules, account, onNavigate }: {
  current: ModuleCode | null
  modules: ModuleCode[]
  account: ReactNode
  onNavigate?: () => void
}) {
  return <aside aria-label="Modules et compte" className="flex h-full w-24 shrink-0 flex-col items-center border-r border-slate-200 bg-slate-50 px-2 py-5">
    <Link to="/espaces" onClick={onNavigate} aria-label="Nova Terra, accueil des modules" className="mb-8 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-teal-300"><Orbit className="size-7" aria-hidden="true" /></Link>
    <nav aria-label="Modules principaux" className="w-full flex-1 overflow-y-auto">
      <ul className="space-y-4">{modules.map((code) => {
        const module = MODULES[code]
        const active = current === code
        return <li key={code}><Link to={module.route} onClick={onNavigate} aria-current={active ? "true" : undefined} className={`flex flex-col items-center gap-2 rounded-xl px-1 py-3 text-center text-xs leading-4 transition ${active ? "bg-teal-50 font-semibold text-teal-900" : "text-slate-600 hover:bg-white hover:text-slate-950"}`}>
          <span className={`flex size-11 items-center justify-center rounded-2xl ${active ? "bg-teal-700 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600"}`}><module.icon className="size-5" aria-hidden="true" /></span>
          {module.title}
        </Link></li>
      })}</ul>
    </nav>
    <div className="mt-5 flex flex-col items-center gap-2 border-t border-slate-200 pt-4">{account}<span className="text-xs text-slate-600">Mon compte</span></div>
  </aside>
}
