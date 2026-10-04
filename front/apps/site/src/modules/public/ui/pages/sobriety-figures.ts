/**
 * Mesures avant / après du lot L17 (F57), produites par `node scripts/ecoindex.mjs` sur l’export `out/`.
 * Poids transféré compressé (gzip), en Ko ; requêtes du premier chargement ; score EcoIndex calculé localement.
 * Détail et méthode : `front/apps/site/doc/sobriete.md`.
 */
export type SobrietyFigure = { page: string; before: { kb: number; requests: number; score: number }; after: { kb: number; requests: number; score: number } }

export const SOBRIETY_MEASURED_ON = "4 octobre 2026"

export const SOBRIETY_FIGURES: SobrietyFigure[] = [
  { page: "Accueil", before: { kb: 257.6, requests: 20, score: 80 }, after: { kb: 212.2, requests: 18, score: 80 } },
  { page: "Services", before: { kb: 260.0, requests: 21, score: 85 }, after: { kb: 217.7, requests: 19, score: 85 } },
  { page: "Actualités", before: { kb: 253.5, requests: 20, score: 85 }, after: { kb: 206.7, requests: 17, score: 86 } },
  { page: "Urgences", before: { kb: 257.6, requests: 21, score: 82 }, after: { kb: 210.8, requests: 18, score: 82 } },
  { page: "Carte", before: { kb: 258.8, requests: 21, score: 83 }, after: { kb: 215.7, requests: 19, score: 84 } },
  { page: "Connexion", before: { kb: 260.6, requests: 21, score: 85 }, after: { kb: 213.4, requests: 18, score: 86 } },
  { page: "Espace citoyen", before: { kb: 255.0, requests: 20, score: 85 }, after: { kb: 215.3, requests: 18, score: 85 } }
]
