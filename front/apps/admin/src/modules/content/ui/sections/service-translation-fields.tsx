import { Input, Label, Textarea } from "@boilerplate/shared-ui/components"
import { TRANSLATION_LANGUAGES, type MunicipalService, type ServiceTranslation, type TranslationLanguage } from "../../core/domain/content"

const empty: ServiceTranslation = { name: "", summary: "", description: "" }

/**
 * F27 : traductions saisies par les agents. Un champ vide laisse le français affiché
 * sur le site, avec la mention « Non traduit ».
 */
export function ServiceTranslationFields({ draft, disabled, onChange }: { draft: MunicipalService; disabled: boolean; onChange: (service: MunicipalService) => void }) {
  const translations = (draft.translations ?? {}) as Partial<Record<TranslationLanguage, ServiceTranslation>>
  const update = (language: TranslationLanguage, patch: Partial<ServiceTranslation>) =>
    onChange({ ...draft, translations: { ...translations, [language]: { ...empty, ...translations[language], ...patch } } })
  return (
    <fieldset disabled={disabled} className="space-y-4">
      <legend className="font-semibold">Traductions</legend>
      <p className="text-sm text-muted-foreground">Facultatif. Le français fait foi ; sans traduction, le site affiche le texte français avec la mention « Non traduit ».</p>
      {(Object.keys(TRANSLATION_LANGUAGES) as TranslationLanguage[]).map((language) => {
        const { label, dir } = TRANSLATION_LANGUAGES[language]
        const value = translations[language] ?? empty
        return (
          <details key={language} className="rounded-lg border p-3" open={Boolean(value.name || value.summary)}>
            <summary className="cursor-pointer font-medium">{label}{value.name ? ` — ${value.name}` : " — non traduit"}</summary>
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`service-${language}-name`}>Nom ({label.toLowerCase()})</Label>
                <Input id={`service-${language}-name`} lang={language} dir={dir} maxLength={200} value={value.name} onChange={(event) => update(language, { name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`service-${language}-summary`}>Résumé ({label.toLowerCase()})</Label>
                <Textarea id={`service-${language}-summary`} lang={language} dir={dir} maxLength={1000} rows={2} value={value.summary} onChange={(event) => update(language, { summary: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`service-${language}-description`}>Description ({label.toLowerCase()})</Label>
                <Textarea id={`service-${language}-description`} lang={language} dir={dir} rows={3} value={value.description} onChange={(event) => update(language, { description: event.target.value })} />
              </div>
            </div>
          </details>
        )
      })}
    </fieldset>
  )
}
