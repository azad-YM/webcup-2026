#!/usr/bin/env bash
# F78 (L24, ADR 012) — test de charge simple des lectures publiques et de l'état de la plateforme.
#
# Usage : scripts/load/charge.sh [URL_API] [REQUETES] [CONCURRENCE]
#   ex.   scripts/load/charge.sh http://localhost:8083/api 2000 50
#
# - Utilise `ab` (ApacheBench) s'il est installé, sinon un repli `curl` en parallèle (xargs -P).
# - Refuse toute adresse autre que localhost / 127.0.0.1 / *.local, sauf ALLOW_REMOTE=1 explicite :
#   ne jamais lancer ce script contre la production.
# - Lit : services, publications, alertes, projets, état de la plateforme. Aucune écriture.
# Voir doc/technique/montee-en-charge.md pour lire les résultats (X-Cache, 503 du mode allégé, temps de réponse).
set -euo pipefail

API="${1:-http://localhost:8083/api}"
REQUESTS="${2:-1000}"
CONCURRENCY="${3:-25}"

host="$(printf '%s' "$API" | sed -E 's#^[a-z]+://([^/:]+).*#\1#')"
case "$host" in
  localhost|127.0.0.1|*.local) ;;
  *)
    if [ "${ALLOW_REMOTE:-0}" != "1" ]; then
      echo "Refusé : $host n'est pas une adresse locale. Ce script ne doit pas viser la production (ALLOW_REMOTE=1 pour une préproduction dédiée)." >&2
      exit 2
    fi
    ;;
esac

PATHS=(
  "/administration/services"
  "/communication/publications"
  "/communication/alerts"
  "/participation/projects"
  "/platform/status"
)

for path in "${PATHS[@]}"; do
  url="${API%/}${path}"
  echo "=== ${url} (${REQUESTS} requêtes, ${CONCURRENCY} en parallèle)"
  if command -v ab >/dev/null 2>&1; then
    ab -q -n "$REQUESTS" -c "$CONCURRENCY" -H 'Accept: application/json' "$url" \
      | grep -E 'Complete requests|Failed requests|Non-2xx|Requests per second|Time per request|Percentage|  50%|  95%|  99%' || true
  else
    start=$(date +%s)
    seq "$REQUESTS" | xargs -P "$CONCURRENCY" -I{} curl -s -o /dev/null -w '%{http_code} %{time_total}\n' -H 'Accept: application/json' "$url" \
      | awk '{ codes[$1]++; total+=$2; if ($2>max) max=$2 } END { for (c in codes) printf "  HTTP %s : %d\n", c, codes[c]; printf "  temps moyen : %.3f s, max : %.3f s\n", total/NR, max }'
    echo "  durée totale : $(( $(date +%s) - start )) s"
  fi
done

echo "=== En-têtes d'une lecture publique (cache serveur et navigateur)"
curl -s -D - -o /dev/null "${API%/}/communication/publications" | grep -iE '^(HTTP|cache-control|etag|x-cache|x-platform-mode)' || true
