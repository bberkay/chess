# 1. Base image with Bun
FROM oven/bun:1 AS base
WORKDIR /app

# 2. Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 3. Copy source and build
FROM deps AS builder
WORKDIR /app

# Accept build-time environment variables
ARG VITE_SERVER_URL
ARG VITE_WS_URL
ARG REPOSITORY_URL

# Pass args to Vite as env variables
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV REPOSITORY_URL=$REPOSITORY_URL

COPY . .

# Optional: confirm envs are set (debug)
# RUN echo "Server: $VITE_SERVER_URL, WS: $VITE_WS_URL, Repo: $REPOSITORY_URL"

# Build client (Vite uses VITE_ vars via import.meta.env.*)
RUN bun run build

# 4. Serve built static files using a tiny web server
FROM oven/bun:1 AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN bun add -d serve
EXPOSE 4173
ENTRYPOINT [ "bun", "x", "serve", "dist", "-l", "4173" ]

