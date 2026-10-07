# Travel Booking System: Design Doc

A microservices-based travel booking app (flights + hotels) built to learn Docker, service boundaries, and event-driven communication. Runs fully local with `docker compose up`. No hosting needed.

---

## 1. Goals & Non-Goals

**Goals**
- Practice microservice architecture with clear service boundaries
- Practice Docker: multi-stage builds, healthchecks, compose networking, volumes
- Practice async communication (RabbitMQ) and the saga pattern (booking -> payment -> confirm/rollback)
- Full-stack flow: React UI -> gateway -> Express services -> Postgres

**Non-Goals**
- Real payments (payment service is a mock)
- Real email/SMS (notification service logs / uses Mailpit)
- Cloud hosting, Kubernetes, multi-region anything

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite, React Router, TanStack Query, Axios | Fast dev, clean server-state handling |
| Backend | Node.js 20 + Express (JavaScript) | As planned; one language everywhere |
| Database | PostgreSQL (one DB per service) | Enforces service isolation |
| Message broker | RabbitMQ (`amqplib`) | Easy to run locally, nice management UI |
| Cache / locks | Redis | Short-lived seat/room holds with TTL |
| Gateway | Nginx (reverse proxy) | Single entry point, simple config |
| Auth | JWT (access token) + bcrypt | Stateless, works across services |
| Validation | Zod | Request validation in each service |
| DB access | `pg` + plain SQL migrations (or Prisma if you prefer) | Keep it simple and visible |
| Testing | Jest + Supertest | Unit + API tests |
| CI | GitHub Actions | Build + test images with no hosting |
| Local email | Mailpit (optional) | See notification emails in a browser |
| Observability (optional) | Prometheus + Grafana | Nice portfolio touch |

---

## 3. Architecture

```mermaid
flowchart LR
    UI[React Frontend] --> GW[Nginx Gateway]
    GW --> AUTH[Auth Service]
    GW --> CAT[Catalog Service]
    GW --> BOOK[Booking Service]
    BOOK -- publish events --> MQ[(RabbitMQ)]
    MQ --> PAY[Payment Service]
    PAY -- publish events --> MQ
    MQ --> BOOK
    MQ --> CAT
    MQ --> NOTIF[Notification Service]
    AUTH --> DB1[(auth_db)]
    CAT --> DB2[(catalog_db)]
    CAT --> REDIS[(Redis)]
    BOOK --> DB3[(booking_db)]
    PAY --> DB4[(payment_db)]
    NOTIF --> DB5[(notification_db)]
```

### Services

| Service | Responsibility | Owns |
|---|---|---|
| **auth-service** | Register, login, JWT issue, profile | `users` |
| **catalog-service** | Flights/hotels search, availability, seat/room holds | `flights`, `hotels`, `rooms`, `inventory` |
| **booking-service** | Create/cancel bookings, booking state machine, saga coordinator | `bookings`, `booking_items` |
| **payment-service** | Mock payment processing, refunds | `payments` |
| **notification-service** | Consume events, send/log emails, store history | `notifications` |

**Rules**
- A service never reads another service's database. It uses HTTP or events.
- Each service has its own `Dockerfile`, `package.json`, and migrations.
- JWT is verified in each service with a shared secret (simple). Gateway only routes.

---

## 4. Booking Flow (Saga, choreography style)

```
1. User clicks "Book"  -> POST /api/bookings
2. booking-service: creates booking (status = PENDING), asks catalog to HOLD inventory
3. booking-service publishes  booking.created
4. payment-service consumes booking.created -> runs mock payment
      success -> publishes payment.succeeded
      failure -> publishes payment.failed
5. booking-service consumes:
      payment.succeeded -> status = CONFIRMED, publishes booking.confirmed
      payment.failed    -> status = CANCELLED, publishes booking.cancelled
6. catalog-service consumes:
      booking.confirmed -> converts hold into real reservation
      booking.cancelled -> releases hold
7. notification-service consumes booking.confirmed / booking.cancelled -> sends email
```

