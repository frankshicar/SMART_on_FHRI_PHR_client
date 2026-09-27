#!/bin/sh
set -e

# Cloud Run 会注入 K_SERVICE；DB 已在 Cloud SQL Studio 初始化，跳过等待/migrate 以尽快监听 PORT
if [ -n "$K_SERVICE" ] || [ "$SKIP_DB_BOOTSTRAP" = "1" ]; then
  echo "Cloud Run mode: skip DB bootstrap, starting Nuxt on PORT=${PORT:-3000}..."
  exec node .output/server/index.mjs
fi

echo "Waiting for MySQL..."
node scripts/wait-for-mysql.mjs

echo "Running database migration..."
node scripts/migrate-db.js || echo "migrate warning (non-fatal)"

echo "Seeding demo user..."
node scripts/seed-demo-user.js || echo "seed warning (non-fatal)"

echo "Starting Nuxt server on PORT=${PORT:-3000}..."
exec node .output/server/index.mjs
