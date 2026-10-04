"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { MonitorSmartphone } from "@boilerplate/shared-ui/components/icon"
import { useConsumeLoginLinkMutation } from "../../core/application/rtk-api/auth"
import { SignInErrorCode, type SignInVerification } from "../../core/application/dto/auth.dto"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { ErrorState, LoadingState } from "@/modules/shared/ui/components/states"
import { SignInVerificationStep } from "../sections/sign-in-verification"

/**
 * D02 — `/connexion/lien?jeton=…` : échange le lien reçu par e-mail (avec le secret gardé par ce navigateur)
 * contre la session habituelle. Le jeton est retiré de l’adresse dès sa lecture ; aucun JWT dans l’URL.
 */
export function LoginLinkPage() {
  const router = useRouter()
  const session = useSession()
  const params = useSearchParams()
  const [consume, { error, isUninitialized }] = useConsumeLoginLinkMutation()
  const [verification, setVerification] = useState<SignInVerification | null>(null)
  const started = useRef(false)
  const token = params.get("jeton")
  const validToken = token !== null && /^[a-f0-9]{64}$/.test(token)

  useEffect(() => {
    if (!session.ready || started.current || !validToken) return
    started.current = true
    // Le jeton ne reste ni dans l’historique ni dans la barre d’adresse.
    window.history.replaceState(null, "", "/connexion/lien")
    consume(token).unwrap().then((result) => {
      if (result.status === "verification_required") setVerification(result.verification)
      else { session.refresh(); router.replace("/espace") }
    }).catch(() => { /* état d’erreur affiché ci-dessous */ })
  }, [session, validToken, token, consume, router])

  const failure = toQueryError(error)
  const otherBrowser = failure?.code === SignInErrorCode.otherBrowser
  return (
    <>
      <PageHeader trail={[{ label: "Connexion", href: "/connexion" }, { label: "Lien de connexion" }]} title="Connexion par lien" />
      <PageBody narrow>
        {verification ? (
          <SignInVerificationStep verification={verification} onSignedIn={() => { session.refresh(); router.replace("/espace") }} onRestart={() => router.replace("/connexion")} />
        ) : !validToken && isUninitialized ? (
          <ErrorState message="Ce lien de connexion est incomplet. Copiez l’adresse entière depuis l’e-mail, ou demandez un nouveau lien." />
        ) : failure ? (
          <div className="space-y-6">
            {otherBrowser ? (
              <div role="alert" className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-slate-900 sm:p-8">
                <MonitorSmartphone className="size-8 text-amber-800" aria-hidden="true" />
                <h2 className="mt-4 text-xl font-semibold">Ouvrez ce lien dans le navigateur de votre demande</h2>
                <p className="mt-2">{failure.data}</p>
                <p className="mt-2">Par sécurité, un lien de connexion ne fonctionne que dans le navigateur qui l’a demandé : un lien transféré ou intercepté ne permet pas d’entrer dans votre compte.</p>
              </div>
            ) : (
              <ErrorState message={failure.data} />
            )}
            <Link href="/connexion" className="inline-flex rounded-xl bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">Demander un nouveau lien depuis cet appareil</Link>
          </div>
        ) : (
          <LoadingState label="Connexion en cours…" />
        )}
      </PageBody>
    </>
  )
}
