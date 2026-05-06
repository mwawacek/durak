# ─── Builder ──────────────────────────────────────────────────────
FROM node:20.11-alpine AS builder
WORKDIR /repo

# Copy monorepo manifests first so Docker layer cache helps.
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/

RUN npm ci --workspaces --include-workspace-root

COPY packages/shared packages/shared
COPY apps/backend apps/backend

RUN npm run build --workspace @durak/shared
RUN npm run build --workspace @durak/backend

# ─── Runtime ──────────────────────────────────────────────────────
FROM node:20.11-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only what we need
COPY --from=builder /repo/package.json /repo/package-lock.json ./
COPY --from=builder /repo/packages/shared/package.json packages/shared/package.json
COPY --from=builder /repo/packages/shared/dist packages/shared/dist
COPY --from=builder /repo/apps/backend/package.json apps/backend/package.json
COPY --from=builder /repo/apps/backend/dist apps/backend/dist

RUN npm ci --workspaces --omit=dev --include-workspace-root

EXPOSE 3000
CMD ["node", "apps/backend/dist/main.js"]
