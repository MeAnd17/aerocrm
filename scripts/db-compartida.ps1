# Migraciones y carga de arranque contra la base compartida (TS-025).
# Solo para los responsables de integración (AGENTS.md G4).
#
# Uso (desde la raíz del repositorio):
#   powershell -ExecutionPolicy Bypass -File scripts/db-compartida.ps1 estado    # qué migraciones faltan
#   powershell -ExecutionPolicy Bypass -File scripts/db-compartida.ps1 migrar    # npx prisma migrate deploy
#   powershell -ExecutionPolicy Bypass -File scripts/db-compartida.ps1 cargar    # npx prisma db seed
#
# Toma las cadenas de backend/.env.compartida (usuario postgres; no se versiona) y no toca
# backend/.env, así que tu backend sigue apuntando a la base que estés usando (local o compartida).
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('estado', 'migrar', 'cargar')]
  [string]$accion
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$file = Join-Path $root 'backend/.env.compartida'
if (-not (Test-Path $file)) { throw "Falta backend/.env.compartida: copia backend/.env.compartida.example y completa la contraseña (ver docs/BASE-DE-DATOS.md)." }

foreach ($line in Get-Content $file) {
  if ($line -match '^\s*(DATABASE_URL|DIRECT_URL)\s*=\s*(.+?)\s*$') {
    Set-Item "env:$($matches[1])" ($matches[2].Trim('"', "'"))
  }
}
if (-not $env:DATABASE_URL -or -not $env:DIRECT_URL -or "$env:DATABASE_URL$env:DIRECT_URL" -match '<|>') {
  throw "Completa la contraseña en DATABASE_URL y DIRECT_URL de backend/.env.compartida, sin los signos < >."
}
foreach ($url in @($env:DATABASE_URL, $env:DIRECT_URL)) {
  if ($url -match '^postgresql://[^:]+:(.*)@[^@]+$' -and $matches[1] -match '[^A-Za-z0-9%._~-]') {
    throw "La contraseña tiene símbolos sin codificar. Cada símbolo va como %XX (por ejemplo * es %2A, @ es %40, # es %23); ver docs/BASE-DE-DATOS.md."
  }
}

# Las variables ya definidas tienen prioridad sobre backend/.env, así que Prisma usa estas.
Push-Location (Join-Path $root 'backend')
try {
  switch ($accion) {
    'estado' { npx prisma migrate status }
    'migrar' { npx prisma migrate deploy }
    'cargar' { npx prisma db seed }
  }
  # migrate status termina con código 1 cuando hay migraciones pendientes: no es un error.
  if ($LASTEXITCODE -ne 0 -and $accion -ne 'estado') { throw "El comando terminó con error." }
}
finally { Pop-Location }
