# syntax=docker/dockerfile:1
# =============================================================================
# SnagPin — production Dockerfile (Next.js standalone)
# =============================================================================

FROM node:20-bookworm AS deps
WORKDIR /app
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false
COPY package.json package-lock.json* ./
# --ignore-scripts skips postinstall scripts that download native binaries.
# We re-fetch the ones we actually need below.
RUN npm ci --ignore-scripts || npm install --ignore-scripts
# sharp (transitive of @xenova/transformers) needs its native binary.
# Retry — the prebuilt fetch sometimes hits transient network failures.
RUN if [ -d node_modules/sharp ]; then \
      cd node_modules/sharp && \
      for i in 1 2 3; do npm run install && break; echo "sharp install attempt $i failed, retrying"; sleep 5; done; \
    fi
# Generate Prisma engines here so they're cached alongside node_modules.
# binaries.prisma.sh is occasionally flaky — retry up to 6 times.
COPY prisma ./prisma
RUN for i in 1 2 3 4 5 6; do \
      ./node_modules/.bin/prisma generate && break; \
      echo "prisma generate attempt $i failed — sleeping $((i * 5))s"; \
      sleep $((i * 5)); \
    done

FROM node:20-bookworm AS builder
WORKDIR /app
ENV NODE_ENV=development
# NEXT_PUBLIC_* env vars are baked into the client bundle at build time.
# Clerk's publishable key is optional — if absent, the layout falls back
# to anonymous demo mode and hides sign-in CTAs.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Next.js standalone server binds to 127.0.0.1 by default → bind to 0.0.0.0
# so the reverse proxy (Traefik) can reach it across the docker network.
ENV HOSTNAME=0.0.0.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fontconfig \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
  && useradd  --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma          ./prisma
# Copy the full node_modules from the builder so prisma CLI (with its wasm
# sidecars) and tsx (with esbuild) work for `prisma db push` + seeding. The
# standalone bundle already includes only the runtime deps the server needs,
# but the deploy scripts run schema migrations and seeds inside this same
# container — they need the full CLI tooling.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

ENV HOME=/app

# Pre-create local storage dirs and chown for the non-root runtime user.
RUN mkdir -p /app/storage-local/drawings /app/storage-local/photos /app/storage-local/audio \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
