# Production Dockerfile for AutoVideo Next.js SaaS
FROM node:18-alpine AS base

# Install build dependencies for better-sqlite3 and ffmpeg
RUN apk add --no-cache libc6-compat python3 make g++ ffmpeg

WORKDIR /app

# Install dependencies based on package.json
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Rebuild better-sqlite3 for current architecture
RUN npm rebuild better-sqlite3

# Copy the rest of the application
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Expose Next.js default port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js production server
CMD ["npm", "run", "start"]
