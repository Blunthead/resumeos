# Runs the API on any Docker host (Railway, Fly.io, a plain VM).
# Chromium comes from the OS package, so Puppeteer's own download is skipped and
# PUPPETEER_EXECUTABLE_PATH points it at the installed binary.
#
# The resume's own typefaces (Inter, Source Serif 4, JetBrains Mono) are embedded
# in each PDF from src/assets/fonts, so they don't depend on this image. The
# fonts installed here are the fallback for everything else: fonts-noto-core
# covers Devanagari, Arabic, Hebrew, Thai, Bengali, Tamil and more, so names and
# text in those scripts print instead of becoming empty boxes. (CJK is not
# included: fonts-noto-cjk adds about 60MB.)
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium fonts-liberation fonts-noto-core fonts-noto-color-emoji \
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
