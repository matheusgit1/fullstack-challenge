# Base
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Instala deps (cache otimizado)
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Build da aplicação
FROM base AS builder
WORKDIR /usr/src/app

COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# Runtime (produção)
FROM base AS release
WORKDIR /usr/src/app


COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static
COPY --from=builder /usr/src/app/public ./public

ENV NODE_ENV=production
ENV PORT=3000

USER bun
EXPOSE 3000

CMD ["bun", "server.js"]