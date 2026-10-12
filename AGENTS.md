# AeroCRM — Contrato del repositorio

Fuente única de convenciones del proyecto. Vale igual para Claude Code, Kiro y OpenCode, con cualquier modelo, y para quien escriba código sin IA. Un aporte que contradiga este archivo se devuelve citando el número de la regla; no se corrige a mano. Lo modifican solo los responsables de integración (G4), por PR.

## 1. Qué es

Plataforma web CRM de ventas y fidelización para Expertia Travel S.A.C. El cliente arma y compra un paquete de viaje (vuelo + hotel + actividades + extras) en un flujo de seis pasos; cada compra alimenta su perfil y suma puntos que suben su nivel de membresía. Los pagos son simulados y el catálogo viene de la carga de arranque.

## 2. Stack y estructura

Backend NestJS 10 + Prisma 5 en `backend/` (prefijo global `/api`). Base PostgreSQL 16 compartida en Supabase (plan gratuito), con base local opcional en contenedor. Frontend Angular 17 standalone + Tailwind en `frontend/`. Todo corre en la máquina de cada integrante; no hay despliegue público.

    backend/src/<modulo>/          <modulo>.controller.ts · <modulo>.service.ts · <modulo>.module.ts · dto/
    backend/src/prisma/            PrismaService (único cliente de base)
    backend/src/auth/              JwtAuthGuard, PermissionsGuard, @RequirePermission, @CurrentUser
    backend/prisma/                schema.prisma · migrations/ · seed.ts
    backend/test/                  pruebas de flujo completo (e2e)
    frontend/src/app/core/         guards · interceptors · layout · services (singleton, providedIn: 'root')
    frontend/src/app/shared/       componentes, pipes y directivas reutilizables
    frontend/src/app/features/<feature>/   un componente standalone por pantalla
    docs/                          encargos, inventario del código heredado, accesos, fichas de cierre por sprint

## 3. Comandos

Gestor de paquetes: **npm** (hay `package-lock.json`). No se usa pnpm ni yarn. Se instala con `npm ci`, no con `npm install`, salvo que se esté agregando una dependencia.

    # backend
    npm run start:dev          # API en http://localhost:3000/api · Swagger en /api/docs
    npm run build
    npm run lint               # solo revisa; npm run lint:fix corrige
    npm test                   # pruebas unitarias
    npm run test:e2e           # pruebas de flujo completo
    npx prisma migrate dev     # SOLO contra base local (regla D2)
    npx prisma db seed

    # frontend
    npm start                  # http://localhost:4200, con proxy de /api al backend
    npm run build
    npm test

    # todo el sistema
    docker compose up -d --build                                              # contra la base de backend/.env
    docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build   # con base local en contenedor

Ningún agente inventa otro comando. Si un comando no existe o falla, se reporta.

## 4. Backend

- B1. La lógica vive en el service. El controller solo valida, autoriza y delega. Un controller que usa `prisma` se devuelve.
- B2. Toda entrada pasa por un DTO con `class-validator`. Nunca se lee `req.body` a mano.
- B3. El acceso a datos pasa por `PrismaService`. Nunca se crea otro `PrismaClient`.
- B4. Rutas protegidas: `JwtAuthGuard`; si además exigen un permiso, `PermissionsGuard` + `@RequirePermission`. Nunca una comprobación de rol escrita dentro del método.
- B5. Dinero con `Prisma.Decimal` o enteros de céntimos. Jamás `number` con decimales para calcular dinero; `Number()` solo para mostrar o serializar un resultado ya calculado.
- B6. El precio de un paquete se calcula siempre en el servidor. El frontend solo lo muestra.
- B7. Puntos, niveles y canje se calculan solo en el motor de fidelización (`backend/src/loyalty/loyalty.rules.ts`). Ninguna de sus constantes se escribe en otro lugar, tampoco en el frontend: el frontend recibe los valores ya calculados por la API.
- B8. Todo endpoint nuevo o modificado queda documentado en Swagger: `@ApiTags`, `@ApiOperation`, respuestas y errores posibles, y DTOs con `@ApiProperty`.
- B9. Errores con las excepciones de NestJS (`NotFoundException`, `BadRequestException`…) y mensaje en español para el usuario. Los mensajes de validación de los DTO los traduce `src/common/validation.ts`: un campo nuevo en un DTO lleva su nombre en español en `FIELD_LABELS`. Las pruebas e2e arman la aplicación con `configureApp` (`src/app.setup.ts`), igual que el servidor.

