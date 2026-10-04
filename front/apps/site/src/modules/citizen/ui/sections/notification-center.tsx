"use client"
import { useEffect, useId, useRef, useState } from "react"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import Link from "@/modules/shared/ui/link"
import type { Route } from "next"
import { Bell } from "@boilerplate/shared-ui/components/icon"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { ErrorState, LoadingState } from "@/modules/shared/ui/components/states"
import { NOTIFICATIONS_POLLING_MS, useListMyNotificationsQuery, useMarkNotificationsReadMutation } from "../../core/application/rtk-api/notifications"
import { NOTIFICATION_KIND_LABELS, safeLink, type CitizenNotification } from "../../core/domain/notification"
import { formatDateTime } from "../../core/domain/service-request"

/** Annonce visible et vocalisée d'une notification arrivée pendant que la page est ouverte. */
function useFreshNotification(items: CitizenNotification[] | undefined) {
  const known = useRef<Set<string> | null>(null)
  const [fresh, setFresh] = useState<CitizenNotification | null>(null)
  useEffect(() => {
    if (!items) return
    if (known.current === null) {
      known.current = new Set(items.map((item) => item.id))
      return
    }
    const arrived = items.find((item) => !item.readAt && !known.current?.has(item.id))
    for (const item of items) known.current.add(item.id)
    if (arrived) setFresh(arrived)
  }, [items])
  return [fresh, () => setFresh(null)] as const
}

/**
 * Centre de notifications de l'espace citoyen (F49, F40, F51) : changements d'état des demandes, rappels de
 * rendez-vous, réponses aux inquiétudes. Mis à jour par le flux temps réel, avec un rafraîchissement de secours.
 */
export function NotificationCenter({ onNavigate }: { onNavigate?: () => void }) {
  const headingId = useId()
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const query = useListMyNotificationsQuery(undefined, polling(NOTIFICATIONS_POLLING_MS))
  const [markRead, marking] = useMarkNotificationsReadMutation()
  const [fresh, dismiss] = useFreshNotification(query.data?.items)
  const failure = toQueryError(query.error)
  const inbox = query.data
  const items = inbox?.items.filter((item) => filter === "all" || (filter === "read" ? Boolean(item.readAt) : !item.readAt)) ?? []
  if (failure?.status === 401) return null
  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="size-5 text-teal-700" aria-hidden="true" /> Mes notifications
          {inbox && inbox.unreadCount > 0 && (
            <span className="rounded-full bg-teal-700 px-2.5 py-0.5 text-sm font-semibold text-white">
              {inbox.unreadCount}<span className="sr-only"> non lue{inbox.unreadCount > 1 ? "s" : ""}</span>
            </span>
          )}
        </h2>
        {inbox && inbox.unreadCount > 0 && (
          <button type="button" disabled={marking.isLoading} onClick={() => void markRead([])} className="rounded-lg px-3 py-2 font-medium text-teal-800 underline underline-offset-4 hover:bg-teal-50 disabled:opacity-60">
            Tout marquer comme lu
          </button>
        )}
      </div>
      <div className="mt-4 flex gap-2" role="group" aria-label="Filtrer les notifications">
        {([['all', 'Toutes'], ['unread', 'Non lues'], ['read', 'Lues']] as const).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-sm font-medium ${filter === value ? "bg-teal-50 text-teal-900" : "text-slate-700 hover:bg-slate-100"}`}>{label}</button>
        ))}
      </div>
      {marking.error && <p role="alert" className="mt-3 text-sm text-red-800">Impossible de marquer les notifications comme lues. Réessayez.</p>}
      <div role="status" aria-live="polite">
        {fresh && (
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-teal-300 bg-teal-50 p-4">
            <p className="text-slate-900"><span className="font-semibold">Nouveau : </span>{fresh.message}</p>
            <button type="button" onClick={dismiss} className="text-sm font-medium text-teal-900 underline underline-offset-4">Masquer</button>
          </div>
        )}
      </div>
      <div className="mt-4">
        {query.isLoading ? (
          <LoadingState label="Chargement de vos notifications…" />
        ) : failure && !inbox ? (
          <ErrorState message={failure.data} onRetry={() => void query.refetch()} retrying={query.isFetching} />
        ) : items.length === 0 ? (
          <p className="text-slate-700">{filter === "unread" ? "Aucune notification non lue." : filter === "read" ? "Aucune notification lue." : "Aucune notification pour le moment."}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => {
              const link = safeLink(item.link)
              return (
                <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div>
                    <p className="text-sm text-slate-600">
                      {NOTIFICATION_KIND_LABELS[item.kind] ?? "Information"} · <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                      {item.readAt && <span className="ml-2 text-xs font-medium text-slate-600">Lue</span>}
                      {!item.readAt && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">Non lue</span>}
                    </p>
                    <p className={item.readAt ? "text-slate-800" : "font-semibold text-slate-950"}>{item.message}</p>
                  </div>
                  {link && (
                    <Link
                      href={link as Route}
                      onClick={() => { if (!item.readAt) void markRead([item.id]); onNavigate?.() }}
                      className="shrink-0 font-medium text-teal-800 underline underline-offset-4"
                    >
                      Voir le détail<span className="sr-only"> : {item.title}</span>
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
