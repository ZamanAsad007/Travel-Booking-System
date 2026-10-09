# Multi-stage Dockerfile for Catalog Service
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY services/catalog-service/package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Security: non-root user
USER node

COPY --chown=node:node services/catalog-service/package*.json ./
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node services/catalog-service/src ./src
COPY --chown=node:node shared /shared
RUN ln -s /app/node_modules /shared/node_modules

EXPOSE 3002

CMD ["node", "src/server.js"]
