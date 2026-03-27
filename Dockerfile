FROM node:20-alpine AS builder

WORKDIR /app

# ── Builder: instalar deps do servidor ──
COPY package.json package-lock.json* ./
RUN npm install

# ── Builder: instalar deps do cliente e buildar a UI React ──
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install

COPY . .

# Build da UI React (cria client/dist)
RUN cd client && npm run build

# Build do servidor TypeScript (cria dist/)
RUN npm run build

# ════════════════════════════════════════
FROM node:20-alpine

# FFmpeg obrigatório: o Node API faz spawn de processos FFmpeg
RUN apk update && apk add --no-cache ffmpeg sqlite

WORKDIR /app

COPY package.json ./
# Recompilar better-sqlite3 para o Alpine Linux nativo
RUN npm install --production && \
    npm rebuild better-sqlite3

# Copiar o servidor compilado
COPY --from=builder /app/dist ./dist

# Copiar a UI React compilada (servida pelo fastifyStatic em produção)
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000

ENV NODE_ENV=production
ENV NIMBLE_HOST=127.0.0.1
ENV NIMBLE_PORT=8081
ENV SERVER_HOST=localhost

# Iniciar o servidor compilado
CMD ["node", "dist/index.js"]
