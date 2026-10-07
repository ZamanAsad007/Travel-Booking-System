# Multi-stage Dockerfile for Auth Service
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Security: run as non-root node user
USER node

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node src ./src

EXPOSE 3001

CMD ["node", "src/server.js"]
