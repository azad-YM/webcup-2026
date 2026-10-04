import type { LucideIcon } from "lucide-react"
import { NavLink } from "react-router"

export type NavItem = { title: string; url: string; icon: LucideIcon; description?: string }
export type NavGroup = { title: string; items: NavItem[] }

export function NavMain({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  return <nav aria-label="Rubriques du module" className="space-y-7 p-4">
    {groups.map((group) => <section key={group.title}>
      <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{group.title}</h2>
      <ul className="space-y-1">
        {group.items.map((item) => <li key={item.url}>
          <NavLink to={item.url} end onClick={onNavigate} className={({ isActive }) => `flex items-start gap-3 rounded-xl px-3 py-3 transition ${isActive ? "bg-teal-50 font-semibold text-teal-900 ring-1 ring-inset ring-teal-200" : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"}`}>
            <item.icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0"><span className="block text-sm">{item.title}</span>{item.description && <span className="mt-1 block text-xs font-normal leading-5 text-slate-600">{item.description}</span>}</span>
          </NavLink>
        </li>)}
      </ul>
    </section>)}
  </nav>
}
