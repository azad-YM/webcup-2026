import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { useCompletePortalLoginMutation, useStartPortalLoginMutation } from "../../core/application/rtk-api/auth"

export function PortalLoginStart() {
  const [start, result] = useStartPortalLoginMutation()
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    void start().unwrap().then(url => window.location.replace(url)).catch(() => {})
  }, [start])
  return <PortalLoginStatus failed={result.isError} />
}

export function PortalLoginCallback() {
  const [complete, result] = useCompletePortalLoginMutation()
  const navigate = useNavigate()
  const started = useRef(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code") ?? ""
    const state = params.get("state") ?? ""
    window.history.replaceState(null, "", "/auth/callback")
    void complete({ code, state }).unwrap().then(() => navigate("/admin", { replace: true })).catch(() => setFailed(true))
  }, [complete, navigate])
  return <PortalLoginStatus failed={failed || result.isError} />
}

function PortalLoginStatus({ failed }: { failed: boolean }) {
  return <main className="grid min-h-screen place-items-center p-6"><div>
    <p role={failed ? "alert" : "status"}>{failed ? "La connexion n’a pas abouti. Recommencez depuis le site." : "Connexion à l’administration…"}</p>
    {failed && <Link to="/login" className="mt-4 block underline">Revenir à la connexion</Link>}
  </div></main>
}
