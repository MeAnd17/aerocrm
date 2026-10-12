# Inventario del código heredado

Estado de cada pieza del repositorio al inicio del Sprint 0 (commit base `2f2164e`). Este documento es la única fuente sobre qué se conserva, qué se rehace y qué se retira (AGENTS.md §13). La columna **Decisión** la llenan los responsables de integración; mientras esté vacía, la pieza no se borra ni se usa como referencia.

Leyenda de recomendación: **conservar** (se usa y cumple, o se ajusta en una historia ya planificada) · **rehacer** (la función se necesita pero el código no sirve de base) · **retirar** (no se usa y pertenece a otro sistema).

## Hallazgo principal

El repositorio mezcla dos sistemas. Las pantallas enrutadas son de AeroCRM (agencia de viajes). Las no enrutadas son de un CRM de operaciones de aerolínea anterior: portal de staff, panel con barra lateral, estados de vuelo en vivo por WebSocket y niveles PLATINUM/GOLD/SILVER/STANDARD. Ninguna de esas piezas compila si se enruta, porque llaman métodos y servicios que ya no existen (`FlightsSocketService`, `AuthService.registerClient`, `AuthService.changePassword`, `AuthService.hasPermission`).

## Frontend

| Archivo | Qué hace hoy | ¿Se usa? (evidencia) | Choques con AGENTS.md | Historia S0 | Recomendación | Decisión |
|---|---|---|---|---|---|---|
| `app.component.ts`, `app.config.ts`, `app.routes.ts` | Raíz, proveedores y rutas | Sí: arranque de la app | — | TS-008, TS-009 | conservar | |
| `core/guards/auth.guard.ts` | `authGuard` y `noAuthGuard` | Sí: `app.routes.ts` | — | — | conservar | |
| `core/guards/no-auth.guard.ts` | Copia de `noAuthGuard` | No: las rutas importan el de `auth.guard.ts` | duplicado | — | retirar | |
| `core/interceptors/auth.interceptor.ts` | Agrega el token JWT | Sí: `app.config.ts` | — | — | conservar | |
| `core/services/api.service.ts` | Cliente HTTP único | Sí: 9 pantallas | — | — | conservar | |
| `core/services/auth.service.ts` | Login, registro, sesión | Sí: guards, login, registro | usa `HttpClient` directo (servicio de core, permitido) | — | conservar | |
| `core/services/toast.service.ts` | Avisos al usuario | Sí: `toast.component` | ninguna pantalla lo llama todavía | — | conservar | |
| `core/layout/shell/` | Contenedor del panel de operaciones | No: ninguna ruta | importa `FlightsSocketService` inexistente | — | retirar | |
| `core/layout/sidebar/`, `core/layout/topbar/` | Barra lateral y superior del panel de operaciones | Solo desde `shell` | WebSocket de vuelos, sistema anterior | — | retirar | |
| `core/layout/client-shell/` | Barra del portal de pasajero | No: ninguna ruta | F4 (33 estilos en línea), niveles PLATINUM/GOLD, rutas `/client` inexistentes | TS-008 | retirar (lo reemplaza la barra de TS-008) | |
| `features/auth/login/` | Login de AeroCRM | Sí: `/login` | — | — | conservar | |
| `features/auth/register/` | Registro de AeroCRM | Sí: `/register` | — | — | conservar | |
| `features/auth/client-login/` | Login del portal de pasajero | No: ninguna ruta; navega a `/client` | F4 (32 estilos en línea), duplica `login` | — | retirar | |
| `features/auth/client-register/` | Registro del portal de pasajero | No: ninguna ruta | llama `registerClient`, que no existe; duplica `register` | — | retirar | |
| `features/auth/staff-login/` | Login de staff de aerolínea | No: ninguna ruta; navega a `/dashboard` | F4 (36 estilos en línea) | — | retirar | |
| `features/auth/portal-selector/` | Portada con carrusel "Centro de Control de Vuelos" (562 líneas) | No: ninguna ruta | contenido de aerolínea | — | retirar | |
| `features/auth/change-password/` | Cambio de contraseña | No: ninguna ruta | F4 (25 estilos en línea); llama `changePassword`, que no existe ni en frontend ni en backend; navega a `/dashboard` | Sprint 1 | conservar como referencia y rehacer al enrutarla en el sprint 1 (no hay endpoint aún) | |
| `features/search/` | Explorar destinos | Sí: `/explore` y `/search` | — | — | conservar | |
| `features/destinations/destination-detail` | Detalle con clima y feriados | Sí: `/destinations/:id` | — | TS-015 | conservar | |
| `features/packages/package-builder` | Armador de 6 pasos en una sola pieza (307 líneas) | Sí: `/packages/new` | B7 (`pts * 0.1` en el frontend) | TS-009, TS-012 | rehacer la estructura (TS-009), sin cambio visible | |
| `features/home/` | Inicio del cliente | Sí: `/home` | B7 (umbrales de nivel en el frontend) | TS-012 | conservar; el umbral pasa a venir de la API | |
| `features/loyalty/` | Puntos y nivel | Sí: `/loyalty` | B7 (umbrales de nivel en el frontend) | TS-012 | conservar; el umbral pasa a venir de la API | |
| `features/my-trips/` (lista y detalle) | Mis viajes | Sí: `/my-trips`, `/my-trips/:id` | — | — | conservar | |
| `features/profile/` | Perfil y viajeros frecuentes | Sí: `/profile` | — | — | conservar | |
| `features/contact/` | Formulario de contacto | Sí: `/contact` | — | — | conservar | |
| `shared/components/toast/` | Muestra los avisos | Sí: `app.component.ts` | — | — | conservar | |
| `shared/directives/permission.directive.ts` | Muestra u oculta según permiso | No: ningún uso | llama `hasPermission`, que no existe | — | retirar; se rehace si el panel de administración lo necesita | |
| `shared/pipes/flight-status.pipe.ts` | Estados de vuelo en inglés (ON_TIME, BOARDING…) | No: ningún uso | sistema anterior | — | retirar | |
| `shared/pipes/relative-time.pipe.ts` | "hace 5 min" | No: ningún uso | — | — | conservar (genérico, útil para reseñas) | |
| `environments/*.ts` | URL de API y de WebSocket | Sí: `apiUrl` | `wsUrl` sin uso | TS-004 | conservar; quitar `wsUrl` | |
| `proxy.conf.json`, `nginx.conf` | Proxy de `/api` | Sí | tenían proxy de `/socket.io` (retirado en TS-002) | TS-002 | conservar | |
| `Dockerfile` | Build y nginx | Sí: `docker-compose.yml` | instalaba con `--legacy-peer-deps` | TS-004 | conservar con ajuste | |