## 5. Frontend

- F1. Componentes standalone. Ningún `NgModule` nuevo.
- F2. Rutas siempre con `loadComponent`. Todo componente de pantalla se registra en `app.routes.ts` en el mismo PR. No se deja ningún componente huérfano.
- F3. HTTP solo a través de `ApiService`. Nunca `HttpClient` directo en un componente.
- F4. Estilos con Tailwind y los tokens de `tailwind.config.js`. Nada de `style="..."` en línea ni colores escritos a mano. CSS propio solo si Tailwind no lo cubre, con la razón en el PR.
- F5. Errores y avisos al usuario con `ToastService`. Nunca `alert`.
- F6. Toda pantalla se construye con las piezas de `shared/ui/` y se contrasta con la maqueta de referencia del proyecto, también en ancho de teléfono (375 px). Ninguna pantalla obliga a desplazarse en horizontal.
- F7. Ninguna pantalla se construye sobre un campo que no esté en Swagger.
- F8. Estado de componente con `signal`/`computed`. El estado que comparten varias pantallas vive en un servicio de `core/` o del feature, nunca duplicado en componentes.
- F9. Ningún texto en inglés en pantalla. Los valores de enum se muestran con el pipe `etiqueta` (`shared/pipes/label.pipe.ts`), los errores de la API con `apiErrorMessage` (`core/services/api-error.ts`) y las fechas con el pipe `date`, que ya usa el idioma es-PE.

## 6. Datos, esquema y configuración

- D1. Cambio de esquema = migración de Prisma commiteada + carga de arranque actualizada, en el mismo PR.
- D2. `prisma migrate dev` solo contra una base local. La base compartida recibe únicamente `npx prisma migrate deploy` de migraciones ya aprobadas, y la aplica solo quien indica G4.
- D3. `DATABASE_URL` es la conexión de trabajo (pooler de Supabase, con `connection_limit`). `DIRECT_URL` es la conexión directa para aplicar migraciones. Nunca se intercambian.
- D4. Nada de secretos en archivos versionados. Todo por `.env`. Toda variable nueva se agrega a `.env.example` con un comentario, en el mismo PR.
- D5. La carga de arranque es idempotente: ejecutarla dos veces deja lo mismo que ejecutarla una vez.
- D6. No se versionan artefactos de build: `dist/`, `node_modules/`, `*.tsbuildinfo`, JavaScript compilado junto a fuentes TypeScript.
- D7. Los nombres del dominio van en inglés en el código (`booking`, `loyalty`, `client`) y en español en la interfaz. Los valores de enum del dominio están en español (`PENDIENTE`, `EXPLORADOR`) y no se traducen.

## 7. Áreas reservadas

Un integrante no modifica estas áreas, con IA o sin ella:

- esquema y migraciones (`backend/prisma/schema.prisma`, `backend/prisma/migrations/`)
- autenticación (`backend/src/auth/`)
- motor de fidelización (`backend/src/loyalty/`)
- cálculo de precios del paquete
- transacción de compra y pago simulado
- este contrato, `CLAUDE.md` y `.github/`

Las modifican solo los responsables de integración (G4), revisando línea por línea y dejando una prueba que cubra el cambio. Si un encargo necesita tocar un área reservada, el agente se detiene y lo dice.

## 8. Trabajo con IA

- I1. Todo encargo a un agente sigue `docs/encargos/PLANTILLA.md`: historia con criterio de aceptación, archivos que puede tocar, archivos prohibidos, servicio y pantalla de referencia que debe copiar, y comando de verificación.
- I2. El agente no decide alcance. Si la historia parece incompleta o el repositorio la contradice, se detiene y pregunta.
- I3. Nada de refactorizaciones fuera de los archivos del encargo, por sensatas que parezcan. Se anotan en el PR.
- I4. Cada PR incluye tres líneas escritas por la persona, no por la herramienta, explicando qué hace lo entregado. Sin esas tres líneas no se revisa.
- I5. Cada PR declara la herramienta y el modelo usados, y qué validó la persona.
- I6. El agente no hace commit ni push, ni agrega líneas de coautoría a los commits. Commitea la persona.
- I7. El agente no instala dependencias nuevas sin que el encargo lo diga. Una dependencia nueva va justificada en el PR.

