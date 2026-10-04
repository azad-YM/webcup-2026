#!/usr/bin/env node
/**
 * Diagnostic de sobriété (L17, F57) — mesure locale, reproductible, sans service externe.
 *
 * Lit l’export statique `out/` (après `pnpm build`) et calcule, pour chaque page principale :
 *  - le poids transféré (HTML + JS + CSS + polices + images référencés au chargement), brut, gzip et brotli ;
 *  - le nombre de requêtes initiales ;
 *  - le nombre d’éléments du DOM rendu statiquement ;
 *  - un score EcoIndex (formule publique ecoindex.fr : quantiles DOM / requêtes / poids en Ko).
 *
 * Usage : `node scripts/ecoindex.mjs [--json fichier] [--markdown]` depuis `front/apps/site`.
 * Rien n’est écrit dans `out/`.
 *
 * Limites : le DOM mesuré est celui du HTML statique (avant hydratation et avant les données de l’API) ;
 * les modules chargés à la demande (`import()` dynamique) ne sont pas comptés, puisqu’ils ne sont
 * téléchargés que lorsqu’on en a besoin ; les appels à l’API ne sont pas comptés.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync, brotliCompressSync, constants } from "node:zlib"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const out = join(root, "out")

export const PAGES = [
  ["Accueil", "/"],
  ["Services", "/services/"],
  ["Fiche service", "/services/?service=x"],
  ["Actualités", "/actualites/"],
  ["Urgences", "/urgences/"],
  ["Carte", "/carte/"],
  ["Connexion", "/connexion/"],
  ["Espace citoyen", "/espace/"],
  ["Sobriété", "/sobriete/"],
]

// Quantiles publics d’EcoIndex (https://github.com/cnumr/ecoindex_reference).
const Q_DOM = [0, 47, 75, 159, 233, 298, 358, 417, 476, 537, 603, 674, 753, 843, 949, 1076, 1237, 1459, 1801, 2479, 594601]
const Q_REQ = [0, 2, 15, 25, 34, 42, 49, 56, 63, 70, 78, 86, 95, 105, 117, 130, 147, 170, 205, 281, 3920]
const Q_SIZE = [0, 1.37, 144.7, 319.53, 479.46, 631.97, 783.38, 937.91, 1098.62, 1265.47, 1448.32, 1648.27, 1876.08, 2142.06, 2465.37, 2866.31, 3401.59, 4155.73, 5400.08, 8037.54, 223212.26]

function quantile(qs, value) {
  for (let i = 1; i < qs.length; i++) {
    if (value < qs[i]) return i - 1 + (value - qs[i - 1]) / (qs[i] - qs[i - 1])
  }
  return qs.length - 1
}

export function ecoIndex(dom, requests, sizeKb) {
  const score = 100 - (5 * (3 * quantile(Q_DOM, dom) + 2 * quantile(Q_REQ, requests) + quantile(Q_SIZE, sizeKb))) / 6
  return Math.max(0, Math.round(score))
}

export function grade(score) {
  for (const [limit, letter] of [[80, "A"], [70, "B"], [55, "C"], [40, "D"], [25, "E"], [10, "F"]]) {
    if (score > limit) return letter
  }
  return "G"
}

const cache = new Map()
function sizes(file) {
  if (cache.has(file)) return cache.get(file)
  const buf = readFileSync(file)
  const s = {
    raw: buf.length,
    gzip: gzipSync(buf, { level: 9 }).length,
    br: brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
  }
  cache.set(file, s)
  return s
}

function htmlFile(route) {
  const path = route.split("?")[0]
  return join(out, path, "index.html")
}

function stripScripts(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "<script></script>")
}

function resources(html) {
  const urls = new Set()
  const add = (u) => {
    if (!u || u.startsWith("data:") || /^https?:/.test(u)) return
    urls.add(u.split("?")[0].split("#")[0])
  }
  for (const m of html.matchAll(/<script\b[^>]*>/gi)) {
    if (/nomodule/i.test(m[0])) continue // polyfills ignorés par les navigateurs récents
    add(/\bsrc="([^"]+)"/.exec(m[0])?.[1])
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0]
    const rel = /rel="([^"]+)"/.exec(tag)?.[1] ?? ""
    const href = /href="([^"]+)"/.exec(tag)?.[1]
    if (/stylesheet|preload|icon|modulepreload/.test(rel) && !/prefetch/.test(rel)) add(href)
  }
  for (const m of stripScripts(html).matchAll(/<img\b[^>]*>/gi)) {
    if (/loading="lazy"/.test(m[0])) continue // hors de l’écran initial : chargée plus tard
    add(/src="([^"]+)"/.exec(m[0])?.[1])
  }
  // Polices et images appelées depuis les feuilles de style.
  for (const u of [...urls]) {
    if (!u.endsWith(".css")) continue
    const css = readFileSync(join(out, u), "utf8")
    for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
      if (/\.(woff2?|ttf|otf)$/.test(m[1])) add(m[1].startsWith("/") ? m[1] : `/_next/static/media/${m[1].split("/").pop()}`)
    }
  }
  return [...urls]
}

export function measure(route) {
  const file = htmlFile(route)
  if (!existsSync(file)) return null
  const html = readFileSync(file, "utf8")
  const body = stripScripts(html)
  const dom = (body.match(/<[a-zA-Z][a-zA-Z0-9-]*/g) ?? []).length
  const total = { ...sizes(file) }
  const byType = { html: sizes(file).gzip, js: 0, css: 0, font: 0, image: 0 }
  const list = resources(html)
  for (const url of list) {
    const path = join(out, url)
    if (!existsSync(path)) continue
    const s = sizes(path)
    total.raw += s.raw
    total.gzip += s.gzip
    total.br += s.br
    const type = /\.js$/.test(url) ? "js" : /\.css$/.test(url) ? "css" : /\.(woff2?|ttf|otf)$/.test(url) ? "font" : "image"
    byType[type] += s.gzip
  }
  const requests = 1 + list.length
  const sizeKb = total.gzip / 1024
  const score = ecoIndex(dom, requests, sizeKb)
  return { route, dom, requests, ...total, byType, score, grade: grade(score) }
}

const kb = (n) => `${(n / 1024).toFixed(1)}`

function main() {
  if (!existsSync(out)) {
    console.error("Aucun export `out/` : lancez d’abord `pnpm build`.")
    process.exit(1)
  }
  const args = process.argv.slice(2)
  const rows = PAGES.map(([label, route]) => ({ label, ...(measure(route) ?? { route, missing: true }) }))
  const jsonIndex = args.indexOf("--json")
  if (jsonIndex >= 0) writeFileSync(args[jsonIndex + 1], JSON.stringify(rows, null, 2))

  console.log("| Page | Route | Requêtes | DOM | Brut (Ko) | gzip (Ko) | brotli (Ko) | dont JS gzip (Ko) | dont CSS gzip (Ko) | EcoIndex |")
  console.log("|---|---|---:|---:|---:|---:|---:|---:|---:|---|")
  for (const r of rows) {
    if (r.missing) {
      console.log(`| ${r.label} | \`${r.route}\` | — | — | — | — | — | — | — | page absente |`)
      continue
    }
    console.log(`| ${r.label} | \`${r.route}\` | ${r.requests} | ${r.dom} | ${kb(r.raw)} | ${kb(r.gzip)} | ${kb(r.br)} | ${kb(r.byType.js)} | ${kb(r.byType.css)} | ${r.score} (${r.grade}) |`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
