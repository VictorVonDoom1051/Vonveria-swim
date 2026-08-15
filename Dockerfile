# syntax=docker/dockerfile:1

# Imagen unica para los tres servicios del monorepo (web, api, worker).
# Se usa Debian slim y no Alpine porque los engines de Prisma dependen de
# glibc/openssl: sobre musl fallan con "failed to detect the libssl version".
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@11.20.0

WORKDIR /app

# tsconfig.base.json es obligatorio: cada tsconfig de app/paquete lo extiende
# y next build falla con TS5083 si no esta presente en la raiz del contenedor.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps

RUN pnpm install --no-frozen-lockfile

# El postinstall de @prisma/client no encuentra el schema dentro de un
# workspace pnpm, asi que el cliente se genera de forma explicita.
RUN pnpm --filter @vonveria-swim/database exec prisma generate

# Next.js incrusta las variables NEXT_PUBLIC_* en tiempo de compilacion,
# por eso la URL de la API tiene que llegar como build arg y no solo en runtime.
ARG SERVICE=web
# Ruta relativa por defecto: el navegador siempre habla con el dominio de la web
# y next.config.mjs la reenvia a la API, para que las cookies sean de un solo origen.
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# api y worker se ejecutan con tsx y no requieren paso de compilacion.
RUN case "$SERVICE" in \
      api|worker) echo "Sin paso de build para $SERVICE" ;; \
      *) pnpm --filter @vonveria-swim/web build ;; \
    esac

ENV NODE_ENV=production
ENV TZ=America/Mexico_City

EXPOSE 3001 3100

# Railway define el comando de arranque real por servicio; esto es el respaldo.
CMD ["pnpm", "--filter", "@vonveria-swim/web", "start"]