## Backend

| Archivo o módulo | Qué hace hoy | ¿Se usa? (evidencia) | Choques con AGENTS.md | Historia S0 | Recomendación | Decisión |
|---|---|---|---|---|---|---|
| `main.ts` | Prefijo `/api`, validación global, CORS | Sí | sin Swagger | TS-015 | conservar | |
| `app.controller.ts` | `GET /api/health` | Sí: healthcheck de Docker | responde ok aunque no haya base; dice "Viajes CRM API" | TS-004 | conservar con ajuste | |
| `prisma/` (PrismaService) | Cliente único de base | Sí: todos los módulos | — | TS-003 | conservar | |
| `auth/` | Login, registro, `GET /auth/me`, JWT | Sí: frontend login y registro | área reservada | — | conservar | |
| `auth/dto/register-client.dto.ts`, `auth/dto/change-password.dto.ts` | DTOs sin endpoint | No: ningún controller los usa | sistema anterior | Sprint 1 | conservar `change-password` para el sprint 1; retirar `register-client` | |
| `auth/guards/permissions.guard.ts`, `decorators/require-permission` | Permisos por ruta | No: ningún controller los usa | — | — | conservar (B4, panel de administración) | |
| `bookings/` | Reservas, compra en transacción, cancelación | Sí: armador y mis viajes | B7 (descuento por nivel escrito aquí) | TS-012 | conservar; las reglas pasan al motor | |
| `clients/` | Perfil, inicio, viajeros, destinos guardados | Sí | B7 (niveles escritos aquí) | TS-012 | conservar; las reglas pasan al motor | |
| `destinations/` | Catálogo, contexto (clima y feriados), vuelos | Sí | B5 (`Number(precio) * pasajeros`) | TS-014, TS-015 | conservar | |
| `loyalty/` | Estado, historial, subida de nivel | Sí | B7 (tercera copia de las reglas) | TS-012 | rehacer como motor único | |
| `contact/` | Guarda mensajes de contacto | Sí: `/contact` | — | — | conservar | |
| `prisma/schema.prisma` | Esquema completo (17 modelos) | Sí | sin migraciones versionadas | TS-003 | conservar | |
| `prisma/seed.ts` | Carga de arranque | Sí: `prisma db seed` | no idempotente | TS-005, TS-014 | conservar con ajuste | |
| `prisma/seed.js`, `seed.js.map`, `seed.d.ts` | Compilado del seed | No: `prisma.seed` ejecuta `seed.ts` | D6 | TS-005 | retirar | |
| `tsconfig.tsbuildinfo`, `tsconfig.build.tsbuildinfo` | Caché del compilador | No | D6; además puede dejar `dist/` vacío tras `nest build` | TS-006 | retirar | |
| `.nestcli.json` | Configuración de Nest con nombre incorrecto | No: Nest busca `nest-cli.json` | — | TS-002 | renombrado en TS-002 | conservar |
| `Dockerfile` | Imagen del backend | Sí | `--legacy-peer-deps`, `npm install` en vez de `npm ci` | TS-004 | conservar con ajuste | |
| Dependencias `socket.io`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `@nestjs/axios`, `@nestjs/mapped-types` | — | No: ningún import | sistema anterior | TS-002 | retiradas en TS-002 | retirar |

