# Stage 1: Build Next.js frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --only=production=false

COPY frontend/ ./
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Install only production deps
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built Next.js app
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
