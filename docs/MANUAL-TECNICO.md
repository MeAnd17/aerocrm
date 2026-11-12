# Manual técnico — AeroCRM

Versión: Sprint 4 · 2026-11-11

---

## 1. Arquitectura general

```
┌──────────────┐        HTTP/JSON        ┌──────────────────────┐
│  Angular 17  │  ──────────────────►   │   NestJS 10 + Prisma  │
│  (Tailwind)  │  ◄──────────────────   │   (prefijo /api)      │
│  puerto 8100 │                         │   puerto 3100         │
└──────────────┘                         └──────────┬───────────┘
                                                     │ Prisma Client
                                          ┌──────────▼───────────┐
                                          │   PostgreSQL 16       │
                                          │   puerto 5433 (local) │
                                          └──────────────────────┘
```

El frontend no conoce nada del dominio: todas las reglas de negocio (precios, puntos, niveles, estados) viven en el backend. El frontend solo muestra lo que la API devuelve.

---

## 2. Stack de tecnologías

### Backend (`backend/`)
| Componente | Versión | Propósito |
|-----------|---------|-----------|
| NestJS | 10.x | Framework HTTP + inyección de dependencias |
| Prisma | 5.x | ORM y migraciones sobre PostgreSQL |
| PostgreSQL | 16 | Base de datos relacional |
| Passport + JWT | 10.x / 10.x | Autenticación por token |
| class-validator | 0.14 | Validación de DTOs |
| Swagger | 7.x | Documentación de la API en `/api/docs` |

### Frontend (`frontend/`)
| Componente | Versión | Propósito |
|-----------|---------|-----------|
| Angular | 17 | Framework SPA con componentes standalone |
| Tailwind CSS | 3.x | Estilos mediante clases utilitarias |
| Angular Router | — | Navegación con `loadComponent` (lazy loading) |

### Infraestructura
| Componente | Propósito |
|-----------|-----------|
| Docker + Compose | Contenedores para backend, frontend y base de datos |
| GitHub Actions | CI: lint, build, pruebas unitarias, e2e mock, e2e Postgres real |
| Supabase (PostgreSQL) | Base compartida del equipo (plan gratuito) |

---

## 3. Estructura del repositorio

```
backend/
  src/
    admin/          Panel de administración (estadísticas, gestión de clientes/reservas/destinos)
    auth/           Autenticación JWT, registro, cambio de contraseña [ÁREA RESERVADA]
    bookings/       Ciclo de vida de reservas: cotización, pago, cancelación
    clients/        Perfil de cliente, inicio personalizado, destinos guardados
    contact/        Consultas y contacto
    destinations/   Catálogo de destinos, búsqueda, clima y feriados
    loyalty/        Motor de fidelización: puntos, niveles, canje [ÁREA RESERVADA]
    recommendations/ Recomendaciones personalizadas
    reviews/        Reseñas de viajes completados
    prisma/         PrismaService (único cliente de base de datos)
    common/         Validación, pipes, filtros globales
  prisma/
    schema.prisma   Esquema de la base de datos [ÁREA RESERVADA]
    migrations/     11 migraciones desde el inicio del proyecto
    seed.ts         Carga de arranque idempotente
  test/
    app.e2e-spec.ts         44 pruebas de flujo completo con doble de Prisma
    app.e2e-db-spec.ts      25 pruebas contra Postgres real (TS-021)

frontend/
  src/app/
    core/           Guards, interceptores, servicios singleton
    shared/         Componentes, pipes y directivas reutilizables
    features/       Una carpeta por pantalla (standalone)
      auth/         Login de cliente, registro, cambio de contraseña
      home/         Inicio personalizado con membresía y recomendaciones
      packages/     Armador de paquetes de 6 pasos
      my-trips/     Mis viajes, detalle, impresión
      loyalty/      Panel de puntos y nivel
      admin/        Panel del administrador
      ...

docs/
  DESPLIEGUE.md       Esta guía de despliegue
  MANUAL-TECNICO.md   Este documento
  MANUAL-USUARIO.md   Manual del usuario final
  pruebas/            Plan de pruebas y registro de defectos
  tareas/             Fichas de cierre por sprint
```

---

## 4. Esquema de la base de datos

### Tablas principales

