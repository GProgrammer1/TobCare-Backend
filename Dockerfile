FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate
WORKDIR /app

# ── Install dependencies ──────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/common/package.json packages/common/
COPY packages/doctor/package.json packages/doctor/
COPY packages/patient/package.json packages/patient/
COPY packages/admin/package.json packages/admin/
COPY packages/prisma/package.json packages/prisma/
RUN pnpm install --frozen-lockfile

# ── Generate Prisma client ────────────────────────────────────────────
FROM deps AS build
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY packages ./packages
COPY src ./src
COPY public ./public
# Prisma generate needs the env schema — provide dummy values for validation
RUN DATABASE_URL="postgresql://x:x@localhost:5432/x" \
    REDIS_URL="redis://localhost:6379" \
    CORS_ORIGIN="http://localhost" \
    CORS_METHODS="GET,POST" \
    CORS_CREDENTIALS=true \
    OTP_TTL_SECONDS=300 \
    HMAC_SECRET=build-placeholder \
    JWT_SECRET=build-placeholder \
    pnpm prisma:generate

# ── Production image ──────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/src ./src
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-workspace.yaml ./

RUN mkdir -p uploads/pending

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["pnpm", "start"]