## 9. Git, PR e integración

- G1. Nadie hace push directo a `main`: todo entra por PR desde ramas cortas `tipo/ID-descripcion` (ej. `feat/us-012-paso-hotel`), y se integra al menos dos veces por semana. GitHub no lo bloquea en este repositorio (es privado y del plan gratuito), así que la regla se cumple por acuerdo y se revisa al integrar.
- G2. Commits: `tipo: descripción (ID)` en imperativo y en español, con el ID de la historia entre paréntesis al final, ej. `feat: agrega el paso de hotel con fechas precargadas (US-012)`. Un commit que no corresponde a una historia va sin paréntesis. Tipos: feat, fix, refactor, test, docs, build, ci, chore.
- G3. Todo entra por PR con la plantilla completa y la verificación automática en verde.
- G4. Los responsables de integración son las dos personas del equipo con permiso de administración sobre el repositorio y la base compartida. Solo ellas aplican migraciones a la base compartida y aprueban los PR que tocan áreas reservadas (§7). Cualquier otro PR lo aprueba cualquier integrante distinto del autor, con la verificación automática en verde.

## 10. Definición de terminado

Compila · pasa lint · las pruebas del flujo tocado en verde · arranca desde cero con `docker compose up -d` y la carga de arranque · el criterio de aceptación fue demostrado a otro integrante · documentación afectada actualizada en el mismo PR · ficha de cierre de la tarea en `docs/tareas/sprint-N.md`, con el formato de `docs/tareas/README.md` · PR aprobado por alguien distinto a quien lo escribió.

## 11. Diferencias por herramienta

- Claude Code: lee este archivo a través de `CLAUDE.md`. Los ajustes personales van en `.claude/settings.local.json`, que no se versiona.
- Kiro: lee este archivo de forma nativa. No uses "Generate Steering Docs": generaría reglas paralelas. No se versionan `.kiro/steering/` ni `.kiro/specs/`; el encargo es la especificación.
- OpenCode: lee este archivo de forma nativa. Su configuración personal no se versiona.
- Cualquier modelo: si la herramienta no puede ejecutar comandos, la persona corre la verificación y pega el resultado en el PR.

## 12. Dominio fijo

Puntos: 1 por cada S/ 100 del total pagado (redondeo hacia abajo). Niveles por viajes completados: Explorador 0–2, Viajero 3–7, Frecuente 8–14, Elite 15+. Canje mínimo 500 puntos; cada punto vale S/ 0.10 (500 puntos = S/ 50). Descuento adicional por nivel al canjear: 0 / 5 / 10 / 15 %. El descuento total del canje (puntos + nivel) llega como máximo al 50 % del paquete; si sobran puntos, se conservan. Estados de reserva: `PENDIENTE`, `CONFIRMADO`, `EN_CURSO`, `COMPLETADO`, `CANCELADO`. Calendarific y OpenWeatherMap tienen dato de respaldo en base: ninguna pantalla queda en blanco porque una API externa no respondió. Estas reglas se implementan solo en el motor (regla B7).

## 13. Código heredado

El código que ya estaba en el repositorio es base de arranque, no línea base: nada es intocable por existir y nada se borra por ser viejo.

- H1. Este contrato rige todo código nuevo y toda línea que un encargo modifique. El código heredado que lo incumple no se corrige de pasada (regla I3): se corrige solo con una historia propia.
- H2. Ningún agente borra, renombra ni reescribe un archivo heredado salvo que el encargo lo nombre explícitamente.
- H3. Qué se conserva, qué se rehace y qué se retira lo deciden los responsables de integración, módulo por módulo. La decisión y su razón quedan en `docs/HEREDADO.md`, la única fuente sobre el estado del código heredado.
- H4. Antes de copiar un archivo heredado como referencia, se revisa su estado en `docs/HEREDADO.md`. Solo se copia lo marcado como "conservar".
