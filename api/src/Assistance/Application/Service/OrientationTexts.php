<?php

declare(strict_types=1);

namespace Assistance\Application\Service;

/**
 * Phrases du repli local de l'assistant (F91, F92), dans les trois langues de l'interface (fr, en, ar).
 * `{service}`, `{other}` et `{numbers}` sont remplacés à l'emploi.
 */
final class OrientationTexts
{
    /** @var array<string, array<string, string>> */
    private const TEXTS = [
        'fr' => [
            'emergency.medical' => 'Cela ressemble à une urgence médicale. Appelez tout de suite le {numbers}. Ne restez pas seul : ces numéros sont gratuits et répondent jour et nuit.',
            'emergency.fire' => 'Cela ressemble à un incendie ou à un danger immédiat. Mettez-vous à l’abri et appelez tout de suite le {numbers}.',
            'emergency.danger' => 'Si vous êtes en danger, appelez tout de suite le {numbers}. Mettez-vous en sécurité d’abord.',
            'emergency.model' => 'Votre situation semble urgente. Appelez tout de suite le {numbers}.',
            'information' => 'Le service « {service} » s’occupe de cela. Sa fiche donne le lieu, les horaires et les démarches.',
            'request' => 'Vous pouvez prévenir le service « {service} » en faisant une demande : le formulaire est déjà préparé, il vous reste à décrire le problème.',
            'contact' => 'Le service « {service} » peut vous répondre. Vous pouvez lui poser votre question par une demande, ou consulter sa fiche.',
            'appointment' => 'Vous pouvez prendre rendez-vous avec le service « {service} », ou consulter d’abord sa fiche.',
            'disabled' => 'Attention : ce service est momentanément fermé. Sa fiche explique quoi faire en attendant.',
            'disrupted' => 'Attention : ce service est perturbé en ce moment. Sa fiche donne les détails.',
            'choice' => 'Je pense à deux services : « {service} » ou « {other} ». Lequel correspond le mieux à votre besoin ?',
            'unclear' => 'Je n’ai pas bien compris votre besoin. Pouvez-vous préciser le sujet ? Par exemple :',
            'welcome' => 'Vous venez d’arriver ? La page « Bienvenue » explique les premières démarches.',
            'participation' => 'Pour proposer une idée ou donner votre avis, allez dans « Participer ».',
            'theme.papers' => 'Papiers et démarches',
            'theme.health' => 'Santé',
            'theme.transport' => 'Transports',
            'theme.housing' => 'Logement',
            'theme.waste' => 'Déchets et propreté',
            'theme.school' => 'École et enfants',
        ],
        'en' => [
            'emergency.medical' => 'This sounds like a medical emergency. Call {numbers} right now. These numbers are free and answer day and night.',
            'emergency.fire' => 'This sounds like a fire or an immediate danger. Get to safety and call {numbers} right now.',
            'emergency.danger' => 'If you are in danger, call {numbers} right now. Get to safety first.',
            'emergency.model' => 'Your situation seems urgent. Call {numbers} right now.',
            'information' => 'The “{service}” service handles this. Its page gives the address, opening hours and procedures.',
            'request' => 'You can tell the “{service}” service by sending a request: the form is ready, you only need to describe the problem.',
            'contact' => 'The “{service}” service can answer you. You can ask your question with a request, or read its page.',
            'appointment' => 'You can book an appointment with the “{service}” service, or read its page first.',
            'disabled' => 'Please note: this service is temporarily closed. Its page explains what to do in the meantime.',
            'disrupted' => 'Please note: this service is disrupted at the moment. Its page gives the details.',
            'choice' => 'I am thinking of two services: “{service}” or “{other}”. Which one fits your need best?',
            'unclear' => 'I did not quite understand your need. Could you tell me the topic? For example:',
            'welcome' => 'Just arrived? The “Welcome” page explains the first steps.',
            'participation' => 'To suggest an idea or give your opinion, go to “Take part”.',
            'theme.papers' => 'Papers and ID',
            'theme.health' => 'Health',
            'theme.transport' => 'Transport',
            'theme.housing' => 'Housing',
            'theme.waste' => 'Waste and cleanliness',
            'theme.school' => 'School and children',
        ],
        'ar' => [
            'emergency.medical' => 'يبدو أن هذه حالة طبية طارئة. اتصل فوراً بالرقم {numbers}. هذه الأرقام مجانية وتجيب ليلاً ونهاراً.',
            'emergency.fire' => 'يبدو أن هناك حريقاً أو خطراً فورياً. ابتعد إلى مكان آمن واتصل فوراً بالرقم {numbers}.',
            'emergency.danger' => 'إذا كنت في خطر، اتصل فوراً بالرقم {numbers}. ابحث عن مكان آمن أولاً.',
            'emergency.model' => 'يبدو أن وضعك عاجل. اتصل فوراً بالرقم {numbers}.',
            'information' => 'خدمة «{service}» مسؤولة عن هذا. صفحتها تعرض العنوان والمواعيد والإجراءات.',
            'request' => 'يمكنك إبلاغ خدمة «{service}» بإرسال طلب: النموذج جاهز، ويكفي أن تصف المشكلة.',
            'contact' => 'يمكن لخدمة «{service}» أن تجيبك. أرسل سؤالك في طلب أو اطّلع على صفحتها.',
            'appointment' => 'يمكنك حجز موعد مع خدمة «{service}»، أو الاطلاع على صفحتها أولاً.',
            'disabled' => 'تنبيه: هذه الخدمة مغلقة مؤقتاً. صفحتها تشرح ما يمكن فعله في الأثناء.',
            'disrupted' => 'تنبيه: هذه الخدمة مضطربة حالياً. صفحتها تعطي التفاصيل.',
            'choice' => 'أفكر في خدمتين: «{service}» أو «{other}». أيهما يناسب حاجتك أكثر؟',
            'unclear' => 'لم أفهم حاجتك جيداً. هل يمكنك تحديد الموضوع؟ مثلاً:',
            'welcome' => 'وصلت حديثاً؟ صفحة «مرحباً» تشرح الخطوات الأولى.',
            'participation' => 'لاقتراح فكرة أو إبداء رأيك، اذهب إلى «شارك».',
            'theme.papers' => 'وثائق وإجراءات',
            'theme.health' => 'صحة',
            'theme.transport' => 'نقل',
            'theme.housing' => 'سكن',
            'theme.waste' => 'نفايات ونظافة',
            'theme.school' => 'مدرسة وأطفال',
        ],
    ];

    /** @param array<string, string> $values */
    public static function get(string $language, string $key, array $values = []): string
    {
        $text = self::TEXTS[$language][$key] ?? self::TEXTS['fr'][$key] ?? $key;

        return strtr($text, array_combine(array_map(fn (string $name) => '{'.$name.'}', array_keys($values)), array_values($values)));
    }

    /** @return list<string> thèmes proposés quand la demande est floue (réponses rapides) */
    public static function themes(string $language): array
    {
        return array_map(
            fn (string $theme) => self::get($language, 'theme.'.$theme),
            ['papers', 'health', 'transport', 'housing', 'waste', 'school'],
        );
    }
}
