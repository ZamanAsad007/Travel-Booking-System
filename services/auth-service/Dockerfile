# Multi-stage Dockerfile for Auth Service
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY services/auth-service/package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Security: non-root user
USER node

COPY --chown=node:node services/auth-service/package*.json ./
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node services/auth-service/src ./src

EXPOSE 3001

CMD ["node", "src/server.js"]
