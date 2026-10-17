#!/usr/bin/env bash
set -Eeuo pipefail

BRANCH="restructure-prod"
COMPOSE_FILE="docker-compose.prod.yml"
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

compose() {
  docker-compose -f "$COMPOSE_FILE" "$@"
}

command -v git >/dev/null || die "git is required"
command -v docker-compose >/dev/null || die "docker-compose is required"
command -v npm >/dev/null || die "npm is required"

[[ "$(git branch --show-current)" == "$BRANCH" ]] ||
  die "Check out $BRANCH before deploying"

# With this (optional):
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  die "Working tree has modified files; commit or stash before deploying"
fi

[[ -f backend/.env.production && -f backend/.env.production.db ]] ||
  die "Production environment files are missing"

echo "Pulling latest code..."
git fetch --prune origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "Building frontend for production..."
(
  cd frontend
  npm ci
  npx ng build --configuration production
)

echo "Building production images..."
compose build backend frontend

echo "Starting database..."
compose up -d postgres

run_sequelize_cli() {
  compose run --rm -e DB_HOST=postgres backend \
    npm exec --yes --package=sequelize-cli@6.6.3 -- \
    sequelize-cli "$@" --env production
}

echo "Running pending migrations..."
run_sequelize_cli db:migrate

echo "Seeding qualifications if the table is empty..."
qualification_count="$(
  compose exec -T postgres sh -ec \
    'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT COUNT(*) FROM qualifications"'
)"
qualification_count="${qualification_count//[[:space:]]/}"

if [[ "$qualification_count" == "0" ]]; then
  run_sequelize_cli db:seed --seed 20260901040000-qualifications.js
else
  echo "Qualifications already exist; skipping seeder."
fi

echo "Seeding Madhya Pradesh districts..."
run_sequelize_cli db:seed --seed 20261017110000-madhya-pradesh-districts.js

echo "Starting updated services..."
compose up -d --no-build backend frontend
compose ps

echo "Deployment completed."