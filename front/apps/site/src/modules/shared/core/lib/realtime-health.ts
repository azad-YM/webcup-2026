/**
 * F95 : état du flux temps réel de l’onglet. Quand il est ouvert, les mises à jour arrivent par lui ;
 * les rafraîchissements de secours (`polling`) peuvent alors s’espacer au lieu de doubler les requêtes.
 */
let live = false

export const isRealtimeLive = () => live

export function setRealtimeLive(open: boolean) {
  live = open
}
