# Stage 1: dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

# Stage 2: build image
FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
ENV PORT=2000 HOST=0.0.0.0 CORS_ORIGIN=*
EXPOSE 2000
CMD ["node", "src/index.ts"]
