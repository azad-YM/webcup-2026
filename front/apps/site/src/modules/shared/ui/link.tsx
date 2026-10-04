import NextLink from "next/link"
import type { ComponentProps } from "react"

/**
 * F95 : lien interne du site, sans préchargement automatique. Le `Link` de Next.js télécharge à l’avance la page
 * de chaque lien visible à l’écran (en-tête, pied de page, cartes : une vingtaine de requêtes par page, pour des
 * pages rarement ouvertes). Ici la page n’est chargée qu’au clic ; la navigation reste côté client.
 */
function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />
}

export default Link as typeof NextLink
