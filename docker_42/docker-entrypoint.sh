#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ROOT:=/workspace/transcendence}"
: "${APP_DIR:=/workspace/transcendence/app}"

if [ ! -d "$APP_DIR" ]; then
  echo "❌ APP_DIR non trovato: $APP_DIR"
  echo "📂 Contenuto di $PROJECT_ROOT:"
  ls -la "$PROJECT_ROOT" || true
  exit 1
fi

cd "$APP_DIR"

if [ ! -f package.json ]; then
  echo "❌ Nessun package.json in $APP_DIR. Esco."
  exit 1
fi

# Install deps
if [ ! -d node_modules ]; then
  echo "📦 Installazione dipendenze..."
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
fi

# Garantisce dev tools
need_install=0
ensure_devdep () {
  local pkg="$1"
  local version="${2:-}"
  if ! npm ls -s --depth=0 --json | grep -q "\"$pkg@"; then
    if [ -n "$version" ]; then
      npm install --save-dev "$pkg@$version"
    else
      npm install --save-dev "$pkg"
    fi
    need_install=1
  fi
}
ensure_devdep concurrently
ensure_devdep nodemon
ensure_devdep typescript "^5.5.0"
ensure_devdep @types/node "20"

if [ "$need_install" -eq 1 ] && [ ! -d node_modules ]; then
  echo "📦 Reinstall post-aggiunta devDeps..."
  npm install
fi

# Env defaults
: "${PORT:=3000}"
: "${HOST:=0.0.0.0}"

if [ -z "${JWT_SECRET:-}" ]; then
  echo "⚠️  JWT_SECRET mancante: ne genero uno TEMPORANEO per lo sviluppo."
  export JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
fi

export PORT HOST JWT_SECRET

echo "🚀 Avvio: $* (pwd: $(pwd))"
echo "   HOST=$HOST PORT=$PORT JWT_SECRET=${JWT_SECRET:0:8}… (dev)"
exec "$@"
