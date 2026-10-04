"use client"
import { lazy, Suspense, useId, useRef, useState } from "react"
import { Accessibility } from "lucide-react"
import { cn } from "../../lib/utils"
import { TEXT_SIZES, TEXT_SIZE_LABELS, type TextSize } from "../../a11y/display-preferences"
import { useAccessibilityPreferences } from "./preferences-provider"

const choice = "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-foreground has-[:checked]:bg-muted"
const control = "mt-1 size-5 shrink-0 accent-[var(--ring)]"

/**
 * Réglages « Affichage et accessibilité » : taille du texte, contraste élevé,
 * réduction des animations. Chaque changement s’applique immédiatement et est
 * mémorisé par la gateway de l’application.
 */
export function DisplayPreferencesPanel({ showHintsReset = false, showLightMode = false }: { showHintsReset?: boolean; showLightMode?: boolean }) {
  const prefs = useAccessibilityPreferences()
  const [message, setMessage] = useState("")
  const id = useId()
  const confirm = (text: string) => setMessage(text)
  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="mb-2 font-medium">Taille du texte</legend>
        {TEXT_SIZES.map((size) => (
          <label key={size} className={choice}>
            <input
              type="radio"
              name={`${id}-taille`}
              value={size}
              checked={prefs.preferences.textSize === size}
              onChange={() => { prefs.updatePreferences({ textSize: size as TextSize }); confirm(`Taille du texte : ${TEXT_SIZE_LABELS[size]}.`) }}
              className={control}
            />
            <span style={{ fontSize: `${Number(size) / 100}rem` }}>{TEXT_SIZE_LABELS[size]}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-2 font-medium">Couleurs et mouvements</legend>
        <label className={choice}>
          <input
            type="checkbox"
            checked={prefs.preferences.highContrast}
            onChange={(event) => { prefs.updatePreferences({ highContrast: event.target.checked }); confirm(event.target.checked ? "Contraste élevé activé." : "Contraste élevé désactivé.") }}
            className={control}
            aria-describedby={`${id}-contraste`}
          />
          <span>
            <span className="block font-medium">Contraste élevé</span>
            <span id={`${id}-contraste`} className="block text-sm text-muted-foreground">Textes plus foncés, bordures marquées et liens toujours soulignés.</span>
          </span>
        </label>
        <label className={choice}>
          <input
            type="checkbox"
            checked={prefs.preferences.reduceMotion}
            onChange={(event) => { prefs.updatePreferences({ reduceMotion: event.target.checked }); confirm(event.target.checked ? "Animations réduites." : "Animations rétablies.") }}
            className={control}
            aria-describedby={`${id}-animations`}
          />
          <span>
            <span className="block font-medium">Réduire les animations</span>
            <span id={`${id}-animations`} className="block text-sm text-muted-foreground">Supprime les effets de mouvement et de défilement animé.</span>
          </span>
        </label>
      </fieldset>
      {showLightMode && (
        <fieldset className="space-y-2">
          <legend className="mb-2 font-medium">Connexion et appareil</legend>
          <label className={choice}>
            <input
              type="checkbox"
              checked={prefs.preferences.lightMode}
              onChange={(event) => { prefs.updatePreferences({ lightMode: event.target.checked }); confirm(event.target.checked ? "Mode léger activé." : "Mode léger désactivé.") }}
              className={control}
              aria-describedby={`${id}-leger`}
            />
            <span>
              <span className="block font-medium">Mode léger</span>
              <span id={`${id}-leger`} className="block text-sm text-muted-foreground">Pour une connexion lente ou un appareil ancien : pas d’images décoratives ni d’animations, la carte remplacée par la liste, des mises à jour moins fréquentes. Toutes les informations et démarches restent disponibles.</span>
            </span>
          </label>
        </fieldset>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { prefs.resetPreferences(); confirm("Réglages d’affichage par défaut rétablis.") }}
          className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted"
        >
          Revenir aux réglages par défaut
        </button>
        {showHintsReset && (
          <button
            type="button"
            onClick={() => { prefs.resetHints(); confirm("Le guide et les astuces s’afficheront de nouveau.") }}
            className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted"
          >
            Revoir le guide et les astuces
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{message}</p>
      <p className="text-sm text-muted-foreground">Vos réglages sont mémorisés sur cet appareil. Le zoom du navigateur (Ctrl et +) reste aussi disponible.</p>
    </div>
  )
}

const DisplayPreferencesDialog = lazy(() => import("./display-preferences-dialog"))

/**
 * Bouton « Affichage » ouvrant le panneau dans une fenêtre de dialogue
 * accessible (focus piégé, fermeture par Échap, retour du focus au bouton).
 * La fenêtre est chargée à la première ouverture (L17 : pas de JavaScript inutile au premier affichage).
 */
export function DisplayPreferencesButton({ className, label = "Affichage", showHintsReset = false, showLightMode = false }: {
  className?: string
  label?: string
  showHintsReset?: boolean
  showLightMode?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => { setRequested(true); setOpen(true) }}
        className={cn("inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium hover:bg-muted", className)}
      >
        <Accessibility className="size-5" aria-hidden="true" />
        <span>{label}</span>
        <span className="sr-only"> et accessibilité</span>
      </button>
      {requested && (
        <Suspense fallback={<span role="status" className="sr-only">Ouverture des réglages d’affichage…</span>}>
          <DisplayPreferencesDialog open={open} onOpenChange={setOpen} returnFocusTo={button} showHintsReset={showHintsReset} showLightMode={showLightMode} />
        </Suspense>
      )}
    </>
  )
}
