"use client"
import { useEffect, useState } from "react"
import { useAccessibilityPreferences } from "@boilerplate/shared-ui/components/a11y"
import { DEGRADED_MODE_EVENT as PLATFORM_DEGRADED_EVENT, watchPlatformStatus } from "@boilerplate/shared-utils/platform-status"
import { siteEnv } from "@/config/env"
import { format } from "../../core/i18n/locales"
import { useMessages } from "../i18n/i18n-provider"
import { activateTemporaryLightMode, endTemporaryLightMode, useLightMode } from "./light-mode"
import { formatCachedAt, SOBRIETY_MESSAGES } from "./sobriety-messages"

/** Événement que tout adaptateur du site peut émettre quand l’API annonce un mode dégradé (surcharge). */
export const DEGRADED_MODE_EVENT = PLATFORM_DEGRADED_EVENT
const SUGGESTION_HINT = "mode-leger-propose"

type NetworkInformation = EventTarget & { saveData?: boolean; effectiveType?: string; downlink?: number }
type WorkerMessage = { source?: string; type?: "slow" | "fresh" | "cached" | "degraded"; at?: number | null; offline?: boolean }

const connection = () => (typeof navigator !== "undefined" ? (navigator as Navigator & { connection?: NetworkInformation }).connection : undefined)

/** Économie de données demandée ou réseau très lent (2G, débit inférieur à 0,5 Mb/s). */
function looksSlow() {
  const info = connection()
  if (!info) return false
  return info.saveData === true || info.effectiveType === "slow-2g" || info.effectiveType === "2g" || (typeof info.downlink === "number" && info.downlink > 0 && info.downlink < 0.5)
}

/**
 * État de la connexion (L17, F59/F62), affiché sous l’en-tête sur toutes les pages :
 * - enregistre le service worker minimal (`/sw.js`, production seulement) qui garde les pages et données publiques ;
 * - « Hors ligne — informations du JJ/MM à HHhMM » quand une réponse enregistrée est servie ;
 * - « La connexion est lente, nous réessayons… » quand une réponse tarde (le service worker réessaie) ;
 * - propose le mode léger (économie de données, réseau lent) et l’active pour la visite si le serveur est surchargé.
 */
export function ConnectionStatus() {
  const t = useMessages(SOBRIETY_MESSAGES)
  const prefs = useAccessibilityPreferences()
  const lightMode = useLightMode()
  const [online, setOnline] = useState(true)
  const [slow, setSlow] = useState(false)
  const [cachedAt, setCachedAt] = useState<number | null>(null)
  const [servedFromCache, setServedFromCache] = useState(false)
  const [recovered, setRecovered] = useState(false)
  const [slowNetwork, setSlowNetwork] = useState(false)

  useEffect(() => {
    setOnline(navigator.onLine)
    setSlowNetwork(looksSlow())
    const onOnline = () => { setOnline(true); setRecovered(true) }
    const onOffline = () => { setOnline(false); setRecovered(false) }
    const onDegraded = () => activateTemporaryLightMode("degraded")
    const onConnectionChange = () => setSlowNetwork(looksSlow())
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    window.addEventListener(DEGRADED_MODE_EVENT, onDegraded)
    connection()?.addEventListener?.("change", onConnectionChange)

    const worker = "serviceWorker" in navigator ? navigator.serviceWorker : null
    const onMessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data
      if (message?.source !== "nova-terra-sw") return
      if (message.type === "slow") setSlow(true)
      if (message.type === "fresh") { setSlow(false); setServedFromCache(false) }
      if (message.type === "cached") {
        setSlow(!message.offline)
        setServedFromCache(true)
        if (message.at) setCachedAt((current) => (current === null ? message.at! : Math.min(current, message.at!)))
        if (message.offline) setOnline(false)
      }
      if (message.type === "degraded") activateTemporaryLightMode("degraded")
    }
    worker?.addEventListener("message", onMessage)
    // L24 (F77) : l’API annonce son mode allégé (surcharge) ; l’événement active le mode léger pour la visite.
    const stopWatching = watchPlatformStatus(siteEnv.apiBaseUrl, () => undefined, 180_000)
    if (worker && process.env.NODE_ENV === "production") {
      worker.register("/sw.js", { scope: "/" }).catch(() => undefined)
    }
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
      window.removeEventListener(DEGRADED_MODE_EVENT, onDegraded)
      connection()?.removeEventListener?.("change", onConnectionChange)
      worker?.removeEventListener("message", onMessage)
      stopWatching()
    }
  }, [])

  useEffect(() => {
    if (!recovered) return
    setSlow(false)
    setServedFromCache(false)
    setCachedAt(null)
    const timer = window.setTimeout(() => setRecovered(false), 5000)
    return () => window.clearTimeout(timer)
  }, [recovered])

  const stamp = cachedAt ? formatCachedAt(cachedAt) : null
  let notice: { tone: "info" | "warn"; text: string } | null = null
  if (!online) notice = { tone: "warn", text: stamp ? format(t.offlineSince, stamp) : t.offlineNoDate }
  else if (slow) notice = { tone: "warn", text: servedFromCache && stamp ? format(t.slowWithCache, stamp) : t.slow }
  else if (recovered) notice = { tone: "info", text: t.back }

  const suggest = prefs.ready && slowNetwork && !lightMode.active && !prefs.isHintSeen(SUGGESTION_HINT)

  return (
    <div role="status" aria-live="polite" className="empty:hidden">
      {notice && (
        <p className={`px-4 py-2 text-center text-sm font-medium sm:px-6 lg:px-8 ${notice.tone === "warn" ? "bg-amber-100 text-amber-950" : "bg-teal-50 text-teal-950"}`}>
          {notice.text}
        </p>
      )}
      {lightMode.temporaryReason === "degraded" && (
        <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-100 px-4 py-2 text-sm text-slate-900">
          <span>{t.degraded}</span>
          <button type="button" onClick={() => endTemporaryLightMode(lightMode.chosen)} className="rounded-lg border border-slate-400 bg-white px-3 py-1 font-medium hover:bg-slate-50">{t.degradedRestore}</button>
        </div>
      )}
      {suggest && (
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 text-sm sm:px-6 lg:px-8">
          <p className="min-w-0 flex-1"><strong className="font-semibold">{t.suggestTitle}</strong> {t.suggestText}</p>
          <button type="button" onClick={() => { prefs.updatePreferences({ lightMode: true }); prefs.markHintSeen(SUGGESTION_HINT) }} className="rounded-lg bg-teal-700 px-3 py-2 font-medium text-white hover:bg-teal-800">{t.suggestAccept}</button>
          <button type="button" onClick={() => prefs.markHintSeen(SUGGESTION_HINT)} className="rounded-lg border border-slate-300 px-3 py-2 font-medium hover:bg-slate-50">{t.suggestDecline}</button>
        </div>
      )}
    </div>
  )
}
