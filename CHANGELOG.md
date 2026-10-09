# Changelog

All notable changes to the Travel Booking System project are documented in this file.

## [1.0.0] - 2026-10-09

### Added
- **Microservices Architecture**:
  - `auth-service`: User registration, authentication, and JWT signing with bcrypt and Postgres.
  - `catalog-service`: Flight and hotel search with Redis hold management and availability calculations.
  - `booking-service`: State machine coordinator managing booking lifecycle (`PENDING` -> `CONFIRMED` / `CANCELLED`).
  - `payment-service`: Mock payment engine publishing asynchronous events with refund capabilities.
  - `notification-service`: Email notifications delivery via Nodemailer to Mailpit SMTP.
- **API Gateway & Routing**:
  - Nginx reverse proxy routing requests across all services with CORS configuration.
- **Event-Driven Messaging & Caching**:
  - RabbitMQ topic exchange `travel.events` supporting Saga choreography.
  - Idempotent event consumers with deduplication via `processed_events` tables.
  - Redis temporary inventory holds with TTL expiration (10 minutes).
- **Frontend SPA**:
  - React 18, Vite, React Router 6, TanStack Query, and TailwindCSS responsive design.
- **Testing & CI**:
  - Jest unit and Supertest API tests for core services and state machine.
  - End-to-end happy-path integration verification (`tests/e2e/happy-path.js`).
  - GitHub Actions CI workflow for linting, testing, and Docker Compose builds.
- **Documentation**:
  - OpenAPI 3.0 specification (`docs/openapi.yaml`).
  - Postman / Thunder Client collection (`docs/travel-booking-collection.json`).
  - Comprehensive README with architecture diagrams and design rationale.
