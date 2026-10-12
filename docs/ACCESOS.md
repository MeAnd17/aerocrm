# Accesos

Qué accesos tiene el proyecto, quién los tiene y cómo se piden. **Aquí no hay ningún valor secreto**: contraseñas, cadenas de conexión y claves nunca se escriben en el repositorio (AGENTS.md D4).

## Dónde están los valores

Los valores están en la página **AeroCRM · Accesos** del Notion del equipo. Esa página se comparte solo con los integrantes, nunca con un enlace público.

Si todavía no tienes acceso a la página, pídele los valores por mensaje privado a un responsable de integración (AGENTS.md G4). Nunca se pegan en el grupo, en un PR, en un issue ni en el chat de una herramienta de IA.

Si un valor se filtra, se avisa el mismo día a un responsable de integración. Él lo cambia y actualiza la página.

## Qué accesos hay

| Acceso | Quién lo tiene | Cómo se obtiene |
|---|---|---|
| Repositorio en GitHub | Todo el equipo, como colaborador | Un responsable de integración te invita con tu usuario de GitHub. Todo entra por PR (AGENTS.md G1 y G4) |
| Base compartida, usuario `aerocrm_equipo` | Todo el equipo | Cadenas `DATABASE_URL` y `DIRECT_URL` de la página de Accesos, en tu `backend/.env` |
| Base compartida, usuario `postgres` | Solo los responsables de integración | Panel de Supabase. Se guarda en `backend/.env.compartida` (plantilla en `backend/.env.compartida.example`), que usan `scripts/db-compartida` y el respaldo. Es el único usuario que aplica migraciones y la carga de arranque |
| Panel de Supabase (proyecto `aerocrm`) | Solo los responsables de integración | Invitación a la organización de Supabase |
| `JWT_SECRET` | Todo el equipo, el mismo valor | Página de Accesos. Si cada uno usa uno distinto, las sesiones no sirven entre máquinas |
| `CALENDARIFIC_API_KEY` y `OPENWEATHER_API_KEY` | Opcional | Página de Accesos, o una clave propia gratuita en calendarific.com y openweathermap.org. Sin clave se usan los datos de respaldo |
| Secreto `SUPABASE_DIRECT_URL` de GitHub Actions | Solo los responsables de integración | Settings → Secrets and variables → Actions. Lo usa el aviso diario de caída |
| Maqueta de referencia (Google Stitch) | Todo el equipo | Invitación al proyecto «Agencia de Viajes Personalizada» |
| Usuarios de demostración | Todo el equipo | Están en el README. Son datos de prueba de la carga de arranque y no protegen nada |
| Base local en contenedor | Todo el equipo | `aerocrm` / `aerocrm` en `localhost:5433`, dentro de `docker-compose.local.yml`. Solo existe en tu máquina |

## Los dos usuarios de la base compartida

| | `aerocrm_equipo` | `postgres` |
|---|---|---|
| Leer y escribir datos | Sí | Sí |
| Crear, cambiar o borrar tablas | No | Sí |
| `npx prisma migrate deploy` y `npx prisma db seed` | No | Sí |
| Lo usa | El backend de cada integrante | Quien aplica migraciones (AGENTS.md G4) |

Con `aerocrm_equipo`, si alguien corre por error `prisma migrate dev`, `migrate reset` o `db push` contra la base compartida, el comando falla por permisos y la base queda intacta. Los cambios de esquema se prueban siempre en la base local (ver [BASE-DE-DATOS.md](BASE-DE-DATOS.md)).

Los permisos de cada usuario están en `scripts/supabase-usuarios.sql`.

## Al entrar o salir alguien del equipo

- **Entra:** se le invita al repositorio y a la maqueta, y se le comparte la página de Accesos.
- **Sale:** se le quita del repositorio, de la maqueta y de la página. Se cambian la contraseña de `aerocrm_equipo` y `JWT_SECRET`, se actualiza la página y se avisa al resto para que actualice su `.env`.
