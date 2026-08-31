# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 : build Angular
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY .npmrc ./
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

RUN printf 'API_BASE_URL=%s\nAUTH0_DOMAIN=%s\nAUTH0_CLIENT_ID=%s\nAUTH0_AUDIENCE=%s\nAUTH0_REDIRECT_URI=%s\nPROD_API_BASE_URL=%s\nPROD_AUTH0_AUDIENCE=%s\nPROD_AUTH0_REDIRECT_URI=%s\n' \
	"$API_BASE_URL" \
	"$AUTH0_DOMAIN" \
	"$AUTH0_CLIENT_ID" \
	"$AUTH0_AUDIENCE" \
	"$AUTH0_REDIRECT_URI" \
	"$PROD_API_BASE_URL" \
	"$PROD_AUTH0_AUDIENCE" \
	"$PROD_AUTH0_REDIRECT_URI" \
	> .env

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

