# Base de datos compartida

Guía de operación de la base de AeroCRM (TS-003, TS-025). Las reglas que la gobiernan están en AGENTS.md §6 y G4.

## Dónde está

| Dato | Valor |
|---|---|
| Proveedor | Supabase, plan gratuito |
| Proyecto | `aerocrm` (ref `rjlgbxywcmwhqvmgbqtv`) |
| Región | São Paulo (`sa-east-1`), la más cercana a Lima |
| Motor | PostgreSQL 17 |
| Usuarios | `aerocrm_equipo` para el equipo (solo datos) y `postgres` para los responsables de integración (también estructura). Ver [ACCESOS.md](ACCESOS.md) |

Cada integrante copia sus dos cadenas de conexión de la página de Accesos (ver [ACCESOS.md](ACCESOS.md)) a su `backend/.env`. Nunca se pegan en el chat del grupo ni en archivos versionados.

## Las dos conexiones

| Variable | Para qué | Dónde se copia en Supabase |
|---|---|---|
| `DATABASE_URL` | Lo que usa el backend al trabajar | Connect → **Transaction pooler** (puerto 6543), agregando `?pgbouncer=true&connection_limit=3` |
| `DIRECT_URL` | Solo para aplicar migraciones | Connect → **Session pooler** (puerto 5432) |

El host del pooler es `aws-0-sa-east-1.pooler.supabase.com`. En las dos cadenas el usuario va con el código del proyecto detrás: `aerocrm_equipo.rjlgbxywcmwhqvmgbqtv` para el equipo y `postgres.rjlgbxywcmwhqvmgbqtv` para quien aplica migraciones. Con `aerocrm_equipo`, `DIRECT_URL` existe solo porque Prisma la pide; no sirve para migrar.

`connection_limit=3` limita a tres las conexiones que abre el backend de cada integrante. Seis máquinas encendidas a la vez usan como máximo 18, por debajo del límite del plan gratuito.

Se usa el pooler de sesión y no la conexión directa (`db.<ref>.supabase.co`) porque la directa solo funciona por IPv6 en el plan gratuito y muchas redes domésticas no lo tienen.

## Primera puesta en marcha

Se hace una sola vez, al crear el proyecto de Supabase. La hace un responsable de integración.

1. En Supabase → Project Settings → Database, fija la contraseña de `postgres`.
2. En Supabase → SQL Editor, corre `scripts/supabase-usuarios.sql`. Después ponle contraseña al usuario del equipo, usando solo letras y números:

        alter role aerocrm_equipo password '<contraseña>';

3. Copia `backend/.env.compartida.example` a `backend/.env.compartida` (no se versiona), reemplaza `<CONTRASEÑA>` en las dos cadenas por la contraseña de `postgres`, y crea las tablas con los datos:

        powershell -ExecutionPolicy Bypass -File scripts/db-compartida.ps1 migrar
        powershell -ExecutionPolicy Bypass -File scripts/db-compartida.ps1 cargar

   En macOS o Linux: `./scripts/db-compartida.sh migrar` y `./scripts/db-compartida.sh cargar`. El script usa ese archivo y no toca tu `backend/.env`, así que tu backend sigue con la base que estés usando.

4. Anota las cadenas de `aerocrm_equipo` y el `JWT_SECRET` en la página de Accesos.
5. Carga el secreto `SUPABASE_DIRECT_URL` en GitHub para el aviso diario de caída.

## Cambios de esquema

1. Quien cambia el esquema trabaja contra su base local: `docker compose -f docker-compose.yml -f docker-compose.local.yml up -d postgres`, con `DATABASE_URL` y `DIRECT_URL` apuntando a `localhost:5433`.
2. Crea la migración con `npx prisma migrate dev --name descripcion_corta` y actualiza la carga de arranque en el mismo PR (AGENTS.md D1).
3. Cuando el PR se aprueba y entra a `main`, quien aplica migraciones (AGENTS.md G4) corre contra la base compartida:

        powershell -ExecutionPolicy Bypass -File scripts/db-compartida.ps1 migrar
        powershell -ExecutionPolicy Bypass -File scripts/db-compartida.ps1 cargar     # solo si cambió la carga de arranque

4. Nadie más ejecuta cambios de estructura contra la base compartida, y el usuario `aerocrm_equipo` no tiene permiso para hacerlo. Nunca `migrate dev`, `migrate reset` ni `db push` contra Supabase.
5. `npx prisma db seed` contra la base compartida también lo corre solo quien aplica migraciones: borra y vuelve a crear las reservas de los clientes de demostración.

## Respaldo diario

Al cierre de cada día de trabajo, el responsable de la base corre desde la raíz del repositorio:

    powershell -ExecutionPolicy Bypass -File scripts/db-backup.ps1     # Windows
    ./scripts/db-backup.sh                                             # macOS / Linux

El respaldo usa `backend/.env.compartida` (o `backend/.env` si no existe) y queda en `backups/` en su máquina, fuera de la nube y fuera del repositorio. Se conservan los 14 más recientes.

Para restaurar (borra lo que haya en la base destino; avisar al equipo antes):

    docker run --rm -v "${PWD}/backups:/backups" postgres:17-alpine pg_restore --clean --if-exists --no-owner -d "<DIRECT_URL>" /backups/<archivo>.dump

## Aviso de caída

- **Responsable único de restablecer la base:** [CONFIRMAR: uno de los responsables de integración].
- El flujo `Salud de la base` (`.github/workflows/db-health.yml`) consulta la base todos los días a las 8:00 de Lima. Si falla, GitHub avisa por correo. Necesita el secreto `SUPABASE_DIRECT_URL` en el repositorio.
- El respaldo diario también falla si la base no responde.
- Cualquier integrante que vea `/api/health` en 503 avisa en el grupo el mismo día.

Causas más probables y qué hacer:

| Síntoma | Causa probable | Qué hace el responsable |
|---|---|---|
| Todo falla desde todas las máquinas | Supabase pausó el proyecto por 7 días sin actividad | Dashboard de Supabase → Restore project |
| `too many connections` | Alguien sin `connection_limit` o con varios backends abiertos | Revisar la `DATABASE_URL` de cada integrante |
| Faltan datos | Borrado por error | Restaurar el último respaldo |
