"use client"
import { useEffect, useRef, useState } from "react"
import type { FormDraftGateway } from "../../core/application/ports/form-draft.gateway"
import { useSession } from "../store-provider"
import { useMessages } from "../i18n/i18n-provider"
import { SOBRIETY_MESSAGES } from "./sobriety-messages"

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
const SKIPPED_TYPES = new Set(["password", "hidden", "file", "submit", "button", "reset", "image"])

const draftKey = (form: HTMLFormElement) => form.dataset.brouillon || null
const fieldName = (field: Field) => field.name || field.id

function eligible(element: Element): element is Field {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) return false
  if (element instanceof HTMLInputElement && SKIPPED_TYPES.has(element.type)) return false
  if (element.autocomplete === "one-time-code" || element.hasAttribute("data-brouillon-ignorer") || element.disabled) return false
  return Boolean(fieldName(element))
}

function fieldsOf(form: HTMLFormElement): Field[] {
  return Array.from(form.elements).filter(eligible)
}

function collect(form: HTMLFormElement) {
  const values: Record<string, string | boolean> = {}
  for (const field of fieldsOf(form)) {
    const name = fieldName(field)
    if (field instanceof HTMLInputElement && field.type === "checkbox") values[name] = field.checked
    else if (field instanceof HTMLInputElement && field.type === "radio") { if (field.checked) values[name] = field.value }
    else values[name] = field.value
  }
  return values
}

const isBlank = (values: Record<string, string | boolean>) =>
  Object.values(values).every((value) => value === "" || value === false)

/** Donne une valeur à un champ contrôlé par React : setter natif puis événement, comme une saisie. */
function setFieldValue(field: Field, value: string) {
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : field instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(field, value)
  field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }))
}

function restore(form: HTMLFormElement, values: Record<string, string | boolean>) {
  let restored = false
  for (const field of fieldsOf(form)) {
    const name = fieldName(field)
    if (!(name in values)) continue
    const value = values[name]
    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      if (typeof value === "boolean" && field.checked !== value) { field.click(); restored = true }
    } else if (field instanceof HTMLInputElement && field.type === "radio") {
      if (field.value === value && !field.checked) { field.click(); restored = true }
    } else if (typeof value === "string" && value !== "" && field.value === "") {
      setFieldValue(field, value)
      restored = true
    }
  }
  return restored
}

/**
 * Brouillons des formulaires (L17, F59) : un formulaire marqué `data-brouillon="<clé>"` voit sa saisie
 * conservée sur l’appareil pendant la frappe, restaurée s’il est rouvert (échec réseau, page rechargée,
 * coupure), puis oubliée après un envoi réussi (formulaire quitté ou vidé) ou à la déconnexion.
 * Jamais de mot de passe, de code à usage unique ni de fichier. Aucun changement dans les formulaires
 * eux-mêmes en dehors de l’attribut.
 */
export function FormDrafts({ gateway }: { gateway: FormDraftGateway }) {
  const t = useMessages(SOBRIETY_MESSAGES)
  const { ready, hasToken } = useSession()
  const [restoredKey, setRestoredKey] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const wasConnected = useRef(false)

  // Déconnexion : l’appareil peut être partagé, les brouillons sont oubliés.
  useEffect(() => {
    if (!ready) return
    if (wasConnected.current && !hasToken) gateway.clear()
    wasConnected.current = hasToken
  }, [ready, hasToken, gateway])

  useEffect(() => {
    const seen = new WeakSet<HTMLFormElement>()
    const submitted = new Map<string, number>()
    const timers = new Map<string, number>()
    let frame = 0

    const save = (form: HTMLFormElement) => {
      const key = draftKey(form)
      if (!key) return
      window.clearTimeout(timers.get(key))
      timers.set(key, window.setTimeout(() => {
        const values = collect(form)
        if (isBlank(values)) gateway.remove(key)
        else gateway.write(key, { savedAt: Date.now(), fields: values })
      }, 400))
    }
    const onInput = (event: Event) => {
      const form = (event.target as Element | null)?.closest?.("form[data-brouillon]")
      if (form instanceof HTMLFormElement) save(form)
    }
    const forgetIfSent = (key: string, form: HTMLFormElement) => {
      if (!navigator.onLine) return
      if (!form.isConnected || isBlank(collect(form))) {
        window.clearTimeout(timers.get(key))
        gateway.remove(key)
        submitted.delete(key)
      }
    }
    const onSubmit = (event: Event) => {
      const form = event.target
      if (!(form instanceof HTMLFormElement)) return
      const key = draftKey(form)
      if (!key) return
      submitted.set(key, Date.now())
      // Après un envoi réussi, le formulaire est quitté ou vidé : le brouillon est alors oublié.
      for (const delay of [1500, 5000, 12000]) window.setTimeout(() => forgetIfSent(key, form), delay)
    }
    const scan = () => {
      frame = 0
      document.querySelectorAll<HTMLFormElement>("form[data-brouillon]").forEach((form) => {
        if (seen.has(form)) return
        seen.add(form)
        const key = draftKey(form)
        const draft = key ? gateway.read(key) : null
        if (key && draft && restore(form, draft.fields)) setRestoredKey(key)
      })
    }
    const observer = new MutationObserver(() => { if (!frame) frame = window.requestAnimationFrame(scan) })
    observer.observe(document.body, { childList: true, subtree: true })
    scan()
    document.addEventListener("input", onInput, true)
    document.addEventListener("change", onInput, true)
    document.addEventListener("submit", onSubmit, true)
    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
      timers.forEach((timer) => window.clearTimeout(timer))
      document.removeEventListener("input", onInput, true)
      document.removeEventListener("change", onInput, true)
      document.removeEventListener("submit", onSubmit, true)
    }
  }, [gateway])

  const clear = () => {
    if (!restoredKey) return
    gateway.remove(restoredKey)
    document.querySelectorAll<HTMLFormElement>(`form[data-brouillon="${CSS.escape(restoredKey)}"]`).forEach((form) => {
      for (const field of fieldsOf(form)) {
        if (field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio")) continue
        if (field.value !== "") setFieldValue(field, "")
      }
    })
    // Le vidage ci-dessus déclenche un enregistrement (vide) : on l’annule.
    window.setTimeout(() => gateway.remove(restoredKey), 500)
    setRestoredKey(null)
    setMessage(t.draftCleared)
  }

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 empty:hidden">
      {restoredKey ? (
        <div className="pointer-events-auto flex max-w-xl flex-wrap items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-lg">
          <span className="min-w-0 flex-1">{t.draftRestored}</span>
          <button type="button" onClick={clear} className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50">{t.draftClear}</button>
          <button type="button" onClick={() => setRestoredKey(null)} className="rounded-lg px-3 py-1.5 font-medium hover:bg-slate-100">{t.close}</button>
        </div>
      ) : message ? (
        <p className="sr-only">{message}</p>
      ) : null}
    </div>
  )
}
