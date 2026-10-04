#!/usr/bin/env bash
# Installation / mise à jour de l'API sur le serveur cPanel (.env et .env.local déjà configurés), depuis n'importe où :
#   api/bin/deploy.sh [--bootstrap-admin <email>] [--seed-demo]
# Variables facultatives : PHP_BIN (défaut ea-php84), COMPOSER_PHAR (défaut /usr/local/bin/composer), ADMIN_PASSWORD.
# Procédure complète : doc/technique/deploiement-cpanel.md
set -euo pipefail

cd "$(dirname "$0")/.."
PHP_BIN="${PHP_BIN:-ea-php84}"
COMPOSER_PHAR="${COMPOSER_PHAR:-/usr/local/bin/composer}"
ADMIN_EMAIL=""
SEED_DEMO=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bootstrap-admin) ADMIN_EMAIL="${2:?--bootstrap-admin attend un e-mail}"; shift 2 ;;
    --seed-demo) SEED_DEMO=1; shift ;;
    -h|--help) sed -n '2,5p' "$0"; exit 0 ;;
    *) echo "Option inconnue : $1" >&2; exit 1 ;;
  esac
done

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$1"; }
console() { "$PHP_BIN" bin/console "$@" --no-interaction; }
export APP_ENV=prod APP_DEBUG=0

step "Dépendances Composer (sans dev)"
"$PHP_BIN" "$COMPOSER_PHAR" install --no-dev --optimize-autoloader --classmap-authoritative --no-interaction --no-progress

step "Clés JWT"
if [[ -f config/jwt/private.pem && -f config/jwt/public.pem ]]; then
  echo "Clés présentes, conservées."
else
  console lexik:jwt:generate-keypair
fi

step "Base de données : migrations"
console doctrine:migrations:migrate --allow-no-migration

step "Cache de production"
console cache:clear
console cache:warmup
mkdir -p var/log var/backups

if [[ -n "$ADMIN_EMAIL" ]]; then
  step "Administrateur principal ($ADMIN_EMAIL)"
  if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
    read -r -s -p "Mot de passe de l'administrateur : " ADMIN_PASSWORD; echo
  fi
  console app:admin:bootstrap --email="$ADMIN_EMAIL" --password="$ADMIN_PASSWORD"
fi

if [[ "$SEED_DEMO" == 1 ]]; then
  step "Données de démonstration"
  if [[ -n "$ADMIN_EMAIL" ]]; then
    console app:demo:seed --admin-email="$ADMIN_EMAIL"
  else
    console app:demo:seed
  fi
fi

step "Redémarrage du worker Messenger"
# Arrêt propre après le message en cours ; cPanel › Workers relance aussitôt le worker avec le nouveau code.
console messenger:stop-workers

printf '\n\033[1;32m✔ API déployée.\033[0m Contrôle : curl -s https://api.adumillion.lescomores.webcup.hodi.cloud/api/platform/status\n'
