# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 : build Angular
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY .env.build .env
COPY package*.json ./
RUN npm ci

COPY . .

ARG API_BASE_URL=/api/v1
ARG AUTH0_DOMAIN
ARG AUTH0_CLIENT_ID
ARG AUTH0_AUDIENCE=
ARG AUTH0_REDIRECT_URI=/auth/callback
ARG PROD_API_BASE_URL=/api/v1
ARG PROD_AUTH0_AUDIENCE=
ARG PROD_AUTH0_REDIRECT_URI=/auth/callback

RUN npm run build -- --configuration production --output-path=dist/browser

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 : image de distribution (dist uniquement, pas de serveur HTTP)
# En production, Caddy (service host) sert les fichiers directement.
# Usage déploiement :
#   docker run --rm -v /data/mediahandler/web:/output IMAGE sh -c "cp -rp /app/dist/browser/browser/. /output/"
# ─────────────────────────────────────────────────────────────────────────────
FROM alpine:3.20 AS dist
WORKDIR /app/dist/browser
COPY --from=builder /app/dist/browser ./
# Pas d'EXPOSE ni de CMD — cette image ne tourne pas en permanence

