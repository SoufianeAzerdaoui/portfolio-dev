#!/usr/bin/env sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"

if [ ! -f .env.production ]; then
  echo "Missing .env.production. Copy .env.production.example and fill it first." >&2
  exit 1
fi

compose="docker compose --env-file .env.production -f docker-compose.prod.yml"

$compose config --quiet
$compose build --pull
$compose up -d --remove-orphans
$compose ps

domain=$(sed -n 's/^DOMAIN=//p' .env.production | tail -n 1)
if [ -n "$domain" ]; then
  echo "Application started on the local port configured by PORTFOLIO_PORT."
  echo "Apache should expose it at https://$domain."
fi