```
User            id, firstName, lastName, email, passwordHash, role (CLIENT | ADMIN), mustChangePassword
Client          id, userId, membershipLevel, availablePoints, totalPoints, completedTrips, ...preferencias
Destination     id, name, city, country, iataCode, type, isActive
Flight          id, origin, destination, departureDate, arrivalDate, pricePerPerson, ...
Hotel           id, destinationId, name, stars, pricePerNight, ...
Activity        id, destinationId, name, pricePerPerson, ...
Extra           id, name, pricePerUnit, ...
Booking         id, clientId, status (PENDIENTE|CONFIRMADO|EN_CURSO|COMPLETADO|CANCELADO), totalCents, ...
BookingFlight   bookingId, flightId
BookingHotel    bookingId, hotelId, checkIn, checkOut
BookingActivity bookingId, activityId, quantity
BookingExtra    bookingId, extraId, quantity
BookingPassenger bookingId, firstName, lastName, documentType, documentNumber, dateOfBirth
PointsHistory   id, clientId, type (EARNED|REDEEMED), points, bookingId, createdAt
Review          id, bookingId (unique), clientId, rating, comment, createdAt
SavedDestination clientId, destinationId
Festivity       id, destinationId, name, startMonth
WeatherCache    destinationId, month, tempMax, tempMin, rain, description
HolidayCache    country, date, name
Contact         id, userId, subject, message, status (PENDIENTE|ATENDIDA)
```

Dinero siempre en céntimos (INTEGER). Los decimales del catálogo se convierten a céntimos al arrancar el seed.

### Migraciones

| Migración | Descripción |
|-----------|-------------|
| `20261006080000_init` | Esquema inicial completo |
| `20261006090000_catalogo_extras_agencia_respaldo` | Extras, datos de respaldo de APIs |
| `20261007000000_add_user_role_spending_range` | Rol de usuario, rango de gasto |
| `20261008000000_add_external_api_cache` | Caché de APIs externas |
| `20261102231555_add_booking_passengers` | Pasajeros de reserva |
| `20261102232231_add_booking_lifecycle` | Ciclo de vida de reserva |
| `20261102235240_add_user_must_change_password` | Flag de contraseña temporal |
| `20261103000616_add_contact_status` | Estado de consultas |
| `20261103091919_add_passenger_document_type` | Tipo de documento |
| `20261104061905_agrega_document_type_al_cliente` | Tipo de doc. en cliente |
| `20261108181206_add_reviews` | Reseñas de viajes |

---

## 5. Reglas de negocio clave

Implementadas exclusivamente en `backend/src/loyalty/loyalty.rules.ts` (AGENTS.md B7):

- **Puntos:** 1 punto por cada S/ 100 del total pagado (redondeo hacia abajo).
- **Niveles:** Explorador (0–2 viajes completados) · Viajero (3–7) · Frecuente (8–14) · Elite (15+).
- **Canje mínimo:** 500 puntos.
- **Valor del punto:** S/ 0.10 (500 puntos = S/ 50).
- **Descuento adicional por nivel:** Explorador 0% · Viajero 5% · Frecuente 10% · Elite 15%.
- **Tope del descuento:** el descuento total (puntos + nivel) no puede superar el 50% del precio del paquete. Los puntos que no caben se conservan.

---

## 6. Autenticación

- Registro: `POST /api/auth/register` → token JWT + datos del usuario.
- Login: `POST /api/auth/login` → token JWT.
- El token se envía en el header `Authorization: Bearer <token>`.
- Rutas de cliente: requieren `JwtAuthGuard` + rol `CLIENT`.
- Rutas de administrador: requieren `JwtAuthGuard` + `RolesGuard` + `@Roles('ADMIN')`.
- Un administrador que intente acceder a rutas de cliente recibe 403.
- El flag `mustChangePassword` obliga a cambiar la contraseña antes de usar el sistema.

---

## 7. Verificación automática (CI)

Cada PR activa `.github/workflows/ci.yml`:

1. **Lint** del backend (`eslint`, máximo 13 warnings).
2. **Compilación** de backend y frontend.
3. **Pruebas unitarias** (58 tests: `npm test`).
4. **Pruebas e2e mock** (44 tests: `npm run test:e2e` — doble de Prisma, sin base real).
5. **Pruebas e2e Postgres real** (25 tests: `npm run test:e2e:db` — contra `postgres:16` del servicio de GitHub Actions).

---

## 8. Decisiones de arquitectura

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| NestJS 10 | Express puro | Inyección de dependencias, decoradores y módulos reducen código boilerplate |
| Prisma 5 | TypeORM | API más ergonómica, migraciones automáticas, type-safety total |
| Angular 17 standalone | NgModules | Componentes más simples, menos archivos, carga diferida nativa |
| Tailwind CSS | CSS modules | Consistencia sin hojas de estilo separadas; tokens centralizados |
| Supabase (plan gratuito) | PostgreSQL local solo | Compartir base entre integrantes sin servidor propio |
| Dinero en céntimos (INTEGER) | `Decimal` / `float` | Elimina errores de punto flotante en cálculos de precios y puntos |
| Datos de respaldo en base | Llamadas directas a APIs externas | Funciona sin internet, indispensable para la demostración |
