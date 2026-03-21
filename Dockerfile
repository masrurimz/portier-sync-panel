# Build stage
FROM oven/bun:1.3.9 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/env/package.json ./packages/env/
COPY packages/config/package.json ./packages/config/
COPY packages/infra/package.json ./packages/infra/
COPY packages/api/package.json ./packages/api/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.3.9 AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Copy full workspace from builder so Vite preview can load project config/plugins
COPY --from=builder /app /app

# Expose port
EXPOSE 3001

# Serve using the app's preview script (uses project vite config)
WORKDIR /app/apps/web
CMD ["bun", "run", "serve", "--host", "0.0.0.0", "--port", "3001"]
