#!/usr/bin/env bash
# Respaldo de la base compartida (TS-025). Equivalente a db-backup.ps1 para macOS y Linux.
# Uso (desde la raíz del repositorio):  ./scripts/db-backup.sh
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
# Usa backend/.env.compartida si existe; si no, backend/.env.
envfile="$root/backend/.env.compartida"; [ -f "$envfile" ] || envfile="$root/backend/.env"
url="$(grep -E '^\s*DIRECT_URL\s*=' "$envfile" | head -1 | sed -E 's/^\s*DIRECT_URL\s*=\s*//; s/^["'"'"']//; s/["'"'"']$//')"
[ -n "$url" ] || { echo "DIRECT_URL no está definida en $envfile" >&2; exit 1; }
mkdir -p "$root/backups"
name="aerocrm-$(date +%Y%m%d-%H%M).dump"
docker run --rm -v "$root/backups:/backups" postgres:17-alpine \
  pg_dump "$url" --format=custom --no-owner --no-privileges --file "/backups/$name" \
  || { echo "La base no respondió o el respaldo falló. Avisa al responsable de la base hoy mismo." >&2; exit 1; }
ls -1t "$root"/backups/aerocrm-*.dump | tail -n +15 | xargs -r rm --
echo "Respaldo listo: backups/$name"