**Booking states:** `PENDING -> CONFIRMED` | `PENDING -> CANCELLED` | `CONFIRMED -> CANCELLED` (user cancel, triggers refund)

**Failure handling**
- **Hold expiry:** holds live in Redis with a TTL (e.g. 10 min). If payment never arrives, the hold expires and a scheduled job marks the booking `EXPIRED`.
- **Idempotency:** every event has an `eventId`; consumers store processed IDs and skip duplicates.
- **Retries / DLQ:** failed messages are retried a few times, then land in a dead-letter queue.

---

## 5. Data Models (simplified)

**auth_db**
```
users(id UUID PK, name, email UNIQUE, password_hash, role, created_at)
```

**catalog_db**
```
flights(id, airline, origin, destination, departs_at, arrives_at, price, seats_total)
hotels(id, name, city, rating)
rooms(id, hotel_id FK, type, price_per_night, rooms_total)
reservations(id, item_type, item_id, booking_id, quantity, date_from, date_to)
```
Redis keys: `hold:{itemType}:{itemId}:{bookingId}` with TTL.

**booking_db**
```
bookings(id UUID PK, user_id, status, total_amount, created_at, updated_at)
booking_items(id, booking_id FK, item_type, item_id, quantity, unit_price, date_from, date_to)
processed_events(event_id PK, processed_at)
```

**payment_db**
```
payments(id, booking_id, amount, status, created_at)
processed_events(event_id PK, processed_at)
```

**notification_db**
```
notifications(id, user_id, type, payload JSONB, status, created_at)
processed_events(event_id PK, processed_at)
```

---

## 6. API Design (through gateway at `/api`)

**Auth**
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Returns JWT |
| GET | `/api/auth/me` | Current user |

**Catalog**
| Method | Path | Description |
|---|---|---|
| GET | `/api/catalog/flights?from=&to=&date=` | Search flights |
| GET | `/api/catalog/hotels?city=&checkIn=&checkOut=` | Search hotels |
| GET | `/api/catalog/flights/:id` | Flight detail + availability |
| GET | `/api/catalog/hotels/:id` | Hotel detail + rooms |

**Booking** (auth required)
| Method | Path | Description |
|---|---|---|
| POST | `/api/bookings` | Create booking (starts saga) |
| GET | `/api/bookings` | My bookings |
| GET | `/api/bookings/:id` | Booking detail + status |
| POST | `/api/bookings/:id/cancel` | Cancel booking |

**Payment / Notification** are mostly internal (event-driven). Optional read endpoints: `GET /api/payments/:bookingId`, `GET /api/notifications`.

**Standard response shape**
```json
{ "success": true, "data": {}, "error": null }
```

---

## 7. Event Contracts (RabbitMQ)

Exchange: `travel.events` (topic). Routing key = event name.

```json
{
  "eventId": "uuid",
  "type": "booking.created",
  "occurredAt": "ISO-8601",
  "data": { "bookingId": "uuid", "userId": "uuid", "amount": 420.0 }
}
```

| Event | Published by | Consumed by |
|---|---|---|
| `booking.created` | booking | payment |
| `payment.succeeded` | payment | booking |
| `payment.failed` | payment | booking |
| `booking.confirmed` | booking | catalog, notification |
| `booking.cancelled` | booking | catalog, payment (refund), notification |
| `payment.refunded` | payment | notification |

---

## 8. Frontend (React)

**Pages:** Home/Search, Flight Results, Hotel Results, Detail, Checkout, My Bookings, Booking Detail, Login/Register

**Structure**
```
src/
  api/          # axios instance + per-service API functions
  components/   # shared UI
  features/     # auth, search, booking
  hooks/
  pages/
  routes/       # protected routes
  main.jsx
```

