#!/usr/bin/env bash
# Build local des fronts avec les URL de production, avant commit et push (out/ et dist/ sont versionnés et servis tels quels).
#   scripts/deploy/build-fronts.sh [site|admin]   (les deux par défaut)
# Les variables du processus priment sur les fichiers .env de Next et de Vite ; surcharger API_URL, SITE_URL, ADMIN_URL au besoin.
set -euo pipefail

cd "$(dirname "$0")/../../front"
API_URL="${API_URL:-https://api.adumillion.lescomores.webcup.hodi.cloud/api}"
SITE_URL="${SITE_URL:-https://adumillion.lescomores.webcup.hodi.cloud}"
ADMIN_URL="${ADMIN_URL:-https://admin.adumillion.lescomores.webcup.hodi.cloud}"
TARGET="${1:-all}"

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$1"; }

pnpm install --frozen-lockfile

if [[ "$TARGET" == all || "$TARGET" == site ]]; then
  step "Build du site → front/apps/site/out/"
  NEXT_PUBLIC_API_BASE_URL="$API_URL" NEXT_PUBLIC_SITE_URL="$SITE_URL" NEXT_PUBLIC_ADMIN_URL="$ADMIN_URL" pnpm --filter site build
  [[ -f apps/site/out/.htaccess ]] || { echo "out/.htaccess absent." >&2; exit 1; }
fi

if [[ "$TARGET" == all || "$TARGET" == admin ]]; then
  step "Build de l'admin → front/apps/admin/dist/"
  VITE_API_BASE_URL="$API_URL" VITE_SITE_URL="$SITE_URL" pnpm --filter admin build
  [[ -f apps/admin/dist/.htaccess ]] || { echo "dist/.htaccess absent." >&2; exit 1; }
fi

printf '\n\033[1;32m✔ Build terminé.\033[0m À committer : git add front/apps/site/out front/apps/admin/dist\n'
