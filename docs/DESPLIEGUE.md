# Guía de despliegue — AeroCRM

Versión: Sprint 4 · 2026-11-11

---

## Requisitos previos

| Herramienta | Versión mínima | Verificación |
|-------------|----------------|--------------|
| Docker Desktop | 24.x | `docker --version` |
| Docker Compose | integrado con Docker Desktop | `docker compose version` |
| Git | cualquiera | `git --version` |
| Acceso al repositorio | — | `git clone <repo>` |

No se requiere Node.js, npm ni nada más en la máquina anfitriona.

---

## Levantamiento desde cero

### Opción A — base local (sin internet, recomendada para la demostración)

```bash
# 1. Clonar el repositorio
git clone <URL-DEL-REPO> aerocrm
cd aerocrm

# 2. Copiar y configurar las variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env:
#   - Dejar DATABASE_URL y DIRECT_URL comentadas (el compose local las sobreescribe)
#   - JWT_SECRET: cualquier cadena larga y aleatoria, ej. openssl rand -hex 32
#   - SEED_REFERENCE_DATE: fijar al día de la sustentación, ej. 2026-11-13

# 3. Levantar el sistema completo con base local
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

# 4. Esperar a que db-init termine (aplica migraciones y carga datos de arranque)
#    El backend solo arranca cuando db-init termina con éxito (exit code 0).
#    Verificar:
docker inspect aerocrm-db-init --format '{{.State.ExitCode}}'
# Debe devolver: 0

# 5. Verificar que el backend responde
curl http://127.0.0.1:3100/api/health
# Debe devolver: {"status":"ok","app":"AeroCRM API","database":"ok","timestamp":"..."}
```

La plataforma queda disponible en:
- **Frontend:** `http://127.0.0.1:8100`
- **API:** `http://127.0.0.1:3100/api`
- **Swagger:** `http://127.0.0.1:3100/api/docs`
- **PostgreSQL local:** `127.0.0.1:5433` (usuario `aerocrm`, contraseña `aerocrm`, base `aerocrm`)

### Opción B — base compartida en Supabase

```bash
# Mismos pasos 1–2, pero en backend/.env descomentar las líneas de Supabase
# con los valores de docs/ACCESOS.md, y ejecutar solo:
docker compose up -d --build
```

---

## Credenciales de demostración

| Rol | Correo | Contraseña | Nivel |
|-----|--------|-----------|-------|
| Cliente Explorador | `ana.garcia@demo.pe` | `Demo1234!` | Explorador · 0 viajes |
| Cliente Viajero | `diego.salazar@demo.pe` | `Demo1234!` | Viajero · 4 viajes |
| Cliente Elite | `valeria.torres@demo.pe` | `Demo1234!` | Elite · 16 viajes |
| Administrador | `admin@aerocrm.com` | `Admin1234!` | — |

> Estas credenciales pertenecen exclusivamente a la carga de arranque del entorno local/demo. No son credenciales de producción.
> El administrador puede cambiar la contraseña desde `/admin/perfil`; hacerlo no afecta la guía de despliegue.

---

## Verificar que todo funciona

```bash
# Backend y base de datos
curl http://127.0.0.1:3100/api/health

# Frontend (debe devolver HTML con <title>AeroCRM</title>)
curl -s http://127.0.0.1:8100 | grep -o "<title>.*</title>"

# Contenedores en pie
docker ps --filter "name=aerocrm" --format "table {{.Names}}\t{{.Status}}"
```

---

## Recarga de datos de arranque

Si los datos de demostración quedaron en mal estado (p. ej. después de pruebas):

```bash
docker exec aerocrm-db-init sh -c "npx prisma db seed"
# Si el contenedor ya no existe:
docker compose -f docker-compose.yml -f docker-compose.local.yml run --rm db-init sh -c "npx prisma db seed"
```

La carga de arranque es idempotente: ejecutarla dos veces deja exactamente el mismo estado (AGENTS.md D5).

---

## Parar el sistema

```bash
# Parar sin borrar datos
docker compose -f docker-compose.yml -f docker-compose.local.yml down

# Volver a levantar (sin rebuild, datos persistidos en volumen)
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

> No ejecutar `docker compose down -v` ni `docker volume rm aerocrm_pg_local`: borra todos los datos.

---

## Fecha de los datos de arranque

Los vuelos de la carga de arranque se generan relativos a `SEED_REFERENCE_DATE`. Fijar esta variable al día de la sustentación antes de levantar el sistema:

```bash
# En backend/.env:
SEED_REFERENCE_DATE="2026-11-13"
```

Si se cambia la variable, reiniciar con `--build` para que el backend tome el nuevo valor:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

---

## Solución de problemas frecuentes

| Síntoma | Causa probable | Solución |
|---------|---------------|---------|
| `aerocrm-db-init` sale con código 1 | Migraciones pendientes o seed falló | `docker logs aerocrm-db-init` para ver el error |
| `/api/health` devuelve `"database":"error"` | El backend no llega a la base | Verificar que `aerocrm-postgres` esté corriendo: `docker ps` |
| Puerto 8100 o 3100 ya en uso | Otro proceso ocupa el puerto | Cambiar el puerto externo en `docker-compose.yml` o detener el proceso |
| `P2003` en el seed | FK de `review` bloqueó el `booking.deleteMany` | Actualizar a la versión del Sprint 4 (el seed corrige el orden de borrado) |
| Login no redirige | Token inválido o `JWT_SECRET` cambiado | Limpiar `localStorage` del navegador y volver a iniciar sesión |
| Pantalla en blanco | Fallo de Angular | Abrir consola del navegador (F12); si es un error de red, verificar que el backend esté corriendo |

---

## Demostración sin red

El sistema funciona completamente sin conexión a internet:

- Los precios de vuelos y hoteles vienen de la base de datos local.
- El clima mensual y los feriados nacionales tienen datos de respaldo en la base (`WeatherCache` y `HolidayCache`).
- Las claves de API externas (`CALENDARIFIC_API_KEY`, `OPENWEATHER_API_KEY`) pueden estar vacías; en ese caso se usan los datos de respaldo.
- El frontend se sirve desde el contenedor `aerocrm-frontend` (Nginx); no hay CDN ni recursos externos.
