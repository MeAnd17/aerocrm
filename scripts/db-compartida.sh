#!/usr/bin/env bash
# Migraciones y carga de arranque contra la base compartida (TS-025). Equivalente a db-compartida.ps1.
# Solo para los responsables de integración (AGENTS.md G4).
#
# Uso (desde la raíz del repositorio):  ./scripts/db-compartida.sh estado|migrar|cargar
#
# Toma las cadenas de backend/.env.compartida (usuario postgres; no se versiona) y no toca backend/.env.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
file="$root/backend/.env.compartida"
[ -f "$file" ] || { echo "Falta backend/.env.compartida: copia backend/.env.compartida.example y completa la contraseña (ver docs/BASE-DE-DATOS.md)." >&2; exit 1; }

leer() { grep -E "^\s*$1\s*=" "$file" | head -1 | sed -E "s/^\s*$1\s*=\s*//; s/^[\"']//; s/[\"']\s*$//"; }
DATABASE_URL="$(leer DATABASE_URL)"
DIRECT_URL="$(leer DIRECT_URL)"
if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ] || [[ "$DATABASE_URL$DIRECT_URL" == *"<"* ]] || [[ "$DATABASE_URL$DIRECT_URL" == *">"* ]]; then
  echo "Completa la contraseña en DATABASE_URL y DIRECT_URL de backend/.env.compartida, sin los signos < >." >&2; exit 1
fi
for url in "$DATABASE_URL" "$DIRECT_URL"; do
  pass="${url#postgresql://*:}"; pass="${pass%@*}"
  if [[ "$pass" =~ [^A-Za-z0-9%._~-] ]]; then
    echo "La contraseña tiene símbolos sin codificar. Cada símbolo va como %XX (por ejemplo * es %2A, @ es %40, # es %23); ver docs/BASE-DE-DATOS.md." >&2; exit 1
  fi
done
export DATABASE_URL DIRECT_URL

# Las variables ya definidas tienen prioridad sobre backend/.env, así que Prisma usa estas.
cd "$root/backend"
case "${1:-}" in
  estado) npx prisma migrate status || true ;;  # termina con 1 si hay migraciones pendientes
  migrar) npx prisma migrate deploy ;;
  cargar) npx prisma db seed ;;
  *) echo "Uso: ./scripts/db-compartida.sh estado|migrar|cargar" >&2; exit 1 ;;
esac
