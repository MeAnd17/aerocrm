# AeroCRM — Airline Operations CRM

A premium, full-stack CRM system built for the aviation industry. Centralizes passenger management, real-time flight operations, reservations, omnichannel support, and local AI assistance — all in a single, elegant platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 10 (TypeScript), REST API + WebSockets |
| Frontend | Angular 17 (Standalone components, Signals) |
| Database | MySQL 8 via Prisma ORM |
| AI Engine | Ollama running Llama 3 (8B) — fully local |
| Design | Tailwind CSS (navy + gold theme), Phosphor Icons |
| Auth | JWT + Dynamic RBAC (roles/permissions in DB) |
| Deployment | Docker Compose (single-command setup) |

---

## Quick Start

**Prerequisites:** Docker Desktop installed and running.

```bash
git clone <repo-url>
cd aerocrm
./setup.sh
```

Open **http://localhost** in your browser.

> First run downloads ~4GB for the Llama 3 model. AI features are optional — the rest of the system works immediately.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Administrator** | admin@aerocrm.com | Admin1234! |
| **Flight Agent** | agent1@aerocrm.com | Agent1234! |
| **Support Operator** | support1@aerocrm.com | Support1234! |

---

## Modules

### Dashboard
Real-time KPI cards (flights today, active passengers, open tickets, ancillary revenue), upcoming flights panel with live status, and a live activity feed updated via WebSocket.

### Passengers — Profile 360°
Full CRUD with strict validations: passport format, date of birth bounds, expiry minimum 6 months ahead. Profile view with 5 tabs: personal info, documents (validity status), flight history, reservations, and support tickets.

### Flights & Operations
Flight management with real-time status updates via WebSocket — change a status in one browser tab and it reflects instantly in all others. Status transitions are validated (cannot revert a landed flight, etc.). Includes a full-screen departure board in monospace style.

### Reservations & Ancillaries
3-step wizard: select flight (only bookable flights shown) → select passenger + seat → add ancillary services with quantity steppers. Live price total. Detail view shows a boarding pass design. Check-in button activates only within 24h of departure.

### Support Omnichannel
Two-panel inbox with tickets from Web, Email, WhatsApp, Phone, and Twitter channels. Reply composer with internal note toggle. "Simulate" button injects realistic demo tickets with slide-in animation.

### AI Assistant (Human-in-the-Loop)
Clicking "Analyze with AI" sends the ticket + full passenger/flight context to Ollama. Returns sentiment label/score, a 2–3 sentence summary, a suggested reply (editable before sending), and contextual ancillary cross-sell recommendations. The operator always makes the final decision.

### Administration
Users tab (create/edit users with password rules, assign roles). Roles tab (CRUD, protected deletion if users assigned). Permission Matrix — a checkbox grid of module × action (create/read/update/delete) that toggles permissions instantly.

---

## Architecture

```
aerocrm/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── auth/         # JWT + RBAC guards
│   │   ├── passengers/
│   │   ├── flights/      # + WebSocket Gateway
│   │   ├── reservations/
│   │   ├── support/
│   │   ├── ai/           # Ollama client + prompt builder
│   │   ├── admin/
│   │   └── dashboard/
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts       # 20 passengers, 15 flights, 30 reservations, 20 tickets
├── frontend/             # Angular 17
│   ├── src/app/
│   │   ├── core/         # Guards, interceptors, socket service, shell layout
│   │   ├── shared/       # Toast, pipes, permission directive
│   │   └── features/     # One folder per module
│   └── nginx.conf
├── docker-compose.yml
└── setup.sh
```

---

## Useful Commands

```bash
# Stop all services
docker compose down

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Access MySQL
docker compose exec mysql mysql -u root -paerocrm_pass aerocrm

# Re-run seed
docker compose exec backend npx prisma db seed

# Pull AI model manually
docker compose exec ollama ollama pull llama3

# Rebuild after code changes
docker compose build --parallel && docker compose up -d
```

---

## Validation Rules (key examples)

| Field | Rule |
|---|---|
| Date of Birth | Must be past, max 120 years ago |
| Passport Expiry | At least 6 months in the future |
| Passport Number | 6–9 uppercase alphanumeric characters |
| Flight Number | Format: XX-1234 (e.g. AE-1001) |
| Arrival Time | Must be after Departure Time |
| Seat Count | Economy + Business + First ≤ Total; Economy ≥ 1; others ≥ 0 |
| Reservation Price | Must be positive (> 0) |
| Ancillary Quantity | 1 to type-specific maximum (1–7 units) |
| Password | Min 8 chars, 1 uppercase, 1 number |
| Support Message | 1–2000 characters |

---

## AI Design Principles

- **Human-in-the-Loop**: the AI panel generates suggestions only. The "Send Reply" button is the operator's explicit action.
- **Context injection**: before calling Ollama, the backend queries MySQL for the passenger's tier, flight status, and existing ancillaries. No hallucinated context.
- **Graceful degradation**: if Ollama is offline, an informative error is shown and the rest of the system continues working normally.
- **Rate limiting**: maximum one AI analysis per ticket every 30 seconds.
