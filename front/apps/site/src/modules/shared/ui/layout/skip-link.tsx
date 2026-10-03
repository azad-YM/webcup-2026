export const MAIN_CONTENT_ID = "contenu"

/** Premier élément focalisable de chaque page : permet d’aller directement au contenu. */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only rounded-lg bg-white px-4 py-3 font-medium text-slate-950 shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
    >
      Aller au contenu
    </a>
  )
}
