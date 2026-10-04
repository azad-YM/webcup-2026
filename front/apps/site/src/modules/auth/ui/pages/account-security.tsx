"use client"
import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "@/modules/shared/ui/link"
import type { Route } from "next"
import { KeyRound, LogIn, MailCheck, MonitorSmartphone, ShieldAlert, ShieldCheck } from "@boilerplate/shared-ui/components/icon"
import { StatusBadge } from "@boilerplate/shared-ui/components/a11y"
import { useSession } from "@/modules/shared/ui/store-provider"
import { toQueryError } from "@/modules/shared/core/lib/use-cases.decorator"
import { PageBody, PageHeader } from "@/modules/shared/ui/layout/page-header"
import { FormAnnouncement, TextField } from "@/modules/shared/ui/components/form-field"
import { ErrorState, LoadingState, SkeletonCards } from "@/modules/shared/ui/components/states"
import {
  useChangePasswordMutation,
  useGetAccountSecurityQuery,
  useReportDeviceMutation,
  useSendReconfirmationCodeMutation,
  useSetEmailVerificationMutation
} from "../../core/application/rtk-api/auth"
import type { AccountSecurity, KnownDevice, ReconfirmationCode } from "../../core/application/dto/auth.dto"

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" })
const formatDate = (value: string) => dateTime.format(new Date(value))
const card = "rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"
const primary = "rounded-xl bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
const secondary = "rounded-xl border border-slate-300 px-4 py-3 font-medium hover:bg-slate-50 disabled:opacity-60"

/** « Sécurité du compte » (F53, F54) : vérification supplémentaire, appareils, connexions récentes, mot de passe. */
export function AccountSecurityPage() {
  const { ready, hasToken, logout } = useSession()
  const query = useGetAccountSecurityQuery(undefined, { skip: !ready || !hasToken })
  const error = toQueryError(query.error)
  useEffect(() => { if (error?.status === 401) logout() }, [error?.status, logout])
  const [reported, setReported] = useState(false)
  const passwordSection = useRef<HTMLElement>(null)
  return (
    <>
      <PageHeader
        trail={[{ label: "Mon espace", href: "/espace" }, { label: "Sécurité du compte" }]}
        title="Sécurité du compte"
        lead="Choisissez comment protéger votre compte et vérifiez les appareils qui l’utilisent."
      />
      <PageBody narrow>
        {!ready ? <LoadingState label="Vérification de votre session…" /> : !hasToken ? (
          <div className={card} role="status">
            <LogIn className="size-8 text-teal-700" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold">Connectez-vous pour gérer la sécurité de votre compte</h2>
            <Link href={"/connexion?retour=/espace/securite" as Route} className={`mt-6 inline-flex ${primary}`}>Se connecter</Link>
          </div>
        ) : query.isLoading ? (
          <LoadingState label="Chargement de la sécurité du compte…"><SkeletonCards count={3} /></LoadingState>
        ) : error && error.status !== 401 ? (
          <ErrorState message={error.data} onRetry={() => void query.refetch()} retrying={query.isFetching} />
        ) : query.data ? (
          <div className="space-y-8">
            {reported && (
              <FormAnnouncement tone="success">
                <p className="font-semibold">Toutes les autres sessions ont été fermées.</p>
                <p className="mt-1">Changez maintenant votre mot de passe ci-dessous : la personne qui l’a utilisé ne pourra plus se connecter. Si vous avez activé la vérification par e-mail, elle continue de vous protéger.</p>
              </FormAnnouncement>
            )}
            <EmailVerificationCard security={query.data} />
            <DevicesCard devices={query.data.devices} onReported={() => { setReported(true); passwordSection.current?.scrollIntoView({ block: "start" }); passwordSection.current?.querySelector("input")?.focus() }} />
            <ChangePasswordCard sectionRef={passwordSection} highlighted={reported} />
            <RecentSignIns security={query.data} />
          </div>
        ) : null}
      </PageBody>
    </>
  )
}

/** Code de confirmation envoyé par e-mail, réutilisé pour activer ou désactiver la vérification. */
function CodeSender({ onSent }: { onSent: (code: ReconfirmationCode) => void }) {
  const [send, { isLoading, error }] = useSendReconfirmationCodeMutation()
  const failure = toQueryError(error)
  return (
    <div className="space-y-3">
      <button type="button" disabled={isLoading} onClick={() => void send().unwrap().then(onSent).catch(() => undefined)} className={secondary}>
        {isLoading ? "Envoi…" : "Recevoir un code par e-mail"}
      </button>
      <FormAnnouncement tone="error">{failure?.data}</FormAnnouncement>
    </div>
  )
}

