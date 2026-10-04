"use client"
import type { RefObject } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../shadcn/dialog"
import { DisplayPreferencesPanel } from "./display-preferences-panel"

/**
 * Fenêtre « Affichage et accessibilité », chargée à la première ouverture seulement (L17, F58/F61) :
 * la boîte de dialogue et ses dépendances ne pèsent pas sur le premier chargement des pages.
 * Le focus revient au bouton d’ouverture à la fermeture.
 */
export default function DisplayPreferencesDialog({ open, onOpenChange, returnFocusTo, showHintsReset, showLightMode }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnFocusTo: RefObject<HTMLButtonElement | null>
  showHintsReset: boolean
  showLightMode: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        onCloseAutoFocus={(event) => { event.preventDefault(); returnFocusTo.current?.focus() }}
      >
        <DialogHeader>
          <DialogTitle>Affichage et accessibilité</DialogTitle>
          <DialogDescription>Adaptez la taille du texte, les couleurs et les animations à vos besoins.</DialogDescription>
        </DialogHeader>
        <DisplayPreferencesPanel showHintsReset={showHintsReset} showLightMode={showLightMode} />
      </DialogContent>
    </Dialog>
  )
}
