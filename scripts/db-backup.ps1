# Respaldo de la base compartida (TS-025).
# Uso (desde la raíz del repositorio):  powershell -ExecutionPolicy Bypass -File scripts/db-backup.ps1
# Requiere Docker Desktop. Lee DIRECT_URL de backend/.env y guarda el respaldo en backups/ (no se versiona).
# Si la base no responde, termina con error: ese es el aviso de caída (ver docs/BASE-DE-DATOS.md).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root 'backend/.env'
if (-not (Test-Path $envFile)) { throw "No existe backend/.env" }
$line = Get-Content $envFile | Where-Object { $_ -match '^\s*DIRECT_URL\s*=' } | Select-Object -First 1
if (-not $line) { throw "DIRECT_URL no está definida en backend/.env" }
$url = ($line -replace '^\s*DIRECT_URL\s*=\s*', '').Trim('"', "'", ' ')

$dir = Join-Path $root 'backups'
New-Item -ItemType Directory -Force $dir | Out-Null
$name = "aerocrm-$(Get-Date -Format 'yyyyMMdd-HHmm').dump"

# Supabase usa PostgreSQL 17: pg_dump debe ser de la misma versión o mayor.
docker run --rm -v "${dir}:/backups" postgres:17-alpine pg_dump "$url" --format=custom --no-owner --no-privileges --file "/backups/$name"
if ($LASTEXITCODE -ne 0) { throw "La base no respondió o el respaldo falló. Avisa al responsable de la base hoy mismo." }

# Conserva los 14 respaldos más recientes.
Get-ChildItem $dir -Filter 'aerocrm-*.dump' | Sort-Object Name -Descending | Select-Object -Skip 14 | Remove-Item
Write-Host "Respaldo listo: backups/$name"