**Notes**
- JWT stored in memory + refresh via re-login (simple), or `localStorage` for a local-only project
- Booking detail page polls `GET /bookings/:id` every few seconds while status is `PENDING`
- TanStack Query for caching and loading/error states

---

## 9. Repo Structure (monorepo)

```
travel-booking/
├── DESIGN.md
├── README.md
├── docker-compose.yml
├── .env.example
├── gateway/
│   └── nginx.conf
├── services/
│   ├── auth-service/
│   ├── catalog-service/
│   ├── booking-service/
│   ├── payment-service/
│   └── notification-service/
├── frontend/
├── shared/            # optional: event schemas, constants
└── .github/workflows/ci.yml
```

Each service:
```
src/
  config/  routes/  controllers/  services/  repositories/  events/  middleware/  app.js  server.js
migrations/
tests/
Dockerfile
package.json
```

---

## 10. Docker Plan

- **Multi-stage Dockerfiles** per service (deps -> runtime, non-root user)
- **docker-compose.yml** runs: gateway, 5 services, frontend (dev or static build), 4-5 Postgres containers (or one Postgres with separate DBs for simplicity), RabbitMQ, Redis, Mailpit
- **Healthchecks** on Postgres, RabbitMQ, and each service; use `depends_on: condition: service_healthy`
- **Networks:** one internal network; only gateway and frontend expose ports
- **Volumes:** named volumes for DB data
- **`.env`** driven config, `.env.example` committed

---

## 11. Implementation Phases

Each phase ends with a commit message. Push after each phase.

---

### Phase 0: Repo & Skeleton
**Do**
- Create monorepo folders, `.gitignore`, `README.md` stub, `DESIGN.md`
- Set up ESLint + Prettier config at the root
- Add `.env.example`

**Commit**
```
chore: initialize monorepo structure with design doc and lint config
```

---

### Phase 1: Auth Service
**Do**
- Express app with `/health`, register, login, me
- Postgres connection + migration for `users`
- bcrypt hashing, JWT signing, Zod validation, error-handling middleware
- Dockerfile + local compose entry for auth + its Postgres

**Commit**
```
feat(auth): add auth service with register, login, and JWT
```
```
chore(auth): add Dockerfile and compose setup for auth service
```

---

### Phase 2: Catalog Service
**Do**
- Migrations for flights, hotels, rooms, reservations
- Seed script with realistic sample data
- Search endpoints with filters + pagination
- Availability calculation (total minus reservations)

**Commit**
```
feat(catalog): add flights and hotels search endpoints with seed data
```
```
chore(catalog): add Dockerfile and compose setup for catalog service
```

---

### Phase 3: Gateway + Shared Middleware
**Do**
- Nginx routing: `/api/auth`, `/api/catalog`, `/api/bookings`
- Shared JWT-verify middleware (copy per service or tiny shared package)
- CORS handled at the gateway

**Commit**
```
feat(gateway): add nginx gateway routing to auth and catalog services
```

---

### Phase 4: Booking Service (synchronous version first)
**Do**
- Migrations for `bookings`, `booking_items`
- Create/list/get/cancel endpoints
- Call catalog over HTTP to check availability and price (no events yet)
- Implement booking state machine

**Commit**
```
feat(booking): add booking service with state machine and HTTP catalog check
```

---

### Phase 5: RabbitMQ + Redis Holds
**Do**
- Add RabbitMQ and Redis to compose
- Shared event publisher/consumer helpers (connect, retry, topic exchange)
- Catalog: create holds in Redis with TTL; release/confirm on events
- Booking publishes `booking.created`

**Commit**
```
feat(events): add RabbitMQ event bus and Redis inventory holds
```

---

### Phase 6: Payment Service + Saga
**Do**
- Payment service consumes `booking.created`, mock result (e.g. configurable success rate)
- Publishes `payment.succeeded` / `payment.failed`
- Booking consumes payment events and updates status
- Idempotency via `processed_events` table
- Refund flow on cancel

