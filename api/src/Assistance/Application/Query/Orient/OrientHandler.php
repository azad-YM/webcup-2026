<?php

declare(strict_types=1);

namespace Assistance\Application\Query\Orient;

use Assistance\Application\Ports\Provider\CatalogService;
use Assistance\Application\Service\AssistantModel;
use Assistance\Application\Service\OrientationTexts;
use Assistance\Application\Service\ServiceFinder;
use Assistance\Domain\Language\EmergencyDetector;
use Assistance\Domain\Language\TextFolding;
use Shared\Domain\Exception\DomainException;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

/**
 * Assistant d'orientation (F91, F92). Ordre des garde-fous :
 * 1. urgence vitale ou danger détecté par règles → 15 / 17 / 18 / 112 tout de suite, sans appel au modèle ;
 * 2. modèle (si disponible) : réponse JSON, services **validés contre le catalogue fourni** ;
 * 3. repli local : recherche tolérante (D10) et question de précision par règles.
 * Au plus 3 actions concrètes. Rien n'est stocké ; le prompt ne contient que la conversation (sans identité).
 */
#[AsMessageHandler(bus: 'query.bus')]
final readonly class OrientHandler
{
    private const MAX_MESSAGE = 600;
    private const STRONG_MATCH = 1.5;

    public function __construct(private ServiceFinder $finder, private AssistantModel $model) {}

    /** @return array<string, mixed> */
    public function __invoke(OrientQuery $query): array
    {
        $language = AssistantModel::language($query->language);
        $messages = $this->messages($query->messages);
        $userTexts = array_values(array_map(fn (array $message) => $message['text'], array_filter($messages, fn (array $message) => $message['role'] === 'user')));
        $last = end($userTexts) ?: '';
        if ($last === '') {
            throw new DomainException('Décrivez votre besoin en quelques mots.');
        }

        $kind = EmergencyDetector::detect($last);
        if ($kind !== null) {
            return $this->emergency($language, OrientationTexts::get($language, 'emergency.'.$kind, ['numbers' => implode(' / ', EmergencyDetector::numbers($kind))]), EmergencyDetector::numbers($kind), 'local');
        }

        $context = implode(' ', array_slice($userTexts, -3));

        return $this->withModel($messages, $context, $language) ?? $this->locally($context, $language);
    }

    /**
     * @param list<array{role: string, text: string}> $messages
     *
     * @return array<string, mixed>|null
     */
    private function withModel(array $messages, string $context, string $language): ?array
    {
        $catalogue = $this->finder->catalogue();
        if ($catalogue === [] || !$this->model->isAvailable()) {
            return null;
        }
        $transcript = implode("\n", array_map(
            fn (array $message) => ($message['role'] === 'user' ? 'Habitant : ' : 'Assistant : ').$message['text'],
            array_slice($messages, -6),
        ));
        $answer = $this->model->json(
            sprintf(
                "Tu es l’assistant automatique d’orientation du portail de la ville de Nova Terra. Tu aides un habitant à trouver le bon service municipal ou la bonne démarche.\n"
                ."Règles : réponds en %s, en langage clair, avec des phrases courtes (3 au plus) et en vouvoyant. "
                .'Ne cite que des services du catalogue ci-dessous, par leur identifiant ; n’invente ni service, ni horaire, ni numéro, ni démarche. '
                .'En cas d’urgence médicale ou de danger immédiat, mets "urgent": true. Si la demande est floue, pose une seule question de précision. '
                ."Ne demande aucune donnée personnelle (nom, adresse, téléphone).\n"
                ."Catalogue (identifiant | nom | résumé | état) :\n%s\n\n"
                .'Réponds uniquement par un objet JSON : {"reply": "…", "services": ["identifiant"], "intent": "information|request|report|appointment|other", "question": "… ou null", "urgent": false}',
                AssistantModel::LANGUAGES[$language],
                AssistantModel::catalogueLines($catalogue),
            ),
            $transcript,
            450,
        );
        if ($answer === null) {
            return null;
        }
        if (($answer['urgent'] ?? false) === true) {
            return $this->emergency($language, AssistantModel::clean($answer['reply'] ?? null, 600) ?? OrientationTexts::get($language, 'emergency.model', ['numbers' => '15 / 112']), ['15', '112'], 'model');
        }
        $reply = AssistantModel::clean($answer['reply'] ?? null, 800);
        if ($reply === null) {
            return null;
        }
        $services = array_values(array_filter(array_map(fn (string $id) => $this->finder->findById($id), AssistantModel::knownIds($answer['services'] ?? null, $catalogue))));
        $intent = in_array($answer['intent'] ?? null, ['information', 'request', 'report', 'appointment'], true) ? (string) $answer['intent'] : $this->intent($context);
        $question = AssistantModel::clean($answer['question'] ?? null, 300);

        return $this->response($reply, $question, [], $this->actions($services, $intent, $context, $language), 'model');
    }

    /** @return array<string, mixed> */
    private function locally(string $context, string $language): array
    {
        $search = $this->finder->find($context, 3);
        $matches = $search->matches;
        if ($matches === [] || $search->topScore() < self::STRONG_MATCH) {
            $extras = $this->extraActions($context);

            return $this->response(OrientationTexts::get($language, 'unclear'), null, OrientationTexts::themes($language), $extras, 'local');
        }
        $first = $matches[0]->service;
        $second = $matches[1] ?? null;
        if ($second !== null && $second->score >= $matches[0]->score * 0.85 && $second->service->category !== $first->category) {
            return $this->response(
                OrientationTexts::get($language, 'choice', ['service' => $first->nameIn($language), 'other' => $second->service->nameIn($language)]),
                null,
                [$first->nameIn($language), $second->service->nameIn($language)],
                [$this->serviceAction($first, $language), $this->serviceAction($second->service, $language)],
                'local',
            );
        }
        $intent = $this->intent($context);
        $key = match ($intent) { 'report' => 'request', 'request' => 'contact', default => $intent };
        $reply = OrientationTexts::get($language, $key, ['service' => $first->nameIn($language)]);
        if ($first->disabled) {
            $reply .= ' '.OrientationTexts::get($language, 'disabled');
        } elseif ($first->status !== 'available') {
            $reply .= ' '.OrientationTexts::get($language, 'disrupted');
        }
        foreach (['welcome', 'participation'] as $extra) {
            if ($this->mentions($context, $extra)) {
                $reply .= ' '.OrientationTexts::get($language, $extra);
            }
        }

        // Services secondaires gardés seulement s'ils sont presque aussi pertinents que le premier.
        $relevant = array_filter($matches, fn ($match) => $match->score >= $matches[0]->score * 0.6);

        return $this->response($reply, null, [], $this->actions(array_values(array_map(fn ($match) => $match->service, $relevant)), $intent, $context, $language), 'local');
    }

    /**
     * Au plus 3 actions : action principale sur le premier service selon l'intention, fiches des suivants,
     * puis accueil des nouveaux arrivants ou participation si la demande en parle.
     *
     * @param list<CatalogService> $services
     *
     * @return list<array<string, mixed>>
     */
    private function actions(array $services, string $intent, string $context, string $language): array
    {
        $actions = [];
        $first = $services[0] ?? null;
        if ($first !== null && !$first->disabled && in_array($intent, ['request', 'report'], true)) {
            $actions[] = ['type' => $intent === 'report' ? 'report' : 'request', 'serviceId' => $first->id, 'serviceName' => $first->nameIn($language),
                'href' => '/espace/demandes/nouvelle?'.http_build_query($intent === 'report' ? ['type' => 'report', 'service' => $first->id] : ['service' => $first->id])];
        } elseif ($first !== null && !$first->disabled && $intent === 'appointment') {
            $actions[] = ['type' => 'appointment', 'serviceId' => $first->id, 'serviceName' => $first->nameIn($language), 'href' => '/espace/rendez-vous'];
        }
        if ($first !== null) {
            $actions[] = $this->serviceAction($first, $language);
        }
        $others = array_map(fn (CatalogService $service) => $this->serviceAction($service, $language), array_slice($services, 1));

        return array_slice([...$actions, ...$this->extraActions($context), ...$others], 0, 3);
    }

    /** @return array<string, mixed> */
    private function serviceAction(CatalogService $service, string $language): array
    {
        return ['type' => 'service', 'serviceId' => $service->id, 'serviceName' => $service->nameIn($language), 'href' => '/services?service='.rawurlencode($service->id)];
    }

    /** @return list<array<string, mixed>> */
    private function extraActions(string $context): array
    {
        $extras = [];
        if ($this->mentions($context, 'welcome')) {
            $extras[] = ['type' => 'welcome', 'href' => '/bienvenue'];
        }
        if ($this->mentions($context, 'participation')) {
            $extras[] = ['type' => 'participation', 'href' => '/participer'];
        }

        return $extras;
    }

    /** Intention par règles : signaler un problème, demander, prendre rendez-vous ou s'informer. */
    private function intent(string $context): string
    {
        $words = TextFolding::words($context);
        $has = fn (array $stems) => array_filter($words, fn (string $word) => array_filter($stems, fn (string $stem) => str_starts_with($word, $stem)) !== []) !== [];

        return match (true) {
            $has(['rendez', 'rdv', 'appointment', 'موعد']) => 'appointment',
            $has(['signal', 'panne', 'cass', 'trou', 'fuite', 'abim', 'probleme', 'reclam', 'report', 'broken', 'مشكل', 'عطل']) => 'report',
            $has(['demande', 'inscri', 'obtenir', 'refaire', 'renouvel', 'perdu', 'request', 'apply', 'طلب']) => 'request',
            default => 'information',
        };
    }

    private function mentions(string $context, string $topic): bool
    {
        $stems = $topic === 'welcome'
            ? ['arrive', 'emmenag', 'demenag', 'installe', 'nouvel', 'newcomer', 'moved', 'وصلت', 'جديد']
            : ['idee', 'propos', 'avis', 'consultation', 'projet', 'idea', 'opinion', 'فكرة', 'راي'];
        foreach (TextFolding::words($context) as $word) {
            foreach ($stems as $stem) {
                if (str_starts_with($word, $stem)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @param list<string> $numbers
     *
     * @return array<string, mixed>
     */
    private function emergency(string $language, string $reply, array $numbers, string $source): array
    {
        $actions = array_map(fn (string $number) => ['type' => 'call', 'number' => $number, 'href' => 'tel:'.$number], array_slice($numbers, 0, 2));
        $actions[] = ['type' => 'emergency', 'href' => '/urgences'];

        return ['emergencyNumbers' => $numbers] + $this->response($reply, null, [], $actions, $source, true);
    }

    /**
     * @param list<string> $suggestions
     * @param list<array<string, mixed>> $actions
     *
     * @return array<string, mixed>
     */
    private function response(string $reply, ?string $question, array $suggestions, array $actions, string $source, bool $urgent = false): array
    {
        return [
            'reply' => $reply,
            'question' => $question,
            'suggestions' => $suggestions,
            'actions' => $actions,
            'urgent' => $urgent,
            'emergencyNumbers' => [],
            'source' => $source,
            'modelAvailable' => $this->model->isAvailable(),
        ];
    }

    /**
     * @param array<mixed> $raw
     *
     * @return list<array{role: string, text: string}>
     */
    private function messages(array $raw): array
    {
        $messages = [];
        foreach (array_slice(array_values($raw), -8) as $message) {
            if (!is_array($message) || !in_array($message['role'] ?? null, ['user', 'assistant'], true) || !is_string($message['text'] ?? null)) {
                throw new DomainException('Conversation invalide : chaque message a un rôle (user, assistant) et un texte.');
            }
            $text = trim((string) preg_replace('/\s+/u', ' ', $message['text']));
            if ($message['role'] === 'user' && mb_strlen($text) > self::MAX_MESSAGE) {
                throw new DomainException(sprintf('Votre message est trop long : %d caractères au plus.', self::MAX_MESSAGE));
            }
            $messages[] = ['role' => (string) $message['role'], 'text' => mb_substr($text, 0, 1000)];
        }

        return $messages;
    }
}
