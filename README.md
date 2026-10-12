# AeroCRM

Plataforma web CRM de ventas y fidelización para Expertia Travel S.A.C. El cliente arma y compra un paquete de viaje completo (vuelo, hotel, actividades y extras) en un flujo de seis pasos. Con cada compra la agencia conoce mejor al cliente y lo retiene con puntos y niveles de membresía. Los pagos son simulados.

Las reglas para trabajar en este repositorio, con o sin herramientas de IA, están en [AGENTS.md](AGENTS.md). Léelas antes de tu primer aporte.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 17 (componentes standalone) + Tailwind CSS |
| Backend | NestJS 10 + Prisma 5, API REST con prefijo `/api` |
| Base de datos | PostgreSQL: compartida en Supabase, o local en contenedor |
| Autenticación | JWT |
| APIs externas | Calendarific (feriados) y OpenWeatherMap (clima), con datos de respaldo en la base |
| Contenedores | Docker Compose |

## Requisitos

- Node.js 20 o superior y npm (el proyecto usa `npm`; no uses pnpm ni yarn)
- Docker Desktop
- Git

## Arranque

### 1. Configuración

    cp backend/.env.example backend/.env

Completa `backend/.env`:

- `DATABASE_URL` y `DIRECT_URL`: las cadenas de la base compartida con el usuario `aerocrm_equipo`, de la página de Accesos (ver [docs/ACCESOS.md](docs/ACCESOS.md)). Para trabajar sin la base compartida, usa las dos líneas de base local que están comentadas en el archivo.
- `JWT_SECRET`: el mismo para todo el equipo; está en la misma página.
- `CALENDARIFIC_API_KEY` y `OPENWEATHER_API_KEY`: opcionales. Sin ellas, el sistema usa los datos de respaldo.

### 2a. Todo con un solo comando (contra la base compartida)

    docker compose up -d --build

| Servicio | Dirección |
|---|---|
| Aplicación | http://localhost:8100 |
| API | http://localhost:3100/api |
| Catálogo de servicios (Swagger) | http://localhost:3100/api/docs |

### 2b. Todo con base local (sin internet, o para probar cambios de esquema)

    docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

Levanta además PostgreSQL 16 en `localhost:5433`, aplica las migraciones y carga los datos de arranque.

### 2c. Desarrollo con recarga automática

    # terminal 1
    cd backend
    npm ci
    npx prisma generate
    npm run start:dev          # http://localhost:3000/api · Swagger en /api/docs

    # terminal 2
    cd frontend
    npm ci
    npm start                  # http://localhost:4200

## Usuarios de demostración

Contraseña de todos: `Demo1234!`

| Correo | Perfil |
|---|---|
| `lucia.ramos@demo.pe` | Cliente nuevo: sin compras, nivel Explorador |
| `diego.salazar@demo.pe` | Nivel Viajero: 4 viajes completados y un viaje a Madrid confirmado |
| `valeria.torres@demo.pe` | Nivel Elite: 16 viajes completados, viaja en familia y tiene puntos para canjear |

Los puntos, niveles y saldos se calculan con el motor de fidelización a partir del historial de cada cliente, así que siempre cuadran.

## Datos de arranque

    cd backend
    npx prisma db seed

La carga es idempotente: correrla dos veces deja lo mismo que correrla una vez. Las fechas de los vuelos se calculan desde `SEED_REFERENCE_DATE` (o desde hoy si está vacía), así siempre hay vuelos en los cuatro meses siguientes. Fija esa fecha antes de la sustentación.

Contiene 11 destinos, alrededor de 960 vuelos desde y hacia Lima (varias aerolíneas, con y sin escalas, tres clases), hoteles de 3 a 5 estrellas y actividades de cada tipo por destino, festividades curadas, extras con precio, datos de la agencia, clima promedio por mes y feriados nacionales de respaldo.

## Comandos de verificación

    # backend
    npm run lint
    npm run build
    npm test
    npm run test:e2e

    # frontend
    npm run build

Los mismos pasos corren automáticamente en cada PR (`.github/workflows/ci.yml`).

## Estructura

    backend/
      src/<módulo>/        auth · bookings · clients · contact · destinations · loyalty · prisma
      src/loyalty/loyalty.rules.ts   motor único de puntos, niveles y canje
      prisma/              schema.prisma · migrations/ · seed.ts · seed-data/
      test/                pruebas de flujo completo
    frontend/
      src/app/core/        guards, interceptor, servicios únicos (ApiService, AuthService, ToastService)
      src/app/core/layout/navbar/   barra de navegación común
      src/app/shared/ui/   piezas visuales base: botón, tarjeta, campo, estrellas, carga, vacío
      src/app/features/    una carpeta por pantalla
    docs/
      encargos/PLANTILLA.md   cómo se encarga una tarea a una herramienta de IA
      HEREDADO.md             estado del código heredado: qué se conserva, rehace o retira
      BASE-DE-DATOS.md        conexión, migraciones, respaldo y aviso de caída
      ACCESOS.md              accesos del equipo, sin valores secretos
      tareas/                 historias y fichas de cierre, por sprint
    scripts/               respaldo de la base y usuarios de Supabase

## Documentación

| Documento | Contenido |
|---|---|
| [AGENTS.md](AGENTS.md) | Reglas del repositorio |
| [docs/api.md](docs/api.md) | Cómo usar Swagger y documentar un endpoint |
| [docs/fidelizacion.md](docs/fidelizacion.md) | Puntos, niveles y canje |
| [docs/armador.md](docs/armador.md) | Estructura del armador de paquetes |
| [docs/interfaz.md](docs/interfaz.md) | Barra de navegación y piezas base de la interfaz |
| [docs/datos-de-arranque.md](docs/datos-de-arranque.md) | Qué carga el seed y cómo agregar datos |
| [docs/BASE-DE-DATOS.md](docs/BASE-DE-DATOS.md) | Conexión, migraciones, respaldo y caídas |
| [docs/ACCESOS.md](docs/ACCESOS.md) | Qué accesos hay, quién los tiene y cómo se piden |
| [docs/tareas/](docs/tareas/README.md) | Historias de cada sprint y ficha de cierre de cada tarea terminada |
| [docs/HEREDADO.md](docs/HEREDADO.md) | Estado del código que venía de antes |
| [docs/encargos/PLANTILLA.md](docs/encargos/PLANTILLA.md) | Cómo pedirle una tarea a una herramienta de IA |

## Base de datos

Quién aplica migraciones, cómo se respalda la base y qué hacer si se cae: [docs/BASE-DE-DATOS.md](docs/BASE-DE-DATOS.md).

## Reglas de negocio de fidelización

| Regla | Valor |
|---|---|
| Puntos | 1 por cada S/ 100 del total pagado |
| Canje | Mínimo 500 puntos; cada punto vale S/ 0.10 (500 puntos = S/ 50) |
| Tope | Con puntos se paga como máximo el 50 % del paquete; los puntos que no caben se conservan |
| Explorador | 0 a 2 viajes completados · sin descuento adicional |
| Viajero | 3 a 7 viajes · 5 % adicional sobre el paquete al canjear |
| Frecuente | 8 a 14 viajes · 10 % adicional |
| Elite | 15 viajes o más · 15 % adicional |

Se implementan solo en `backend/src/loyalty/loyalty.rules.ts`.
