FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine

# FFmpeg is required inside the container because the Node API spawns it
RUN apk update && apk add --no-cache ffmpeg sqlite

WORKDIR /app

COPY package.json ./
# Install production dependencies and force native recompilation of better-sqlite3 for Linux
RUN npm install --production && \
    npm rebuild better-sqlite3

COPY --from=builder /app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production
ENV NIMBLE_HOST=127.0.0.1
ENV NIMBLE_PORT=8081

# Starting the compiled typescript server
CMD ["node", "dist/index.js"]