function EmailVerificationCard({ security }: { security: AccountSecurity }) {
  const [save, { isLoading, error, reset }] = useSetEmailVerificationMutation()
  const [step, setStep] = useState<"idle" | "confirm">("idle")
  const [sent, setSent] = useState<ReconfirmationCode | null>(null)
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [done, setDone] = useState<string | null>(null)
  const enabled = security.emailVerificationEnabled
  const failure = toQueryError(error)

  function close() { setStep("idle"); setSent(null); setCode(""); setPassword(""); reset() }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const proof = sent && code ? { challengeId: sent.challengeId, code } : { password }
    try {
      await save({ enabled: !enabled, ...proof }).unwrap()
      setDone(enabled ? "La vérification supplémentaire est désactivée." : "La vérification supplémentaire est activée : un code vous sera demandé à chaque connexion depuis un appareil qui n’est pas de confiance.")
      close()
    } catch { setCode(""); setPassword("") }
  }

  return (
    <section aria-labelledby="titre-verification-supplementaire" className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="titre-verification-supplementaire" className="flex items-center gap-2 text-xl font-semibold"><MailCheck className="size-6 text-teal-700" aria-hidden="true" /> Vérification supplémentaire</h2>
        <StatusBadge tone={enabled ? "success" : "neutral"} srPrefix="État : " label={enabled ? "Activée" : "Désactivée"} />
      </div>
      <p className="mt-3 text-slate-700">
        Après votre mot de passe ou votre lien de connexion, un code à 6 chiffres est envoyé à votre adresse e-mail.
        Même si quelqu’un connaît votre mot de passe, il ne peut pas entrer sans ce code.
      </p>
      <FormAnnouncement tone="success">{done}</FormAnnouncement>
      {!security.emailAvailable ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-slate-800">Votre compte n’a pas d’adresse e-mail : la vérification par e-mail n’est pas disponible. Adressez-vous à l’accueil de la mairie pour en ajouter une.</p>
      ) : step === "idle" ? (
        <button type="button" onClick={() => { setDone(null); setStep("confirm") }} className={`mt-5 ${enabled ? secondary : primary}`}>
          {enabled ? "Désactiver la vérification" : "Activer la vérification"}
        </button>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-4" noValidate>
          <p className="text-slate-800">
            {enabled
              ? "Pour désactiver la vérification, confirmez qu’il s’agit bien de vous : saisissez votre mot de passe, ou demandez un code par e-mail."
              : `Pour vérifier que les messages vous parviennent, nous envoyons un code à ${security.emailHint}. Saisissez-le pour activer la vérification.`}
          </p>
          {enabled && !sent && (
            <TextField id="verification-mot-de-passe" label="Mot de passe" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          )}
          {!sent ? <CodeSender onSent={setSent} /> : (
            <TextField id="verification-code" label={`Code reçu à ${sent.emailHint}`} hint="6 chiffres, valable 10 minutes." inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
          )}
          <FormAnnouncement tone="error">{failure?.data}</FormAnnouncement>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={isLoading || (sent ? code.length !== 6 : !password)} className={primary}>
              {isLoading ? "Enregistrement…" : enabled ? "Désactiver" : "Activer"}
            </button>
            <button type="button" onClick={close} className={secondary}>Annuler</button>
          </div>
        </form>
      )}
      <p className="mt-4 text-sm text-slate-600">Codes de secours (pour un accès sans e-mail) : non proposés pour le moment. En cas de perte d’accès à votre messagerie, adressez-vous à l’accueil de la mairie.</p>
    </section>
  )
}

