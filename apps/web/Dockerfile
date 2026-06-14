# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Declare the build arg
ARG NEXT_PUBLIC_BACKEND_URL

# 2. Expose it as an env var so Next.js sees it during next build
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# Copy root package files and turbo config
COPY package.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Install dependencies (npm will resolve workspace dependencies)
RUN npm install

# Build only the web application
RUN npm run build --filter=web

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy package file and turbo config
COPY package.json turbo.json ./
COPY packages/ ./packages/

# Copy only production build from builder
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

# Install only production dependencies
RUN npm install --omit=dev --filter=web && \
    npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

WORKDIR /app/apps/web

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]