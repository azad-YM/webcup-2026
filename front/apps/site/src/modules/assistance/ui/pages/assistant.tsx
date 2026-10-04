"use client"
import { lazy, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { LoadingState } from "@/modules/shared/ui/components/states"
import { useMessages } from "@/modules/shared/ui/i18n/i18n-provider"
import { ASSISTANT_MESSAGES } from "../i18n/assistant-messages"

const AssistantConversation = lazy(() => import("../sections/assistant-conversation"))

/** `/aide/assistant` (F91, F92) ; `?q=` préremplit le premier message (depuis la recherche des services). */
export function AssistantPage() {
  const t = useMessages(ASSISTANT_MESSAGES)
  const initialText = useSearchParams().get("q") ?? ""
  return (
    <>
      <PageHeader trail={[{ label: t.trailHelp }, { label: t.title }]} title={t.title} lead={t.lead} />
      <PageBody narrow>
        <section aria-label={t.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <Suspense fallback={<LoadingState label="…" />}>
            <AssistantConversation initialText={initialText} />
          </Suspense>
        </section>
      </PageBody>
    </>
  )
}
