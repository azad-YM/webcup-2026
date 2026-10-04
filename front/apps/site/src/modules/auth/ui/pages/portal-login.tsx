"use client"
import { useEffect, useRef, useState } from "react"
import { siteEnv } from "@/config/env"
import { SessionGuard } from "../components/session-guard"
import { useIssuePortalCodeMutation } from "../../core/application/rtk-api/auth"
import { useSession } from "@/modules/shared/ui/store-provider"
import Link from "@/modules/shared/ui/link"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"

function PortalLogin() {
  const [issue, result] = useIssuePortalCodeMutation()
  const started = useRef(false)
  const [invalid, setInvalid] = useState(false)
  const { logout } = useSession()
  useEffect(() => {
    if (started.current) return
    started.current = true
    const params = new URLSearchParams(window.location.search)
    const state = params.get("state") ?? ""
    const challenge = params.get("challenge") ?? ""
    if (params.get("destination") !== "admin" || !/^[a-f0-9]{64}$/.test(state) || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) {
      setInvalid(true)
      return
    }
    void issue(challenge).unwrap().then(({ code }) => {
      const target = new URL("auth/callback", `${siteEnv.adminUrl}/`)
      target.searchParams.set("code", code)
      target.searchParams.set("state", state)
      window.location.replace(target.href)
    }).catch(() => { /* RTK exposes the error below. */ })
  }, [issue])
  useEffect(() => {
    if (result.error && "status" in result.error && result.error.status === 401) logout()
  }, [result.error, logout])
  const failed = invalid || result.isError
  return <PageBody narrow>
    <p role={failed ? "alert" : "status"}>{failed ? "Impossible d’ouvrir cet espace. Revenez au choix des espaces pour réessayer." : "Ouverture de votre espace…"}</p>
    {failed && <Link href="/espace" className="mt-4 block font-medium text-teal-800 underline">Choisir un espace</Link>}
  </PageBody>
}

export function PortalLoginPage() {
  return <>
    <PageHeader trail={[{ label: "Mon espace", href: "/espace" }, { label: "Ouverture d’un espace" }]} title="Ouverture d’un espace de travail" />
    <SessionGuard><PortalLogin /></SessionGuard>
  </>
}
