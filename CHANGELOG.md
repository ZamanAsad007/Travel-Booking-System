# Changelog

All notable changes to the Travel Booking System project are documented in this file.

## [2.0.0] - 2026-10-15

### Added
- **Search Upgrade & Trip Bundles (Phase 21)**:
  - Redis search result caching with TTL and event-driven invalidation.
  - Autocomplete suggestion endpoint (`/api/catalog/suggest?q=`) for airports, cities, airlines, and hotels.
  - Advanced filtering (price range, duration, airline, rating, free cancellation) and multi-field sorting.
  - Vacation Trip Bundles (`/api/catalog/bundles`) offering flight + luxury hotel package deals with an automated 15% discount.
  - Multi-item cart checkout support in booking service and React checkout page.
  - Responsive filter sidebars on flight and hotel search pages.
  - Featured package deals tab and section on homepage.
- **Reliability Pack (Phase 20)**:
  - Transactional Outbox pattern in booking service with background outbox worker for reliable RabbitMQ event publishing.
  - Exponential retry backoff policy (`x-retry-count`) with Dead-Letter Exchange/Queue (`travel.events.dlx`) and replayable DLQ store.
  - Refresh token rotation with reuse detection, compromise revocation, and explicit logout revocation (`/api/auth/refresh`, `/api/auth/logout`).
  - Nginx gateway rate limiting (30 req/s API, 5 req/min login brute-force protection).
  - Chaos engineering test script and automated downtime recovery verification.
- **Loyalty Rewards & Tier Progression (Phase 19)**:
  - Append-only points ledger tracking earnings on confirmed bookings, reversals on cancellations, and welcome bonuses.
  - Dynamic tier calculation (Bronze, Silver, Gold) with interactive progress bars on profile.
- **Price Alerts & Price History (Phase 18)**:
  - Automated price history tracking table and `price.changed` events on price updates.
  - Price drop alert matching and notification triggers.
  - Interactive price history line charts on detail pages.
- **Engagement Service: Wishlist & Verified Reviews (Phase 17)**:
  - Dedicated `engagement-service` with isolated PostgreSQL database `engagement_db`.
  - User wishlist persistence with heart icons across search cards.
  - Verified customer reviews restricted strictly to completed trips, updating catalog average ratings.
- **Real-Time Booking Status Streaming via SSE (Phase 16)**:
  - Server-Sent Events (SSE) streaming endpoint `/api/notifications/stream` and `/stream/bookings`.
  - Nginx gateway proxy configuration with unbuffered streaming.
  - Custom React `useBookingStatus` hook replacing polling with live push updates.
- **Promo Coupons & Dynamic Pricing (Phase 15)**:
  - Promo coupon engine (percent & flat discounts, minimum booking threshold, usage limits, per-user redemption enforcement).
  - Pure function dynamic pricing calculating surcharges for weekend departures (+15%) and peak seasons (+20%/+25%).
  - Admin coupon CRUD management.
- **Multi-Passenger Booking & E-Ticket PDF with QR Code (Phase 14)**:
  - Multiple passenger details support per booking with seat preferences.
  - Unique ticket number issuance upon booking confirmation.
  - Production PDF generation (`pdfkit`) with scannable QR verification code (`qrcode`) and email attachment delivery.
  - Ticket download endpoint `/api/bookings/:id/ticket/download`.
- **Roles & Admin Dashboard (Phase 13)**:
  - Role-Based Access Control (`USER` and `ADMIN`) in JWT.
  - Admin CRUD endpoints for flights, hotels, and rooms.
  - SQL aggregate stats for revenue, booking counts, and top routes.
  - React Admin Dashboard with management tables and metrics charts.

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
