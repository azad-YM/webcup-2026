import { defineMessages } from "../../core/i18n/locales"

/** Messages de la sobriété (L17) : état de la connexion, mode léger, brouillons de formulaire. */
export const SOBRIETY_MESSAGES = defineMessages({
  fr: {
    offline: "Hors ligne",
    offlineSince: "Hors ligne — informations du {date} à {time}",
    offlineNoDate: "Hors ligne — les informations affichées peuvent ne pas être à jour. Nous réessaierons dès le retour de la connexion.",
    slow: "La connexion est lente, nous réessayons…",
    slowWithCache: "La connexion est lente, nous réessayons… En attendant : informations du {date} à {time}.",
    back: "Connexion rétablie, les informations sont à jour.",
    suggestTitle: "Votre connexion semble lente ou en économie de données.",
    suggestText: "Le mode léger allège les pages : pas d’images décoratives ni d’animations, la carte remplacée par la liste, des mises à jour moins fréquentes.",
    suggestAccept: "Activer le mode léger",
    suggestDecline: "Non merci",
    degraded: "Le service est très sollicité : le mode léger est activé pour cette visite afin d’alléger les échanges.",
    degradedRestore: "Revenir à l’affichage complet",
    lightOn: "Mode léger activé. Vous pouvez le désactiver dans « Affichage ».",
    draftRestored: "Votre saisie précédente a été restaurée (brouillon enregistré sur cet appareil).",
    draftClear: "Effacer le brouillon",
    draftCleared: "Brouillon effacé.",
    close: "Fermer",
    mapLight: "Mode léger : la carte n’est pas chargée. La liste ci-dessous présente les mêmes lieux, avec leur adresse.",
    mapAnyway: "Afficher la carte quand même"
  },
  en: {
    offline: "Offline",
    offlineSince: "Offline — information from {date} at {time}",
    offlineNoDate: "Offline — the information shown may be out of date. We will try again as soon as the connection is back.",
    slow: "The connection is slow, we are trying again…",
    slowWithCache: "The connection is slow, we are trying again… Meanwhile: information from {date} at {time}.",
    back: "Connection restored, the information is up to date.",
    suggestTitle: "Your connection seems slow or in data saver mode.",
    suggestText: "Light mode makes pages lighter: no decorative images or animations, the map replaced by the list, less frequent updates.",
    suggestAccept: "Turn on light mode",
    suggestDecline: "No thanks",
    degraded: "The service is very busy: light mode is on for this visit to reduce traffic.",
    degradedRestore: "Back to the full display",
    lightOn: "Light mode is on. You can turn it off in “Display”.",
    draftRestored: "Your previous input has been restored (draft saved on this device).",
    draftClear: "Delete the draft",
    draftCleared: "Draft deleted.",
    close: "Close",
    mapLight: "Light mode: the map is not loaded. The list below shows the same places, with their address.",
    mapAnyway: "Show the map anyway"
  },
  ar: {
    offline: "غير متصل",
    offlineSince: "غير متصل — معلومات بتاريخ {date} الساعة {time}",
    offlineNoDate: "غير متصل — قد لا تكون المعلومات المعروضة محدّثة. سنحاول مجددًا فور عودة الاتصال.",
    slow: "الاتصال بطيء، نحاول مجددًا…",
    slowWithCache: "الاتصال بطيء، نحاول مجددًا… في الأثناء: معلومات بتاريخ {date} الساعة {time}.",
    back: "عاد الاتصال، المعلومات محدّثة.",
    suggestTitle: "يبدو أن اتصالك بطيء أو في وضع توفير البيانات.",
    suggestText: "الوضع الخفيف يجعل الصفحات أخف: بلا صور زخرفية ولا حركات، والقائمة بدل الخريطة، وتحديثات أقل تكرارًا.",
    suggestAccept: "تفعيل الوضع الخفيف",
    suggestDecline: "لا، شكرًا",
    degraded: "الخدمة مزدحمة جدًا: تم تفعيل الوضع الخفيف لهذه الزيارة لتخفيف التبادلات.",
    degradedRestore: "العودة إلى العرض الكامل",
    lightOn: "تم تفعيل الوضع الخفيف. يمكنك إيقافه من «العرض».",
    draftRestored: "تمت استعادة ما أدخلته سابقًا (مسودة محفوظة على هذا الجهاز).",
    draftClear: "حذف المسودة",
    draftCleared: "تم حذف المسودة.",
    close: "إغلاق",
    mapLight: "الوضع الخفيف: لم يتم تحميل الخريطة. تعرض القائمة أدناه الأماكن نفسها مع عناوينها.",
    mapAnyway: "عرض الخريطة رغم ذلك"
  }
})

/** « 04/10 » et « 14h32 » : format court demandé pour l’indication hors ligne. */
export function formatCachedAt(timestamp: number) {
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, "0")
  return { date: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`, time: `${pad(date.getHours())}h${pad(date.getMinutes())}` }
}
