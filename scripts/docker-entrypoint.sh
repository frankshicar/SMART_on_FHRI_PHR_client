#!/bin/sh
set -e

echo "Waiting for MySQL..."
node scripts/wait-for-mysql.mjs

echo "Running database migration..."
node scripts/migrate-db.js

echo "Seeding demo user..."
node scripts/seed-demo-user.js

echo "Starting Nuxt server..."
exec node .output/server/index.mjs
