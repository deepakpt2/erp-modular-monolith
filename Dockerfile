# Production minimal footprint
FROM node:20-alpine AS base

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ensure public exists (Next.js standalone requires it, even if empty)
RUN mkdir -p ./public
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Migrator stage - full source + node_modules for drizzle-kit push/seed
FROM builder AS migrator
WORKDIR /app
ENV NODE_ENV=development
# Keep all files needed for migrations
CMD ["npx", "drizzle-kit", "push"]

# Runner stage - minimal production (no drizzle-kit, no source)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public - ensure dir exists in both builder and runner
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# DMS volume - use /data/dms for production, not inside public
RUN mkdir -p /data/dms && chown nextjs:nodejs /data/dms
VOLUME /data/dms

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
