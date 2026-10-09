# Multi-stage Dockerfile for Notification Service
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY services/notification-service/package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Security: non-root user
USER node

COPY --chown=node:node services/notification-service/package*.json ./
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node services/notification-service/src ./src
COPY --chown=node:node shared /shared

EXPOSE 3005

CMD ["node", "src/server.js"]
