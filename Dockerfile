# Multi-stage build for Fly.io / any container host.
# Final image runs ONE process (the NestJS backend) and serves the Vite
# build as static files from the same origin — no separate frontend host
# needed, no CORS gymnastics.

# ─── Builder ─────────────────────────────────────────────────────────────
FROM node:20.11-alpine AS builder
WORKDIR /repo

# Copy workspace manifests + lockfile FIRST so layer-caching reuses
# node_modules when only source changes.
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

RUN npm ci --workspaces --include-workspace-root

# Source. Tools dir not needed for the image but small.
COPY packages/shared packages/shared
COPY apps/backend apps/backend
COPY apps/web apps/web

# Build in dependency order: shared → both apps.
RUN npm run build --workspace @durak/shared
RUN npm run build --workspace @durak/backend
RUN npm run build --workspace @durak/web

# ─── Runtime ─────────────────────────────────────────────────────────────
FROM node:20.11-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Backend reads this and serves /app/web as the static root.
ENV WEB_DIST_DIR=/app/web

# Workspace manifests so `npm ci --omit=dev` can rebuild node_modules
# tree-shaken to prod deps only.
COPY --from=builder /repo/package.json /repo/package-lock.json ./
COPY --from=builder /repo/packages/shared/package.json packages/shared/package.json
COPY --from=builder /repo/apps/backend/package.json apps/backend/package.json

# Compiled artifacts.
COPY --from=builder /repo/packages/shared/dist packages/shared/dist
COPY --from=builder /repo/apps/backend/dist apps/backend/dist
COPY --from=builder /repo/apps/web/dist /app/web

# Install prod deps only. Skip the web workspace — its dist is already
# bundled and self-contained; we don't need its node_modules at runtime.
RUN npm ci \
  --workspace @durak/backend \
  --workspace @durak/shared \
  --include-workspace-root \
  --omit=dev

EXPOSE 3010

# Don't run as root — small hardening, fly.io expects this anyway.
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

CMD ["node", "apps/backend/dist/main.js"]
