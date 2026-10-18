# Production Dockerfile for AUTORA Next.js SaaS (Debian glibc for rock-solid better-sqlite3 and ffmpeg)
FROM node:20-slim AS base

# Install ffmpeg, python, make, g++ for native C++ addons
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    make \
    g++ \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Ensure storage and data directories exist with proper non-root ownership
RUN mkdir -p /app/data /app/storage && chown -R node:node /app

# Install dependencies deterministically from lockfile
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
RUN npm rebuild better-sqlite3 --build-from-source

# Copy application source code with non-root ownership
COPY --chown=node:node . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Switch to non-root user for execution
USER node

# Expose default port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start production server
CMD ["npm", "run", "start"]