function DevicesCard({ devices, onReported }: { devices: KnownDevice[]; onReported: () => void }) {
  const [report, { isLoading, error }] = useReportDeviceMutation()
  const [confirming, setConfirming] = useState<string | null>(null)
  const failure = toQueryError(error)
  return (
    <section aria-labelledby="titre-appareils" className={card}>
      <h2 id="titre-appareils" className="flex items-center gap-2 text-xl font-semibold"><MonitorSmartphone className="size-6 text-teal-700" aria-hidden="true" /> Appareils reconnus</h2>
      <p className="mt-3 text-slate-700">Les navigateurs depuis lesquels votre compte a été utilisé. Lors d’une connexion depuis un nouvel appareil, vous êtes prévenu par e-mail et dans vos notifications.</p>
      <FormAnnouncement tone="error">{failure?.data}</FormAnnouncement>
      {devices.length === 0 ? <p className="mt-4 text-slate-700">Aucun appareil enregistré pour le moment : ils apparaîtront à votre prochaine connexion.</p> : (
        <ul className="mt-5 divide-y divide-slate-200">
          {devices.map((device) => (
            <li key={device.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-950">
                  {device.label} {device.current && <StatusBadge tone="info" label="Cet appareil" />}
                </p>
                <p className="text-sm text-slate-600">Dernière utilisation le {formatDate(device.lastUsedAt)} · première le {formatDate(device.firstSeenAt)}</p>
                {device.trusted && device.trustedUntil && <p className="text-sm text-slate-600">Appareil de confiance jusqu’au {formatDate(device.trustedUntil)} (le code n’y est pas redemandé).</p>}
              </div>
              {!device.current && (confirming === device.id ? (
                <div className="flex flex-wrap gap-2" role="group" aria-label={`Confirmer pour ${device.label}`}>
                  <button type="button" disabled={isLoading} onClick={() => void report(device.id).unwrap().then(() => { setConfirming(null); onReported() }).catch(() => undefined)} className="rounded-xl bg-red-800 px-4 py-2 font-medium text-white disabled:opacity-60">
                    {isLoading ? "Déconnexion…" : "Oui, déconnecter partout"}
                  </button>
                  <button type="button" onClick={() => setConfirming(null)} className="rounded-xl border border-slate-300 px-4 py-2 font-medium">Annuler</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirming(device.id)} className="inline-flex items-center gap-2 rounded-xl border border-red-700 px-4 py-2 font-medium text-red-800 hover:bg-red-50">
                  <ShieldAlert className="size-4" aria-hidden="true" /> Ce n’était pas moi
                </button>
              ))}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-sm text-slate-600">« Ce n’était pas moi » ferme toutes les sessions ouvertes sur les autres appareils, retire la confiance accordée aux appareils et vous invite à changer votre mot de passe.</p>
    </section>
  )
}

function ChangePasswordCard({ sectionRef, highlighted }: { sectionRef: React.RefObject<HTMLElement | null>; highlighted: boolean }) {
  const [change, { isLoading, error, isSuccess, reset }] = useChangePasswordMutation()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const failure = toQueryError(error)
  const tooShort = next.length > 0 && new TextEncoder().encode(next).length < 8
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (tooShort || !current || !next) return
    try {
      await change({ currentPassword: current, newPassword: next }).unwrap()
    } finally { setCurrent(""); setNext("") }
  }
  return (
    <section ref={sectionRef} aria-labelledby="titre-mot-de-passe" className={`${card} ${highlighted ? "border-amber-400 ring-2 ring-amber-200" : ""}`}>
      <h2 id="titre-mot-de-passe" className="flex items-center gap-2 text-xl font-semibold"><KeyRound className="size-6 text-teal-700" aria-hidden="true" /> Changer mon mot de passe</h2>
      <p className="mt-3 text-slate-700">Les sessions ouvertes sur vos autres appareils seront fermées ; vous restez connecté ici.</p>
      <form onSubmit={(event) => void submit(event).catch(() => undefined)} className="mt-5 space-y-4" noValidate onChange={() => { if (isSuccess) reset() }}>
        <TextField id="mot-de-passe-actuel" label="Mot de passe actuel" type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} />
        <TextField id="nouveau-mot-de-passe" label="Nouveau mot de passe" hint="8 caractères au moins." type="password" autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} error={tooShort ? "Le mot de passe doit contenir au moins 8 caractères." : undefined} />
        <FormAnnouncement tone={failure ? "error" : "success"}>{failure ? failure.data : isSuccess ? "Votre mot de passe a été changé. Les autres sessions sont fermées." : null}</FormAnnouncement>
        <button type="submit" disabled={isLoading || !current || !next || tooShort} className={primary}>{isLoading ? "Enregistrement…" : "Changer le mot de passe"}</button>
      </form>
    </section>
  )
}

function RecentSignIns({ security }: { security: AccountSecurity }) {
  return (
    <section aria-labelledby="titre-connexions" className={card}>
      <h2 id="titre-connexions" className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="size-6 text-teal-700" aria-hidden="true" /> Connexions récentes</h2>
      {security.recentSignIns.length === 0 ? <p className="mt-3 text-slate-700">Aucune connexion enregistrée pour le moment.</p> : (
        <ul className="mt-4 space-y-3">
          {security.recentSignIns.map((event) => (
            <li key={event.at + event.ip} className="rounded-xl bg-slate-50 p-4">
              <p className="font-medium text-slate-950">{formatDate(event.at)} — {event.deviceLabel}</p>
              <p className="text-sm text-slate-700">
                {event.method === "link" ? "Lien reçu par e-mail" : "Mot de passe"}{event.secondFactor ? " + code e-mail" : ""} · adresse IP <span dir="ltr">{event.ip}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
