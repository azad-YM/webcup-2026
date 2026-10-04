import { useState } from "react"
import { Button, Label, Textarea } from "@boilerplate/shared-ui/components"
import { getErrorMessage } from "@boilerplate/shared-utils/error.utils"
import { PLAIN_LANGUAGE_MAX, type PlainLanguageDraft } from "../../core/domain/content"

/**
 * F89 : champ « En clair » avec le bouton « Proposer une version en clair ». La proposition (IA si disponible,
 * brouillon local sinon) remplit seulement le champ : l’agent relit, corrige, puis valide en enregistrant.
 */
export function PlainLanguageField({ id, value, disabled, canSuggest, onChange, suggest }: {
  id: string
  value: string
  disabled: boolean
  /** Faux tant que les textes nécessaires (nom, résumé) ne sont pas saisis. */
  canSuggest: boolean
  onChange: (value: string) => void
  suggest: () => Promise<{ data: PlainLanguageDraft } | { error: unknown }>
}) {
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const propose = async () => {
    setPending(true)
    setError(null)
    setNotice(null)
    const result = await suggest()
    setPending(false)
    if ("data" in result) {
      onChange(result.data.text.slice(0, PLAIN_LANGUAGE_MAX))
      setNotice(result.data.source === "model"
        ? "Proposition rédigée par une IA (Claude). Relisez-la et corrigez-la : rien n’est publié tant que vous n’avez pas enregistré."
        : "Proposition automatique sans IA (premières phrases, mots difficiles expliqués). Relisez-la et corrigez-la avant d’enregistrer.")
    } else {
      setError(getErrorMessage(result.error))
    }
  }
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="font-semibold">Version en clair</legend>
      <Label htmlFor={id}>En clair (facultatif)</Label>
      <Textarea id={id} rows={3} maxLength={PLAIN_LANGUAGE_MAX} aria-describedby={`${id}-aide`} value={value} onChange={(event) => onChange(event.target.value)} />
      <p id={`${id}-aide`} className="text-sm text-muted-foreground">
        L’essentiel en 2 à 4 phrases simples ({value.length}/{PLAIN_LANGUAGE_MAX} caractères). Les habitants l’affichent avec l’interrupteur « Version en langage clair ». Publiée seulement à l’enregistrement.
      </p>
      <Button type="button" variant="outline" size="sm" disabled={pending || !canSuggest} onClick={() => void propose()}>
        {pending ? "Proposition en cours…" : "Proposer une version en clair"}
      </Button>
      {notice && <p role="status" className="text-sm text-amber-800">{notice}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </fieldset>
  )
}
