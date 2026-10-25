# Runs the API on any Docker host (Railway, Fly.io, a plain VM).
# Chromium comes from the OS package, so Puppeteer's own download is skipped and
# PUPPETEER_EXECUTABLE_PATH points it at the installed binary.
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium fonts-liberation fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# tsx and typescript live in "dependencies" on purpose: `npm start` runs the
# TypeScript source directly, so they must survive --omit=dev.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src

EXPOSE 5000
CMD ["npm", "start"]
