# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
# Install turbo globally
RUN npm install turbo -g
COPY . .
# Use turbo prune to generate a partial monorepo for the api
RUN turbo prune api --docker

# Stage 2: Install & Build
FROM node:20-alpine AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./
RUN npm install
COPY --from=builder /app/out/full/ .
RUN npm run build --filter=api

# Stage 3: Runtime
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy EVERYTHING from installer to ensure symlinks work
COPY --from=installer /app /app

USER nodejs
WORKDIR /app/apps/api
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]