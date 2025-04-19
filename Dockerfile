FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build   # assuming "build": "tsc" in package.json

FROM node:20-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist

ENV PORT=2000 \
    HOST=0.0.0.0 \
    CORS_ORIGIN=*

EXPOSE 2000

CMD ["node", "dist/index.js"]
