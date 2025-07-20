# Multi-stage Dockerfile for Turborepo monorepo with isolated-vm support

# Base stage with pnpm and build dependencies
FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
# Install build dependencies for isolated-vm
RUN apk add --no-cache python3 make g++ libc6-compat

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml turbo.json ./
COPY apps/*/package.json ./apps/*/
COPY packages/*/package.json ./packages/*/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/*/node_modules ./apps/*/node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/*/node_modules

# Copy source code
COPY . .

# Build the project
ARG APP_NAME
RUN if [ -z "$APP_NAME" ]; then \
      echo "Building entire monorepo..." && pnpm build; \
    else \
      echo "Building app: $APP_NAME" && pnpm build --filter=@repo/${APP_NAME}...; \
    fi

# Runner stage for API
FROM node:18-alpine AS api-runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy necessary files for API
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/api ./apps/api
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/turbo.json ./turbo.json

USER nodejs
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "apps/api/dist/index.js"]

# Runner stage for Web (static files)
FROM nginx:alpine AS web-runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Add nginx config for SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]