import type { ResidentLanguage, WelcomedResident } from "../../core/domain/citizen-account"

/** Textes de la fiche remise à l’habitant (F71), dans sa langue : français, anglais ou arabe. */
const SHEET = {
  fr: {
    title: "Bienvenue à Nova Terra",
    hello: "Bonjour {name}, votre compte d’habitant est prêt.",
    identifier: "Votre identifiant d’habitant",
    code: "Votre code d’accès provisoire",
    codeHint: "À changer lors de votre première connexion.",
    howTitle: "Comment vous connecter",
    steps: [
      "Ouvrez le site {site} et choisissez « Connexion ».",
      "Choisissez « Je n’ai pas d’adresse e-mail ».",
      "Saisissez votre identifiant d’habitant et votre code provisoire.",
      "Choisissez votre nouveau code personnel (8 caractères au moins) et gardez-le pour vous."
    ],
    startTitle: "Par où commencer",
    start: "Sur la page {welcome}, répondez à quelques questions : le site vous indique les services utiles et vos premières démarches.",
    emergency: "Urgences : 15 (médical), 17 (police), 18 (pompiers), 112 (tout téléphone).",
    private: "Gardez cette fiche pour vous : ne communiquez jamais votre code, même à un agent.",
    help: "Une question ? Accueil de l’hôtel de ville, dôme central, du lundi au vendredi de 8 h 30 à 17 h."
  },
  en: {
    title: "Welcome to Nova Terra",
    hello: "Hello {name}, your resident account is ready.",
    identifier: "Your resident identifier",
    code: "Your temporary access code",
    codeHint: "You will change it the first time you log in.",
    howTitle: "How to log in",
    steps: [
      "Open the website {site} and choose “Log in”.",
      "Choose “I don’t have an email address”.",
      "Enter your resident identifier and your temporary code.",
      "Choose your own new code (at least 8 characters) and keep it to yourself."
    ],
    startTitle: "Where to start",
    start: "On the page {welcome}, answer a few questions: the website shows you the useful services and your first steps.",
    emergency: "Emergency: 15 (medical), 17 (police), 18 (fire brigade), 112 (any phone).",
    private: "Keep this sheet private: never give your code to anyone, not even to a city agent.",
    help: "Any question? Town hall reception, central dome, Monday to Friday, 8:30 am to 5 pm."
  },
  ar: {
    title: "مرحباً بك في نوفا تيرا",
    hello: "مرحباً {name}، حسابك كمقيم جاهز.",
    identifier: "معرّف المقيم الخاص بك",
    code: "رمز الدخول المؤقت",
    codeHint: "ستقوم بتغييره عند أول تسجيل دخول.",
    howTitle: "كيفية تسجيل الدخول",
    steps: [
      "افتح الموقع {site} واختر «تسجيل الدخول».",
      "اختر «ليس لدي عنوان بريد إلكتروني».",
      "أدخل معرّف المقيم والرمز المؤقت.",
      "اختر رمزك الشخصي الجديد (8 أحرف على الأقل) واحتفظ به لنفسك."
    ],
    startTitle: "من أين تبدأ",
    start: "في الصفحة {welcome}، أجب عن بعض الأسئلة: يدلّك الموقع على الخدمات المفيدة وخطواتك الأولى.",
    emergency: "الطوارئ: 15 (طبية)، 17 (الشرطة)، 18 (الإطفاء)، 112 (من أي هاتف).",
    private: "احتفظ بهذه الورقة لنفسك: لا تعطِ رمزك لأي أحد، ولا حتى لموظف البلدية.",
    help: "هل لديك سؤال؟ استقبال مقر البلدية، القبة المركزية، من الاثنين إلى الجمعة من 8:30 إلى 17:00."
  }
} satisfies Record<ResidentLanguage, unknown>

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)

/** Fiche imprimable remise à l’habitant : identifiant et code affichés une seule fois. */
export function WelcomeSheet({ resident, siteUrl }: { resident: WelcomedResident; siteUrl: string }) {
  const language = resident.preferredLanguage
  const text = SHEET[language]
  const dir = language === "ar" ? "rtl" : "ltr"
  const name = [resident.firstName, resident.lastName].filter(Boolean).join(" ")
  const site = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
  return (
    <article lang={language} dir={dir} className="nt-welcome-sheet space-y-4 rounded-xl border-2 border-slate-900 bg-white p-6 text-slate-950">
      <h2 className="text-2xl font-bold">{text.title}</h2>
      <p className="text-lg">{fill(text.hello, { name })}</p>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-400 p-4">
          <dt className="font-semibold">{text.identifier}</dt>
          <dd className="mt-2 font-mono text-3xl font-bold tracking-wider" dir="ltr">{resident.residentId}</dd>
        </div>
        <div className="rounded-lg border border-slate-400 p-4">
          <dt className="font-semibold">{text.code}</dt>
          <dd className="mt-2 font-mono text-3xl font-bold tracking-wider" dir="ltr">{resident.accessCode}</dd>
          <dd className="mt-1 text-sm">{text.codeHint}</dd>
        </div>
      </dl>
      <section>
        <h3 className="text-lg font-semibold">{text.howTitle}</h3>
        <ol className="mt-2 list-decimal space-y-1 ps-6">
          {text.steps.map((step) => <li key={step}>{fill(step, { site: `⁦${site}/connexion⁩` })}</li>)}
        </ol>
      </section>
      <section>
        <h3 className="text-lg font-semibold">{text.startTitle}</h3>
        <p className="mt-2">{fill(text.start, { welcome: `⁦${site}/bienvenue⁩` })}</p>
      </section>
      <p className="font-semibold">{text.emergency}</p>
      <p className="rounded-lg bg-slate-100 p-3 font-semibold">{text.private}</p>
      <p className="text-sm">{text.help}</p>
    </article>
  )
}