## Raíz e infraestructura

| Archivo | Qué hace hoy | ¿Se usa? | Choques con AGENTS.md | Historia S0 | Recomendación | Decisión |
|---|---|---|---|---|---|---|
| `docker-compose.yml` | Postgres, backend y frontend con nombres `viajes-*` | Sí | D4: secreto JWT y contraseña de base escritos en el archivo; healthcheck que no comprueba la base | TS-004 | rehacer | |
| `setup.sh` | Instalador "Airline Operations CRM Platform" | No: espera un servicio `mysql` que no existe y nunca termina | sistema anterior; D4 (contraseña escrita) | TS-004 | retirar | |
| `README.md` | Descripción del proyecto | Parcial: describe carpetas y servicios que no existen | — | TS-006 | rehacer | |
| `.gitignore` | Exclusiones | Sí | reglas de `mysql_data/` y `ollama_data/` de otro sistema | TS-006 | conservar con ajuste | |
| `backend/.env.example` | Variables de ejemplo | Sí | falta `DIRECT_URL` | TS-003, TS-025 | conservar con ajuste | |

## Deuda conocida por historia

- **TS-002** (hecho): dependencias de WebSocket y gráficos retiradas, proxy de `/socket.io` retirado, `nest-cli.json` renombrado, lint y pruebas instalados. Quedan 14 advertencias de lint heredadas (12 `no-explicit-any`, 2 `no-unused-vars`).
- **TS-004**: secretos fuera de `docker-compose.yml`, healthcheck real, Dockerfiles con `npm ci`, `setup.sh` retirado, `wsUrl` fuera de `environments`.
- **TS-005**: seed idempotente; compilados del seed fuera del repositorio.
- **TS-006**: `*.tsbuildinfo` fuera del repositorio, `.gitignore` limpio, README real.
- **TS-008**: barra común nueva en reemplazo de `client-shell`.
- **TS-009**: armador dividido.
- **TS-012**: reglas de fidelización en un solo motor; el frontend deja de calcular niveles y valor de puntos.
- **TS-015**: Swagger.

## Sin historia (para decidir)

- `destinations.service.ts` calcula precio de vuelo con `Number(...) * pasajeros` (B5). Se corrige cuando se toque la búsqueda de vuelos.
- Las pantallas enrutadas no usan `ToastService`; muestran errores con texto propio. Se uniforma pantalla por pantalla en los sprints 1 a 3.
- `change-password` no tiene endpoint en el backend: el sprint 1 necesita la historia completa (backend y frontend), no solo enrutar la pantalla.
