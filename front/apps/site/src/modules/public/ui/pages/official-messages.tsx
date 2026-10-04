"use client"
import { polling } from "@/modules/shared/ui/sobriety/polling"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { EmptyState, ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import { ALERTS_POLLING_MS, useListOfficialMessagesQuery } from "../../core/application/rtk-api/alerts"
import { OfficialMessageNotice } from "../sections/alerts"

/** F73 : archive des messages officiels du Haut Conseil, du plus récent au plus ancien. */
export function OfficialMessagesPage() {
  const { data, error, isFetching, refetch } = useListOfficialMessagesQuery(undefined, polling(ALERTS_POLLING_MS))
  return (
    <>
      <PageHeader trail={[{ label: "Messages officiels" }]} title="Messages officiels du Haut Conseil" lead="Les messages publiés par le Haut Conseil de Nova Terra pour tous les habitants, avec leur date et leur signataire." />
      <PageBody>
        {error ? (
          <ErrorState message={toQueryError(error)?.data ?? "Impossible de charger les messages officiels."} onRetry={() => void refetch()} retrying={isFetching} />
        ) : !data ? (
          <LoadingState label="Chargement des messages officiels"><SkeletonCards count={2} /></LoadingState>
        ) : data.length === 0 ? (
          <EmptyState title="Aucun message officiel publié pour le moment." />
        ) : (
          <ol className="max-w-3xl space-y-5">
            {data.map((message) => (
              <li key={message.id}>
                <p className="mb-1 text-sm font-medium text-slate-700">{message.active ? "En cours" : "Archivé"}</p>
                <OfficialMessageNotice alert={message} read={false} />
              </li>
            ))}
          </ol>
        )}
      </PageBody>
    </>
  )
}