**Commit**
```
feat(payment): add mock payment service and booking saga flow
```
```
feat(booking): handle payment events and idempotent consumers
```

---

### Phase 7: Notification Service
**Do**
- Consume `booking.confirmed`, `booking.cancelled`, `payment.refunded`
- Send via Nodemailer to Mailpit (or log to console), store history
- Dead-letter queue for failed messages

**Commit**
```
feat(notification): add notification service with email via Mailpit
```

---

### Phase 8: Frontend (React)
**Do**
- Vite + React Router + TanStack Query setup
- Auth pages + protected routes
- Search pages (flights/hotels), detail, checkout
- My Bookings with status polling
- Basic responsive styling (Tailwind or CSS modules)

**Commit (split into a few pushes)**
```
feat(frontend): scaffold React app with routing and auth flow
```
```
feat(frontend): add flight and hotel search pages
```
```
feat(frontend): add checkout and booking status pages
```

---

### Phase 9: Dockerize Everything
**Do**
- Frontend Dockerfile (build -> Nginx static)
- Multi-stage Dockerfiles polished, non-root users
- Healthchecks and `depends_on` conditions
- One command: `docker compose up --build`
- Add `Makefile` or npm scripts: `make up`, `make down`, `make seed`

**Commit**
```
chore(docker): finalize multi-stage builds, healthchecks, and full compose stack
```

---

### Phase 10: Testing & CI
**Do**
- Jest unit tests for services/state machine
- Supertest API tests for auth, catalog, booking
- One end-to-end happy-path script (register -> search -> book -> confirmed)
- GitHub Actions: lint, test, build Docker images

**Commit**
```
test: add unit and API tests for core services
```
```
ci: add GitHub Actions workflow for lint, test, and docker build
```

---

### Phase 11: Polish & Docs
**Do**
- README: overview, architecture diagram, tech stack, one-command run, API summary, screenshots/GIF
- Postman/Thunder collection or OpenAPI spec in `/docs`
- Add "Design decisions" and "What I'd improve" sections
- Tag a release: `v1.0.0`

**Commit**
```
docs: add README with architecture diagram, setup guide, and demo
```
```
chore: release v1.0.0
```

---

### Phase 12 (Optional): Observability & Extras
- `/metrics` endpoint per service (`prom-client`), Prometheus + Grafana in compose
- Correlation ID passed through HTTP + events for tracing logs
- Rate limiting at gateway
- Admin role to manage flights/hotels

**Commit**
```
feat(observability): add Prometheus metrics and Grafana dashboards
```

---

## 12. Suggested Timeline (~2 weeks, part-time)

| Days | Phases |
|---|---|
| 1-2 | 0, 1, 2 |
| 3-4 | 3, 4 |
| 5-6 | 5, 6, 7 |
| 7-9 | 8 |
| 10-11 | 9, 10 |
| 12-13 | 11 (polish) |
| 14 | Buffer / optional phase 12 |

**If time runs short:** merge notification into a console logger, skip Redis (use a DB `held_until` column), and skip optional phase 12. The saga flow with RabbitMQ is the part most worth keeping.

---

## 13. Risks & Decisions

| Topic | Decision |
|---|---|
| Too many services for the timeline | Keep to 5; notification can be trivial |
| Shared JWT secret | Fine for a local project; note real systems would use asymmetric keys / an identity provider |
| Distributed transactions | Use saga + idempotent consumers instead of 2PC |
| One DB container vs many | Start with one Postgres container hosting multiple databases; split later if needed |
| Service-to-service HTTP calls | Only booking -> catalog for read checks; everything else via events |

---

## 14. Definition of Done

- [ ] `docker compose up --build` starts the entire system from a clean clone
- [ ] A user can register, search, book, and see status go `PENDING -> CONFIRMED`
- [ ] Payment failure leads to `CANCELLED` and inventory is released
- [ ] Cancel flow triggers refund + notification
- [ ] Tests pass in CI
- [ ] README has architecture diagram and demo GIF