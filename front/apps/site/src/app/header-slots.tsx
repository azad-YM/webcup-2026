"use client"
import dynamic from "next/dynamic"

/**
 * Emplacements de l’en-tête composés dans `layout.tsx` (L17, F58/F61) : la cloche des notifications (citizen)
 * et la liste des espaces (auth) ne s’affichent que pour une personne connectée. Chargés à la demande, leur
 * code (fenêtre surgissante, requêtes) n’est pas téléchargé par les visiteurs.
 */
export const HeaderNotifications = dynamic(
  () => import("@/modules/citizen/ui/sections/notification-bell").then((module) => module.NotificationBell),
  { ssr: false, loading: () => <span className="inline-block size-10 shrink-0" aria-hidden="true" /> }
)

export const HeaderSpaces = dynamic(
  () => import("@/modules/auth/ui/components/spaces-list").then((module) => module.SpacesList),
  { ssr: false }
)
