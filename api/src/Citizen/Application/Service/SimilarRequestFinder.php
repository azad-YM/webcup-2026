<?php

declare(strict_types=1);

namespace Citizen\Application\Service;

use Citizen\Domain\Entity\ServiceRequest;
use Citizen\Domain\Service\RequestTriage;
use Shared\Application\Ports\Service\LanguageModel;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

/**
 * F75 : « demandes qui semblent parler du même problème ».
 *
 * Repli local, toujours calculé : mots significatifs communs (Jaccard, sans mots vides), trigrammes de l'objet,
 * même catégorie, même quartier ou lieu, même service, proximité dans le temps.
 * Avec le modèle de langage : libellé court du sujet et tri des cas ambigus. Le prompt ne contient ni nom,
 * ni identifiant de citoyen, ni adresse d'une demande de contact ; e-mails et numéros sont masqués.
 * Le résultat de l'IA est mis en cache 6 h (même demande, mêmes candidates).
 */
final readonly class SimilarRequestFinder
{
    public const THRESHOLD = 0.3;
    public const AMBIGUOUS = 0.18;
    public const MAX_RESULTS = 8;
    public const WINDOW_DAYS = 60;

    private const STOPWORDS = [
        'les', 'des', 'une', 'aux', 'est', 'sont', 'pour', 'par', 'sur', 'dans', 'avec', 'sans', 'que', 'qui', 'quoi',
        'dont', 'mais', 'donc', 'car', 'pas', 'plus', 'moins', 'tres', 'tout', 'tous', 'toute', 'toutes', 'cette', 'ces',
        'ceci', 'cela', 'mon', 'mes', 'ton', 'tes', 'son', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'nous',
        'vous', 'ils', 'elle', 'elles', 'lui', 'eux', 'suis', 'etre', 'avoir', 'ont', 'avons', 'avez', 'fait', 'faire',
        'depuis', 'encore', 'deja', 'aussi', 'bien', 'comme', 'quand', 'alors', 'bonjour', 'merci', 'madame', 'monsieur',
        'cordialement', 'svp', 'rue', 'devant', 'pres', 'chez', 'entre', 'jour', 'jours', 'hier', 'aujourd', 'hui',
        'semaine', 'mois', 'probleme', 'demande', 'signalement', 'mairie', 'ville', 'nova', 'terra', 'quartier', 'ete',
        'etait', 'peut', 'peu', 'beaucoup', 'avant', 'apres', 'cet', 'meme', 'autre', 'autres', 'non', 'oui',
    ];

    public function __construct(
        private ?LanguageModel $model = null,
        private ?CacheInterface $cache = null,
    ) {}

    /**
     * @param list<ServiceRequest> $candidates demandes ouvertes récentes (la demande elle-même est ignorée)
     * @return array{source: string, topic: ?string, items: list<array{request: ServiceRequest, score: int, reasons: list<string>}>}
     */
    public function find(ServiceRequest $target, array $candidates): array
    {
        $targetTokens = $this->tokens($target->subject . ' ' . $target->description);
        $targetTrigrams = $this->trigrams($target->subject);
        $scored = [];
        foreach ($candidates as $candidate) {
            if ($candidate->id === $target->id) {
                continue;
            }
            [$score, $reasons] = $this->score($target, $targetTokens, $targetTrigrams, $candidate);
            if ($score >= self::AMBIGUOUS) {
                $scored[] = ['request' => $candidate, 'score' => $score, 'reasons' => $reasons];
            }
        }
        usort($scored, fn (array $a, array $b) => $b['score'] <=> $a['score']);
        $scored = array_slice($scored, 0, self::MAX_RESULTS + 4);

        $local = array_values(array_filter($scored, fn (array $item) => $item['score'] >= self::THRESHOLD));
        $ai = $scored === [] ? null : $this->askModel($target, $scored);
        if ($ai !== null) {
            $kept = [];
            foreach ($scored as $index => $item) {
                if (in_array($index + 1, $ai['same'], true)) {
                    $item['reasons'][] = 'Jugée similaire par l’IA';
                    $kept[] = $item;
                }
            }

            return ['source' => 'ai', 'topic' => $ai['topic'], 'items' => $this->present(array_slice($kept, 0, self::MAX_RESULTS))];
        }

        return ['source' => 'local', 'topic' => $this->localTopic($targetTokens, $local), 'items' => $this->present(array_slice($local, 0, self::MAX_RESULTS))];
    }

    /**
     * @param list<array{request: ServiceRequest, score: float, reasons: list<string>}> $items
     * @return list<array{request: ServiceRequest, score: int, reasons: list<string>}>
     */
    private function present(array $items): array
    {
        return array_map(fn (array $item) => [...$item, 'score' => (int) round(min(1.0, $item['score']) * 100)], $items);
    }

    /**
     * @param array<string, true> $targetTokens
     * @param array<string, true> $targetTrigrams
     * @return array{0: float, 1: list<string>}
     */
    private function score(ServiceRequest $target, array $targetTokens, array $targetTrigrams, ServiceRequest $candidate): array
    {
        $tokens = $this->tokens($candidate->subject . ' ' . $candidate->description);
        $common = array_intersect_key($targetTokens, $tokens);
        $union = count($targetTokens + $tokens);
        $jaccard = $union === 0 ? 0.0 : count($common) / $union;
        $trigrams = $this->trigrams($candidate->subject);
        $trigramUnion = count($targetTrigrams) + count($trigrams);
        $dice = $trigramUnion === 0 ? 0.0 : 2 * count(array_intersect_key($targetTrigrams, $trigrams)) / $trigramUnion;

        $score = 0.55 * $jaccard + 0.3 * $dice;
        $reasons = [];
        if ($common !== []) {
            $reasons[] = 'Mots communs : ' . implode(', ', array_slice(array_keys($common), 0, 5));
        }
        if ($target->category() !== 'other' && $target->category() === $candidate->category()) {
            $score += 0.08;
            $reasons[] = 'Même catégorie';
        }
        if ($target->district() !== null && $target->district() === $candidate->district()) {
            $score += 0.08;
            $reasons[] = 'Même quartier';
        }
        if ($this->sameLocation($target, $candidate)) {
            $score += 0.15;
            $reasons[] = 'Même lieu';
        }
        if ($target->serviceId !== null && $target->serviceId === $candidate->serviceId) {
            $score += 0.06;
            $reasons[] = 'Même service';
        }
        $days = abs($target->createdAt->getTimestamp() - $candidate->createdAt->getTimestamp()) / 86400;
        if ($days <= 3) {
            $score += 0.04;
            $reasons[] = 'Reçues à moins de 3 jours d’écart';
        } elseif ($days > 30) {
            $score *= 0.7;
        }

        return [$score, $reasons];
    }

    /** Lieux comparés seulement pour des signalements (le lieu d'un message peut être un domicile). */
    private function sameLocation(ServiceRequest $a, ServiceRequest $b): bool
    {
        if ($a->type !== ServiceRequest::TYPE_REPORT || $b->type !== ServiceRequest::TYPE_REPORT || $a->location === null || $b->location === null) {
            return false;
        }
        $left = $this->tokens($a->location);
        $right = $this->tokens($b->location);
        $union = count($left + $right);

        return $union > 0 && count(array_intersect_key($left, $right)) / $union >= 0.5;
    }

    /** @return array<string, true> mots significatifs normalisés (sans mots vides, pluriel simple retiré) */
    private function tokens(string $text): array
    {
        $tokens = [];
        foreach (explode(' ', RequestTriage::normalize($text)) as $word) {
            if (mb_strlen($word) < 3 || is_numeric($word) || in_array($word, self::STOPWORDS, true)) {
                continue;
            }
            $word = (string) preg_replace('/(?<=...)(s|x)$/', '', $word);
            $tokens[$word] = true;
        }

        return $tokens;
    }

    /** @return array<string, true> */
    private function trigrams(string $text): array
    {
        $text = '  ' . RequestTriage::normalize($text) . ' ';
        $grams = [];
        for ($i = 0, $length = strlen($text) - 2; $i < $length; ++$i) {
            $grams[substr($text, $i, 3)] = true;
        }

        return $grams;
    }

    /**
     * @param array<string, true> $targetTokens
     * @param list<array{request: ServiceRequest, score: float, reasons: list<string>}> $items
     */
    private function localTopic(array $targetTokens, array $items): ?string
    {
        if ($items === []) {
            return null;
        }
        $counts = [];
        foreach ($items as $item) {
            foreach (array_keys(array_intersect_key($targetTokens, $this->tokens($item['request']->subject . ' ' . $item['request']->description))) as $word) {
                $counts[$word] = ($counts[$word] ?? 0) + 1;
            }
        }
        arsort($counts);

        return $counts === [] ? null : implode(' · ', array_slice(array_keys($counts), 0, 3));
    }

    /**
     * @param list<array{request: ServiceRequest, score: float, reasons: list<string>}> $items
     * @return array{topic: ?string, same: list<int>}|null
     */
    private function askModel(ServiceRequest $target, array $items): ?array
    {
        if ($this->model === null || !$this->model->isAvailable()) {
            return null;
        }
        $lines = ['Demande de référence : ' . $this->describe($target), '', 'Demandes candidates :'];
        foreach ($items as $index => $item) {
            $lines[] = sprintf('C%d : %s', $index + 1, $this->describe($item['request']));
        }
        $user = implode("\n", $lines);
        $system = 'Tu aides les agents d’une mairie à repérer les demandes d’habitants qui décrivent le même problème concret '
            . '(même panne, même lieu, même nuisance). Réponds uniquement en JSON : {"topic": "libellé court en français, 6 mots au plus", '
            . '"same": [numéros des candidates qui parlent du même problème]}. En cas de doute, n’inclus pas la candidate.';
        $count = count($items);
        $compute = function () use ($system, $user, $count): ?array {
            $answer = $this->model?->complete($system, $user, 200);

            return $answer === null ? null : $this->parse($answer, $count);
        };
        if ($this->cache === null) {
            return $compute();
        }
        $key = 'citizen_similar_' . sha1($system . $user);
        $result = $this->cache->get($key, function (ItemInterface $item) use ($compute): array {
            $result = $compute();
            $item->expiresAfter($result === null ? 30 : 6 * 3600);

            return ['result' => $result];
        });

        return $result['result'] ?? null;
    }

    /** Objet, début du message, catégorie et quartier ; jamais d'identité ni l'adresse d'un message privé. */
    private function describe(ServiceRequest $request): string
    {
        $mask = fn (string $text) => (string) preg_replace(
            ['/[\w.+-]+@[\w-]+\.[\w.]+/u', '/(?:\+?\d[\s.-]?){8,}/'],
            ['[e-mail]', '[numéro]'],
            $text,
        );
        $parts = [
            $mask($request->subject),
            '« ' . $mask(mb_substr($request->description, 0, 280)) . ' »',
            'catégorie ' . $request->category(),
        ];
        if ($request->district() !== null) {
            $parts[] = 'quartier ' . $request->district();
        }
        if ($request->type === ServiceRequest::TYPE_REPORT && $request->location !== null) {
            $parts[] = 'lieu ' . $mask(mb_substr($request->location, 0, 80));
        }

        return str_replace("\n", ' ', implode(' — ', $parts));
    }

    /** @return array{topic: ?string, same: list<int>}|null tolérant : extrait le premier objet JSON de la réponse */
    private function parse(string $answer, int $count): ?array
    {
        if (preg_match('/\{.*\}/s', $answer, $match) !== 1) {
            return null;
        }
        $data = json_decode($match[0], true);
        if (!is_array($data) || !isset($data['same']) || !is_array($data['same'])) {
            return null;
        }
        $same = [];
        foreach ($data['same'] as $value) {
            $number = is_string($value) ? (int) ltrim($value, 'Cc') : (is_int($value) ? $value : 0);
            if ($number >= 1 && $number <= $count) {
                $same[] = $number;
            }
        }
        $topic = is_string($data['topic'] ?? null) ? trim(mb_substr($data['topic'], 0, 80)) : null;

        return ['topic' => $topic === '' ? null : $topic, 'same' => array_values(array_unique($same))];
    }
}
