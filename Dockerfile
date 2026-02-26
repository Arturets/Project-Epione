# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy dependency files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install production and dev dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.json vite.config.ts ./
COPY src ./src

# Copy public directory if it exists
COPY public* ./public/

# Build the application
RUN pnpm build

# Development stage (includes dev dependencies)
FROM node:20-alpine AS dev

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy dependency files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.json vite.config.ts ./
COPY src ./src

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Fix permissions for node_modules and cache directories
RUN mkdir -p /app/node_modules/.vite /app/node_modules/.cache && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

ENV DEPLOYMENT_MODE=local
ENV OTEL_ENABLED=false

CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "3000"]

# Runtime stage (production)
FROM node:20-alpine AS production

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy dependency files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENV DEPLOYMENT_MODE=production
ENV OTEL_ENABLED=false

CMD ["node", "server/entry.preview.mjs"]
