#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# AeroCRM — One-command setup script
# Usage: ./setup.sh
# ─────────────────────────────────────────────────────────────────────────────

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

log_step() { echo -e "\n${CYAN}${BOLD}▶ $1${NC}"; }
log_ok()   { echo -e "${GREEN}✔ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
log_err()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo -e "${BOLD}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║         AeroCRM — Setup Script           ║"
echo "  ║   Airline Operations CRM Platform        ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ── Check prerequisites ────────────────────────────────────────────────────
log_step "Checking prerequisites"
command -v docker  >/dev/null 2>&1 || log_err "Docker not found. Install Docker Desktop: https://docs.docker.com/get-docker/"
command -v docker compose version >/dev/null 2>&1 || log_err "Docker Compose v2 not found. Update Docker Desktop."
log_ok "Docker and Docker Compose found"

# ── Build and start containers ─────────────────────────────────────────────
log_step "Building and starting services (this may take a few minutes on first run)"
docker compose down --remove-orphans 2>/dev/null || true
docker compose build --parallel
docker compose up -d
log_ok "All containers started"

# ── Wait for MySQL to be healthy ───────────────────────────────────────────
log_step "Waiting for MySQL to be ready"
RETRIES=30
COUNT=0
until docker compose exec -T mysql mysqladmin ping -h localhost -u root -paerocrm_pass --silent 2>/dev/null; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $RETRIES ]; then
    log_err "MySQL did not become healthy in time. Run: docker compose logs mysql"
  fi
  echo -n "."
  sleep 3
done
echo ""
log_ok "MySQL is ready"

# ── Run Prisma migrations ──────────────────────────────────────────────────
log_step "Running database migrations"
docker compose exec -T backend npx prisma migrate deploy
log_ok "Migrations applied"

# ── Run seed data ──────────────────────────────────────────────────────────
log_step "Seeding database with demo data"
docker compose exec -T backend npx ts-node prisma/seed.ts 2>/dev/null || \
  docker compose exec -T backend npx prisma db seed
log_ok "Seed data loaded"

# ── Pull Llama 3 model ─────────────────────────────────────────────────────
log_step "Pulling Llama 3 model into Ollama (first run: ~4GB download)"
log_warn "This step may take several minutes depending on your connection speed."
log_warn "Press Ctrl+C to skip — AI features will be unavailable until the model is pulled."
docker compose exec -T ollama ollama pull llama3 || log_warn "Could not pull llama3. Run manually: docker compose exec ollama ollama pull llama3"
log_ok "Llama 3 model ready"

# ── Wait for backend health ────────────────────────────────────────────────
log_step "Waiting for backend to be healthy"
RETRIES=20
COUNT=0
until curl -sf http://localhost:3100/api/health >/dev/null 2>&1; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $RETRIES ]; then
    log_warn "Backend health check timed out — it may still be starting. Check: docker compose logs backend"
    break
  fi
  echo -n "."
  sleep 3
done
echo ""
log_ok "Backend is healthy"

# ── Done ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║          AeroCRM is ready!                          ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Application:${NC}  http://localhost"
echo -e "  ${BOLD}Backend API:  http://localhost:3100/api"
echo -e "  ${BOLD}Ollama:${NC}       http://localhost:11434"
echo ""
echo -e "  ${BOLD}${YELLOW}Demo Credentials:${NC}"
echo -e "  ┌──────────────────────────────────────────────────┐"
echo -e "  │  ${BOLD}Admin${NC}          admin@aerocrm.com   / Admin1234!   │"
echo -e "  │  ${BOLD}Flight Agent${NC}   agent1@aerocrm.com  / Agent1234!   │"
echo -e "  │  ${BOLD}Support Op.${NC}    support1@aerocrm.com/ Support1234! │"
echo -e "  └──────────────────────────────────────────────────┘"
echo ""
echo -e "  ${CYAN}Useful commands:${NC}"
echo -e "  docker compose logs -f backend    # Backend logs"
echo -e "  docker compose logs -f frontend   # Frontend logs"
echo -e "  docker compose down               # Stop all services"
echo -e "  docker compose exec mysql mysql -u root -paerocrm_pass aerocrm"
echo ""
