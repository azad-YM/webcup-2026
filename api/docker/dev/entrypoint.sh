#!/bin/sh
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"

if [ -n "${DATABASE_URL:-}" ]; then
  DB_HOST_FROM_URL=$(printf '%s' "$DATABASE_URL" | sed -E 's|.*@([^:/?]+).*|\1|')
  if [ "$DB_HOST_FROM_URL" != "$DATABASE_URL" ] && [ -n "$DB_HOST_FROM_URL" ]; then
    DB_HOST="$DB_HOST_FROM_URL"
  fi
fi

echo "Waiting for database..."
until mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" --silent; do
  sleep 1
done

ensure_var_permissions() {
  mkdir -p var/cache var/log
  chown -R www-data:www-data var
  chmod -R ug+rwX var
}

if [ "${SKIP_APP_SETUP:-0}" != "1" ]; then
  echo "Ensuring writable var/ permissions..."
  ensure_var_permissions

  php bin/console cache:clear

  echo "Database ready. Initializing schema..."
  php bin/console doctrine:database:create --if-not-exists
  php bin/console doctrine:schema:update --force

  echo "Re-applying var/ permissions after setup commands..."
  ensure_var_permissions
fi

# Lancer PHP-FPM
if [ "$#" -eq 0 ]; then
  set -- php-fpm
fi

exec "$@"
