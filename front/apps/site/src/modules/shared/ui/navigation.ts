import type { Route } from "next"

export type NavItem = { label: string; href: Route }

/** Navigation principale du site, identique pour tous les visiteurs. */
export const MAIN_NAVIGATION: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Actualités", href: "/actualites" }
]

/** Retire la barre oblique finale ajoutée par l’export statique (`trailingSlash`). */
export const normalizePath = (pathname: string | null) =>
  !pathname || pathname === "/" ? "/" : pathname.replace(/\/+$/, "")

/** Une rubrique est active sur sa page et sur ses sous-pages ; l’accueil seulement sur `/`. */
export function isCurrentSection(pathname: string | null, href: string) {
  const current = normalizePath(pathname)
  if (href === "/") return current === "/"
  return current === href || current.startsWith(`${href}/`)
}
