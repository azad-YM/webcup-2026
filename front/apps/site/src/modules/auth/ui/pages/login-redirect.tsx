"use client"
import { useEffect } from "react"
import Link from "next/link"

/**
 * Ancienne adresse de connexion, encore utilisée par l’admin : on conserve
 * les paramètres éventuels et on rejoint `/connexion`.
 */
export function LoginRedirectPage() {
  useEffect(() => {
    window.location.replace(`/connexion/${window.location.search}`)
  }, [])
  return (
    <div className="mx-auto max-w-3xl px-4 py-16" role="status">
      <p>La page de connexion a changé d’adresse. Redirection…</p>
      <p className="mt-4"><Link href="/connexion" className="font-medium text-teal-800 underline">Aller à la connexion</Link></p>
    </div>
  )
}
