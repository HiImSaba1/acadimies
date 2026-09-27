#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${1:-/acadimies-app}"
case "$APP_ROOT" in
  /acadimies-app|/var/www/vhosts/*/acadimies-app) ;;
  *) echo "Refusing unexpected application root: $APP_ROOT" >&2; exit 2 ;;
esac

cd "$APP_ROOT"
find . -type d -not -path './node_modules/*' -not -path './.next/*' -exec chmod 755 {} +
find . -type f -not -name '.env*' -not -path './node_modules/*' -not -path './.next/*' -exec chmod 644 {} +
chmod 755 scripts/repair-release-permissions.sh

echo "Ordinary release directories are 755 and files are 644."
echo "Environment files were excluded. Set .env.production.local to 600 manually."
