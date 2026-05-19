#!/usr/bin/env bash
# =============================================================================
# SnagPin — Hetzner one-shot deploy
# =============================================================================
# Run from the project root on your laptop:
#
#   SNAGPIN_SSH_HOST=root@<your-hetzner-ip> ./deploy/hetzner/deploy.sh
#
# Optional overrides:
#   SNAGPIN_PORT=3080                    host port on the server
#   SNAGPIN_ENV_FILE=.env.local          where the secrets live on your laptop
#   REMOTE_DIR=/opt/snagpin               target dir on the server
#   SNAGPIN_REPO=https://github.com/santoshrnath/aisnag.git
#   SNAGPIN_BRANCH=main
#
# What it does:
#   1. SSH to the server and git clone / pull the project to /opt/snagpin.
#   2. scp's your local .env.local to the server as .env (never touches git).
#   3. docker compose up -d --build.
#   4. prisma db push to apply the schema.
#   5. Optionally runs the seed (set SEED=1).
# =============================================================================
set -euo pipefail

: "${SNAGPIN_SSH_HOST:?Set SNAGPIN_SSH_HOST=user@ip (e.g. root@1.2.3.4)}"
SNAGPIN_PORT="${SNAGPIN_PORT:-3080}"
SNAGPIN_ENV_FILE="${SNAGPIN_ENV_FILE:-.env.local}"
REMOTE_DIR="${REMOTE_DIR:-/opt/snagpin}"
SNAGPIN_REPO="${SNAGPIN_REPO:-https://github.com/santoshrnath/aisnag.git}"
SNAGPIN_BRANCH="${SNAGPIN_BRANCH:-main}"
SEED="${SEED:-0}"

if [ ! -f "$SNAGPIN_ENV_FILE" ]; then
  echo "✗ Missing env file at $SNAGPIN_ENV_FILE" >&2
  echo "  Copy .env.example to .env.local and fill in ANTHROPIC_API_KEY at minimum." >&2
  exit 1
fi

echo "→ Project: snagpin"
echo "→ Target:  $SNAGPIN_SSH_HOST:$REMOTE_DIR"
echo "→ Port:    $SNAGPIN_PORT"
echo "→ Repo:    $SNAGPIN_REPO ($SNAGPIN_BRANCH)"
echo

echo "▸ git sync on server"
ssh "$SNAGPIN_SSH_HOST" "set -e; \
  mkdir -p $REMOTE_DIR; \
  cd $REMOTE_DIR; \
  if [ -d .git ]; then \
    echo '  [update]'; \
    git fetch --depth=1 origin $SNAGPIN_BRANCH && git reset --hard origin/$SNAGPIN_BRANCH; \
  else \
    echo '  [clone]'; \
    git clone --depth=1 -b $SNAGPIN_BRANCH $SNAGPIN_REPO .; \
  fi; \
  git log -1 --oneline"

echo "▸ writing .env on server (from $SNAGPIN_ENV_FILE)"
scp "$SNAGPIN_ENV_FILE" "$SNAGPIN_SSH_HOST:$REMOTE_DIR/.env"

echo "▸ docker compose up -d --build"
ssh "$SNAGPIN_SSH_HOST" \
  "cd $REMOTE_DIR && SNAGPIN_PORT=$SNAGPIN_PORT docker compose up -d --build"

echo "▸ prisma db push"
ssh "$SNAGPIN_SSH_HOST" \
  "cd $REMOTE_DIR && docker compose exec -T snagpin-app npx prisma db push --skip-generate || true"

if [ "$SEED" = "1" ]; then
  echo "▸ seeding sample project"
  ssh "$SNAGPIN_SSH_HOST" \
    "cd $REMOTE_DIR && docker compose exec -T snagpin-app node node_modules/.bin/tsx prisma/seed.ts || true"
fi

HOST_IP="${SNAGPIN_SSH_HOST#*@}"
PUBLIC_HOST=$(grep -E '^PUBLIC_HOSTNAME=' "$SNAGPIN_ENV_FILE" | head -n1 | cut -d= -f2-)
PUBLIC_HOST="${PUBLIC_HOST:-aisnag.oneplaceplatform.com}"

echo
echo "✓ Deployed."
echo "  Public (via Traefik): https://${PUBLIC_HOST}"
echo "  Direct (smoke test):  http://${HOST_IP}:${SNAGPIN_PORT}"
echo
echo "  Tail logs with:  ssh ${SNAGPIN_SSH_HOST} 'cd ${REMOTE_DIR} && docker compose logs -f'"
echo "  Seed on server:  SEED=1 ./deploy/hetzner/deploy.sh"
