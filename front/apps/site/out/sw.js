/*
 * Nova Terra — service worker minimal (L17, F59 : connexion très lente ou coupée).
 * Compatible avec l’export statique : un seul fichier servi à la racine, enregistré en production.
 *
 * - Fichiers `/_next/static/` (noms versionnés) : cache d’abord.
 * - Pages du site : réseau d’abord avec délai d’attente, puis dernière version enregistrée.
 * - Données publiques de l’API (services, actualités, alertes générales, participation publique) : réseau
 *   d’abord, une nouvelle tentative, puis dernière réponse lue. Jamais de requête portant un jeton
 *   (`Authorization`) : les données personnelles ne sont pas conservées. Le flux temps réel n’est pas touché.
 * - Messages aux pages : `slow` (réponse qui tarde), `fresh` (réponse du réseau), `cached` (réponse
 *   enregistrée servie, avec sa date), `degraded` (l’API répond 503 : service surchargé).
 */
const VERSION = "nt-sobriete-v1"
const STATIC_CACHE = `${VERSION}-static`
const PAGES_CACHE = `${VERSION}-pages`
const DATA_CACHE = `${VERSION}-data`
const STAMP = "x-nova-terra-cached-at"
const SLOW_AFTER_MS = 3000
const FALLBACK_AFTER_MS = 8000
const RETRY_AFTER_MS = 1500
const MAX_STATIC_ENTRIES = 150
const ESSENTIAL_PAGES = ["/", "/services/", "/actualites/", "/urgences/", "/carte/", "/bienvenue/", "/connexion/", "/sobriete/"]
const PUBLIC_DATA = /\/api\/(administration\/(services|districts)|communication\/(publications|alerts)|participation\/(projects|consultations|ideas))(\/|$)/

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE)
      .then((cache) => Promise.all(ESSENTIAL_PAGES.map((page) => fetch(page)
        .then((response) => response.ok ? stamp(response).then((stamped) => cache.put(page, stamped)) : undefined)
        .catch(() => undefined))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("nt-") && !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return
  if ((request.headers.get("accept") || "").includes("text/event-stream")) return
  const url = new URL(request.url)
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/_next/static/")) event.respondWith(cacheFirst(request))
    else if (request.mode === "navigate" || url.pathname.endsWith(".txt") || url.pathname.endsWith("/")) event.respondWith(networkFirst(event, PAGES_CACHE, request.mode === "navigate"))
    return
  }
  if (request.headers.has("authorization")) return
  if (PUBLIC_DATA.test(url.pathname)) event.respondWith(networkFirst(event, DATA_CACHE, false))
})

function stamp(response) {
  return response.clone().blob().then((body) => {
    const headers = new Headers(response.headers)
    headers.set(STAMP, String(Date.now()))
    return new Response(body, { status: response.status, statusText: response.statusText, headers })
  })
}

function notify(message) {
  self.clients.matchAll({ type: "window" }).then((clients) => clients.forEach((client) => client.postMessage({ source: "nova-terra-sw", ...message })))
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchWithRetry(request) {
  try {
    return await fetch(request)
  } catch (error) {
    if (self.navigator && self.navigator.onLine === false) throw error
    notify({ type: "slow" })
    await wait(RETRY_AFTER_MS)
    return fetch(request)
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    await cache.put(request, response.clone())
    const keys = await cache.keys()
    if (keys.length > MAX_STATIC_ENTRIES) await Promise.all(keys.slice(0, keys.length - MAX_STATIC_ENTRIES).map((key) => cache.delete(key)))
  }
  return response
}

async function networkFirst(event, cacheName, navigation) {
  const request = event.request
  const cache = await caches.open(cacheName)
  // Pages : une seule version par chemin (les paramètres d’URL sont lus par la page). Données : URL complète.
  const key = cacheName === PAGES_CACHE ? new URL(request.url).pathname : request.url
  const network = fetchWithRetry(request).then(async (response) => {
    if (response.status === 503) notify({ type: "degraded" })
    if (response.ok) await cache.put(key, await stamp(response))
    return response
  })
  const slow = setTimeout(() => notify({ type: "slow" }), SLOW_AFTER_MS)
  const timeout = wait(FALLBACK_AFTER_MS).then(() => null)
  try {
    const response = await Promise.race([network, timeout])
    if (response) {
      notify({ type: "fresh" })
      return response
    }
  } catch {
    /* Réseau indisponible : on essaie la dernière version enregistrée. */
  } finally {
    clearTimeout(slow)
  }
  const cached = await cache.match(key)
  if (cached) {
    notify({ type: "cached", at: Number(cached.headers.get(STAMP)) || null, offline: self.navigator ? self.navigator.onLine === false : false })
    // La réponse du réseau, si elle finit par arriver, met le cache à jour pour la prochaine fois.
    event.waitUntil(network.catch(() => undefined))
    return cached
  }
  try {
    const response = await network
    notify({ type: "fresh" })
    return response
  } catch (error) {
    notify({ type: "cached", at: null, offline: true })
    if (!navigation) throw error
    return new Response(
      "<!doctype html><html lang=\"fr\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>Hors ligne | Nova Terra</title>" +
      "<body style=\"font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;line-height:1.5\">" +
      "<h1>Hors ligne</h1><p>Cette page n’a pas encore été enregistrée sur votre appareil et la connexion est coupée.</p>" +
      "<p>Les pages essentielles restent disponibles : <a href=\"/\">accueil</a>, <a href=\"/urgences/\">urgences</a>, <a href=\"/services/\">services</a>, <a href=\"/actualites/\">actualités</a>.</p>" +
      "<p>En cas d’urgence vitale, appelez directement les secours.</p></body></html>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    )
  }
}
