# syntax=docker/dockerfile:1.7
# Multi-stage build — optimized for size, cached deps, non-root runtime
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ---- deps stage (cached) ----
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY tsconfig.base.json ./
COPY lib ./lib
COPY artifacts ./artifacts
COPY scripts ./scripts
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod=false

# ---- build stage ----
FROM deps AS build
RUN pnpm -r --if-present run build

# ---- runtime stage ----
FROM node:22-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN addgroup -g 1001 app && adduser -u 1001 -G app -D -s /bin/sh app
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build --chown=app:app /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build --chown=app:app /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=build --chown=app:app /app/artifacts/api-server/package.json ./artifacts/api-server/
COPY --from=build --chown=app:app /app/lib ./lib
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/artifacts/api-server/node_modules ./artifacts/api-server/node_modules

USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD \
  wget -qO- http://localhost:3000/api/healthz || exit 1
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
