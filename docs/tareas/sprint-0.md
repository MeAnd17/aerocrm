# Sprint 0 · Preparación

Base técnica, datos y reglas de trabajo antes de construir funcionalidades. Todas las tareas entraron a `main` en el PR del Sprint 0. Las que dicen `QA-S0` salieron de recorrer el sistema completo en el navegador antes de cerrar el sprint.

---

### TS-001: Contrato único del repositorio

git commit -m "docs: establece AGENTS.md como contrato único y CLAUDE.md como puntero (TS-001)"

Escribí las reglas del repositorio en un solo archivo, `AGENTS.md`, que leen igual Claude Code, Kiro y OpenCode. Cubre el stack, los comandos permitidos, las reglas de backend (B1–B9), frontend (F1–F9), datos (D1–D7), las áreas reservadas, el trabajo con IA (I1–I7), git (G1–G4), la definición de terminado, las reglas fijas del dominio y cómo tratar el código heredado. `CLAUDE.md` solo apunta a `AGENTS.md`, para que no existan reglas distintas por herramienta.

Archivos:
- `AGENTS.md`: el contrato completo.
- `CLAUDE.md`: puntero a `AGENTS.md`.
- `.gitignore`: deja fuera la configuración personal de cada herramienta (`.claude/settings.local.json`, `.kiro/`, `.opencode/`).

PR: Sprint 0

---

### TS-026: Plantillas de encargo y de PR

git commit -m "docs: agrega plantilla de encargo y plantilla de PR (TS-026)"
git commit -m "docs: agrega la ficha de cierre por tarea y la exige en la definición de terminado (TS-026)"

Dejé dos plantillas. La de encargo dice qué se le entrega a una herramienta de IA antes de pedirle una tarea: historia, criterio de aceptación, archivos que puede y no puede tocar, referencia a copiar y comando de verificación. Trae un ejemplo lleno. La de PR exige las tres líneas escritas por la persona, la herramienta y el modelo usados, y la lista de verificación. Al cerrar el sprint agregué la ficha de cierre: cada tarea terminada deja en `docs/tareas/` qué se hizo, con qué commit y en qué archivos, en el mismo PR. Quedó como parte de la definición de terminado, en la plantilla de PR y en la de encargo, y este archivo tiene las fichas del Sprint 0.

Archivos:
- `docs/encargos/PLANTILLA.md`: plantilla de encargo con ejemplo; pide redactar la ficha al terminar.
- `.github/pull_request_template.md`: plantilla que GitHub carga en cada PR, con la casilla de la ficha.
- `docs/tareas/README.md`: formato de la ficha y ejemplo.
- `docs/tareas/sprint-0.md`: fichas de este sprint.
- `AGENTS.md`: la ficha en la definición de terminado (§10).

PR: Sprint 0

---

### TS-002: Lint y pruebas

git commit -m "build: instala lint y pruebas, retira dependencias heredadas (TS-002)"

El repositorio no tenía lint configurado ni ninguna prueba. Agregué ESLint, Jest y Supertest al backend, con una prueba unitaria y una de flujo completo de base sobre las que se construyen las demás. `npm run lint` ahora solo revisa (`lint:fix` corrige) y el build pasa a `nest build`. Retiré las dependencias de WebSocket y de gráficos que venían del sistema anterior y que nada usa: `socket.io`, `@nestjs/websockets` y `@nestjs/platform-socket.io` en el backend; `socket.io-client`, `chart.js` y `ng2-charts` en el frontend. Quité también el proxy de `/socket.io/`.

Archivos:
- `backend/package.json`: scripts `lint`, `lint:fix`, `test`, `test:e2e`, `test:cov` y dependencias de prueba.
- `backend/.eslintrc.js`: reglas de estilo.
- `backend/src/app.controller.spec.ts` y `backend/test/`: primeras pruebas y configuración de e2e.
- `backend/nest-cli.json`: renombrado desde `.nestcli.json`, que Nest no leía.
- `backend/tsconfig.json`, `backend/tsconfig.build.json`: incluyen las pruebas y separan la salida.
- `frontend/package.json`, `frontend/nginx.conf`, `frontend/proxy.conf.json`: sin dependencias ni proxys del sistema anterior.

PR: Sprint 0

---

### TS-006: Inventario del código heredado y README real

git commit -m "docs: inventaría el código heredado con estado y recomendación (TS-006)"
git commit -m "docs: describe en el README el repo real, comandos y credenciales demo (TS-006)"

Revisé pieza por pieza el código que ya estaba y lo dejé en una tabla: qué hace, si se usa (con la evidencia), qué choca con `AGENTS.md` y una recomendación de conservar, rehacer o retirar. El hallazgo principal es que el repositorio mezcla dos sistemas: las pantallas enrutadas son de AeroCRM y las no enrutadas son de un CRM de aerolínea anterior que no compila si se enruta. La columna Decisión queda vacía para los responsables de integración. Reescribí el README con lo que el repositorio hace hoy: stack, arranque, usuarios de demostración, comandos y estructura. Saqué del repositorio los `tsbuildinfo` versionados.

Archivos:
- `docs/HEREDADO.md`: inventario completo.
- `README.md`: reescrito.
- `backend/tsconfig.tsbuildinfo`, `backend/tsconfig.build.tsbuildinfo`: eliminados y agregados al `.gitignore`.

PR: Sprint 0

---

### TS-003: Migración base y conexiones separadas

git commit -m "build: agrega migración base y separa DATABASE_URL de DIRECT_URL (TS-003)"

El esquema no tenía migraciones; la base se armaba con lo que hubiera en `schema.prisma`. Generé la migración inicial a partir del esquema existente, sin cambiar ninguna tabla, para que la base compartida y las locales se construyan igual. Separé la conexión de trabajo (`DATABASE_URL`, por el pooler de Supabase) de la que aplica migraciones (`DIRECT_URL`). Fijé los saltos de línea de los `.sql` en LF, porque Prisma compara las migraciones por checksum y en Windows cambiaban.

Archivos:
- `backend/prisma/migrations/20261006080000_init/migration.sql`: migración inicial.
- `backend/prisma/schema.prisma`: `directUrl`.
- `backend/.env.example`: las dos conexiones explicadas.
- `.gitattributes`: `eol=lf` para `.sql`, `.sh` y `.toml`.

Base de datos: migración `20261006080000_init`, equivalente al esquema heredado.

PR: Sprint 0

---

### TS-012: Motor único de fidelización

git commit -m "refactor: concentra las reglas de fidelización en un motor único con pruebas de límites (TS-012)"
git commit -m "feat: limita el canje al 50 % del paquete y separa puntos disponibles del histórico (TS-012)"

Las reglas de puntos, niveles y canje estaban repartidas entre servicios y repetidas en el frontend. Las concentré en `loyalty.rules.ts`, un archivo de funciones puras que trabaja en céntimos enteros. Reservas, clientes y la pantalla de puntos lo usan, y el frontend solo muestra lo que devuelve la API. El descuento adicional por nivel ahora se aplica sobre el total del paquete. Agregué `POST /api/loyalty/redemption-preview` para que el armador muestre el canje sin registrarlo. Después agregué el tope: el descuento total (puntos más nivel) llega como máximo al 50 % del paquete; si el cliente tiene más puntos de los que caben, se usan solo los necesarios y el resto se le queda, y si no caben ni los 500 mínimos el canje no se permite y la pantalla dice por qué. La pantalla de puntos muestra en grande los disponibles para canjear, con su valor en soles, y en chico el histórico acumulado.

Archivos:
- `backend/src/loyalty/loyalty.rules.ts`: constantes y funciones del motor, con `MAX_REDEEM_PERCENT` y `computeRedemption`.
- `backend/src/loyalty/loyalty.rules.spec.ts`: 27 pruebas de límites (499 contra 500 puntos, saltos de nivel, céntimos, el tope y el paquete donde no cabe el mínimo).
- `backend/src/loyalty/loyalty.service.ts`, `loyalty.controller.ts`, `dto/redemption-preview.dto.ts`: estado, historial y vista previa del canje.
- `backend/src/bookings/bookings.service.ts`, `backend/src/clients/clients.service.ts`: usan el motor en lugar de calcular por su cuenta.
- `frontend/src/app/features/loyalty/loyalty.component.ts`, `home/home.component.ts`, `packages/steps/step-summary.component.ts`: muestran disponibles, histórico, avance y canje que vienen de la API.
- `docs/fidelizacion.md`: reglas, ejemplos con el tope y endpoints.

PR: Sprint 0

---

### TS-004: Arranque reproducible con Docker

git commit -m "build: arranque reproducible con Docker, base local opcional y healthcheck real (TS-004)"

El sistema completo levanta con `docker compose up -d --build` contra la base de `backend/.env`, sin ninguna clave escrita en el compose. Con `docker-compose.local.yml` levanta además PostgreSQL 16 en `localhost:5433`, aplica las migraciones y carga los datos de arranque; sirve para probar cambios de esquema y para la demostración sin internet. `/api/health` ahora consulta la base y responde 503 si no contesta, y Docker usa ese chequeo para dar por sano al backend. Los Dockerfile instalan con `npm ci` y el del backend se separó en dos etapas. Retiré `setup.sh`, que repetía a mano lo que ahora hace el compose.

Archivos:
- `docker-compose.yml`: backend y frontend contra la base de `.env`.
- `docker-compose.local.yml`: base local y el servicio `db-init`, que migra y carga datos una vez y termina.
- `backend/Dockerfile`, `frontend/Dockerfile`, `.dockerignore`: builds reproducibles.
- `backend/src/app.controller.ts` y su prueba: salud con consulta a la base.
- `frontend/src/environments/`: sin la URL de WebSocket del sistema anterior.

PR: Sprint 0

---

### TS-005: Carga de arranque idempotente

git commit -m "fix: vuelve idempotente la carga de arranque con fecha de referencia configurable (TS-005)"

La carga de arranque usaba `createMany` con `skipDuplicates`, que solo evita duplicados donde la tabla tiene una restricción única, y tenía diez vuelos con fechas fijas. Ahora busca cada registro por su clave natural (IATA, destino más nombre, número de vuelo, correo) y lo actualiza o lo crea, así que correrla dos veces deja lo mismo. Las fechas de los vuelos se calculan desde `SEED_REFERENCE_DATE` o desde el día en que se corre. Separé los datos en archivos por tema y saqué los `seed.js` compilados que estaban versionados.

Archivos:
- `backend/prisma/seed.ts`: carga con upserts por clave natural.
- `backend/prisma/seed-data/catalog.ts`, `flights.ts`, `users.ts`: datos separados por tema.
- `backend/prisma/seed.js`, `seed.js.map`, `seed.d.ts`: eliminados y agregados al `.gitignore`.

PR: Sprint 0

---

### TS-014: Catálogo completo y datos de respaldo

git commit -m "feat: amplía el catálogo y agrega extras, agencia, clima, feriados e historial demo (TS-014)"

Amplié el catálogo a 11 destinos (agregué Río de Janeiro y corregí el Carnaval de Río), con hoteles de 3 a 5 estrellas y actividades de cada tipo por destino. Agregué a la base los extras con precio, los datos de la agencia, el clima promedio por destino y mes, y los feriados nacionales de fecha fija, que son el respaldo cuando las APIs externas no responden. Los tres clientes de demostración tienen historial de compras, y sus puntos, nivel y saldo se calculan con el motor de fidelización recorriendo ese historial, así que siempre cuadran. Los datos reales de la agencia quedaron marcados `[COMPLETAR]`.

Archivos:
- `backend/prisma/schema.prisma`: modelos `ExtraOption`, `AgencyInfo`, `DestinationClimate` y `Holiday`.
- `backend/prisma/seed-data/reference.ts`: extras, agencia, clima y feriados.
- `backend/prisma/seed-data/history.ts`: historial de los clientes demo.
- `backend/prisma/seed-data/catalog.ts`, `flights.ts`, `seed.ts`: catálogo ampliado.
- `docs/datos-de-arranque.md`: qué carga y cómo agregar datos.

Base de datos: migración `20261006090000_catalogo_extras_agencia_respaldo`, con el enum `ExtraPricing` (`POR_RESERVA`, `POR_PASAJERO`) y las cuatro tablas nuevas.

PR: Sprint 0

---

### TS-025: Base compartida, respaldo, aviso de caída y accesos

git commit -m "build: agrega respaldo diario y aviso de caída de la base compartida (TS-025)"
git commit -m "docs: documenta los accesos del equipo y crea el usuario restringido de la base compartida (TS-025)"

Creé el proyecto `aerocrm` en Supabase (São Paulo, plan gratuito) como base compartida. Dejé un script de respaldo para Windows y para macOS/Linux que guarda el volcado fuera de la nube y del repositorio, con los 14 más recientes, y un flujo de GitHub que consulta la base cada mañana: avisa por correo si no responde y evita que Supabase pause el proyecto por inactividad. Después separé los usuarios de la base: el equipo entra con `aerocrm_equipo`, que lee y escribe datos pero no puede cambiar la estructura, y solo quien aplica migraciones usa `postgres`. Así, un `prisma migrate dev` o `db push` corrido por error contra la base compartida falla en lugar de borrarla. El mismo script le quita a la API automática de Supabase el acceso a nuestras tablas, porque el sistema no la usa. Para migrar y cargar datos en la base compartida dejé un script que toma las cadenas de `postgres` de `backend/.env.compartida`, así quien integra no tiene que cambiar su `backend/.env` y su entorno local sigue igual. Documenté qué accesos hay y cómo se piden, sin ningún valor secreto en el repositorio.

Archivos:
- `docs/BASE-DE-DATOS.md`: conexión, primera puesta en marcha, cambios de esquema, respaldo y caídas.
- `docs/ACCESOS.md`: accesos, quién los tiene y los dos usuarios de la base.
- `scripts/supabase-usuarios.sql`: usuario `aerocrm_equipo` y permisos.
- `scripts/db-compartida.ps1`, `scripts/db-compartida.sh`: migrar y cargar datos en la base compartida con `backend/.env.compartida`, sin tocar `backend/.env`.
- `scripts/db-backup.ps1`, `scripts/db-backup.sh`: respaldo.
- `.github/workflows/db-health.yml`: aviso diario de caída.
- `backend/.env.example`, `README.md`: las cadenas usan el usuario del equipo.

Base de datos: usuario `aerocrm_equipo` con lectura y escritura sobre las tablas de `public` y sin permiso para crear objetos; los roles `anon` y `authenticated` de Supabase sin acceso a nuestras tablas.

PR: Sprint 0

---

### TS-015: Catálogo de servicios en Swagger

git commit -m "feat: publica el catálogo Swagger con autenticación bearer (TS-015)"

Publiqué la documentación de la API en `/api/docs`, con el botón Authorize para probar los servicios protegidos con el token de un usuario de demostración. El plugin de Swagger lee los decoradores de validación y los comentarios de los DTO, así que los campos se documentan solos. Agregué a cada controller el resumen de cada endpoint, sus errores posibles y los parámetros de consulta.

Archivos:
- `backend/src/main.ts`: configuración de Swagger.
- `backend/nest-cli.json`: plugin de Swagger.
- `backend/src/*/*.controller.ts` (auth, bookings, clients, contact, destinations, loyalty y el de salud): decoradores de documentación.
- `docs/api.md`: cómo probar un servicio y cómo documentar uno nuevo.

PR: Sprint 0

---

### TS-007: Verificación automática en cada PR

git commit -m "ci: verifica lint, build y pruebas en cada PR (TS-007)"

Cada PR corre en GitHub lint, build, pruebas unitarias y de flujo completo del backend, y el build del frontend. Las pruebas no necesitan base de datos. El lint acepta hasta 13 advertencias, que son las del código heredado: una más hace fallar la verificación, para que no se acumulen nuevas.

Archivos:
- `.github/workflows/ci.yml`: los dos trabajos, backend y frontend.
- `backend/.eslintrc.js`: ajuste de reglas para las advertencias heredadas.

PR: Sprint 0

---

### TS-009: Armador en pasos con estado único

git commit -m "refactor: divide el armador en contenedor, pasos y estado único (TS-009)"

El armador era un solo componente grande. Lo separé en un contenedor que maneja el indicador de pasos y la carga de datos, un componente por paso (vuelo, destino, hotel, actividades, extras y resumen) y un servicio de estado con signals donde vive todo lo elegido. Así cada historia del armador toca un solo paso. El estado se puede convertir a texto y restaurar, como base para guardar el paquete en curso.

Archivos:
- `frontend/src/app/features/packages/package-builder.component.ts`: contenedor.
- `frontend/src/app/features/packages/package-builder.state.ts`: estado del paquete.
- `frontend/src/app/features/packages/steps/`: los seis pasos.
- `docs/armador.md`: estructura y cómo agregar un paso.

PR: Sprint 0

---

### TS-008: Navegación común y piezas base de la interfaz

git commit -m "feat: agrega navegación común y piezas visuales base (TS-008)"

Agregué una barra de navegación única para todo el sistema, con enlaces distintos para visitante y para cliente con sesión, y el acceso «Continuar paquete» cuando hay uno en curso: el paquete se guarda en el navegador y se retoma al volver. Las pantallas de login y registro ocupan todo el ancho y el resto va dentro de un contenedor centrado. Dejé seis piezas base para construir pantallas sin repetir estilos: botón, tarjeta, campo de formulario, estrellas, estado de carga y estado vacío. La paleta y la tipografía quedaron marcadas `[AJUSTAR]` hasta pasarlas desde la maqueta.

Archivos:
- `frontend/src/app/core/layout/navbar/navbar.component.ts`: barra de navegación.
- `frontend/src/app/shared/ui/`: las seis piezas base y su `index.ts`.
- `frontend/src/app/app.component.ts`, `app.routes.ts`: barra común y pantallas de ancho completo.
- `frontend/src/app/features/packages/package-builder.state.ts`: guarda y retoma el paquete en curso.
- `frontend/tailwind.config.js`, `src/styles.scss`, `src/index.html`: tokens de color y tipografía.
- `docs/interfaz.md`: cómo usar la barra y las piezas.

PR: Sprint 0

---

### QA-S0: Textos y errores en español

git commit -m "fix: muestra en español mensajes de validación, errores y valores de la interfaz (QA-S0)"

Había textos en inglés en pantalla y la API respondía los errores en inglés. Ahora los mensajes de validación de los DTO salen en español con el nombre del campo traducido, y los errores 401, 403, 404 y 500 tienen un mensaje fijo en español; el detalle de un error inesperado queda solo en el log del servidor. Las pruebas de flujo completo arman la aplicación igual que el servidor, para que prueben los mismos mensajes. En el frontend, los valores de enum se muestran con el pipe `etiqueta`, los errores de la API con `apiErrorMessage` y las fechas en es-PE. Agregué la regla F9 al contrato.

Archivos:
- `backend/src/common/validation.ts` y su prueba: traducción de los mensajes de validación (`FIELD_LABELS`).
- `backend/src/common/http-messages.filter.ts`: mensajes fijos por código de error.
- `backend/src/app.setup.ts`: configuración compartida por el servidor y las pruebas.
- `frontend/src/app/shared/pipes/label.pipe.ts`: pipe `etiqueta`.
- `frontend/src/app/core/services/api-error.ts`: mensaje de error para mostrar.
- `frontend/src/app/app.config.ts`: idioma es-PE.
- Pantallas de login, registro, contacto, inicio, destino, búsqueda, mis viajes, detalle, puntos y armador: textos en español.

PR: Sprint 0

---

### QA-S0: Clima y feriados de respaldo

git commit -m "feat: usa clima y feriados de respaldo cuando las APIs externas no responden (QA-S0)"

Si OpenWeatherMap o Calendarific no responden o no hay clave configurada, el contexto del destino usa el clima promedio del mes y los feriados guardados en la base, y lo marca como promedio. Ninguna pantalla queda en blanco. Corregí también la búsqueda sin origen, que tomaba por error el primer destino de la tabla como origen.

Archivos:
- `backend/src/destinations/destinations.service.ts`: respaldo de clima y feriados, y el filtro de origen.

PR: Sprint 0

---

### QA-S0: Volver a la página de origen al iniciar sesión

git commit -m "fix: vuelve a la página de origen al iniciar sesión y descarta sesiones vencidas (QA-S0)"

Al entrar a una pantalla que pide sesión, el login ahora devuelve al usuario a esa pantalla y no al inicio. Solo acepta rutas internas como destino. Si la API responde 401 por una sesión vencida, se cierra la sesión y se lleva al login con la misma vuelta; un token vencido guardado en el navegador se descarta al cargar la aplicación.

Archivos:
- `frontend/src/app/core/guards/auth.guard.ts`: `returnUrl` y validación de la ruta.
- `frontend/src/app/core/interceptors/auth.interceptor.ts`: manejo del 401.
- `frontend/src/app/core/services/auth.service.ts`: descarte del token vencido.
- `frontend/src/app/features/auth/login/`, `register/`: navegan a la página de origen.

PR: Sprint 0

---

### QA-S0: Búsqueda de vuelos con fechas cercanas

git commit -m "fix: busca vuelos ±3 días de la fecha elegida y muestra la duración (QA-S0)"
git commit -m "fix: aplica los ±3 días en la búsqueda aunque no se envíe flexDays (QA-S0)"

La búsqueda solo encontraba vuelos del día exacto, así que casi siempre salía vacía. Ahora busca entre 3 días antes y 3 después (configurable hasta 7 con `flexDays`), ordena por cercanía a la fecha pedida y cada vuelo indica cuántos días antes o después sale. La duración se muestra en horas y minutos. Los vuelos de la carga de arranque salen cada 7 días, así que cualquier fecha de los próximos cuatro meses encuentra vuelos. El valor por defecto de `flexDays` no se aplicaba cuando la pantalla no lo enviaba; ahora se fija en el controller y hay pruebas del rango.

Archivos:
- `backend/src/destinations/destinations.service.ts`, `destinations.controller.ts`: rango de fechas, orden y `daysFromRequested`.
- `backend/src/destinations/destinations.service.spec.ts`: pruebas del rango.
- `backend/prisma/seed-data/flights.ts`: vuelos cada 7 días.
- `frontend/src/app/features/search/search.component.ts`: aviso de días de diferencia y fecha mínima.
- `frontend/src/app/shared/pipes/duration.pipe.ts`: pipe `duracion`.

PR: Sprint 0

---

### QA-S0: Armador para visitantes y paquete con dueño

git commit -m "fix: el visitante arma su paquete y el paquete en curso pertenece a quien lo armó (QA-S0)"
git commit -m "fix: guía al visitante sin vuelo elegido y cobra en el armador el total que calcula el canje (QA-S0)"

Un visitante puede armar el paquete completo sin cuenta. Al confirmar se le pide iniciar sesión y vuelve al resumen con el paquete intacto, que pasa a ser suyo. El paquete en curso ahora guarda a quién pertenece: al cerrar sesión se descarta y otro usuario no ve el paquete ajeno. Si se entra al armador sin haber elegido vuelo, aparece una guía hacia el buscador en lugar de la pantalla vacía. En el resumen, el botón de pagar muestra el total final que calcula el backend, y el canje se vuelve a pedir cada vez que se entra al resumen.

Archivos:
- `frontend/src/app/app.routes.ts`: `packages/new` sin exigir sesión.
- `frontend/src/app/features/packages/package-builder.state.ts`: dueño del paquete (versión 2 del borrador guardado).
- `frontend/src/app/features/packages/package-builder.component.ts`: guía cuando no hay vuelo.
- `frontend/src/app/features/packages/steps/step-summary.component.ts`: inicio de sesión para confirmar y total a pagar.
- `docs/armador.md`: visitantes, dueño del paquete y pendientes.

PR: Sprint 0

---

### QA-S0: Fechas de hotel, actividades por pasajero y extras en el detalle

git commit -m "fix: precarga fechas de hotel sin desfase, cobra actividades por pasajero y muestra extras en el detalle (QA-S0)"

Las fechas del hotel salían un día corridas y vacías. Ahora se precargan con la llegada del vuelo y siete noches después, sin desfase por zona horaria. Las actividades se cobran por pasajero y la pantalla lo indica. El detalle del viaje muestra los extras comprados, la cantidad de cada actividad, el descuento y las fechas como "Entrada" y "Salida". El precio guardado de cada actividad en la reserva es ahora el total de la línea, igual que el de vuelos y hotel.

Archivos:
- `frontend/src/app/features/packages/package-builder.state.ts`: fechas precargadas y total de actividades.
- `frontend/src/app/features/packages/steps/step-activities.component.ts`, `step-summary.component.ts`: precio por persona y cantidad.
- `frontend/src/app/features/my-trips/trip-detail.component.ts`: extras, cantidades, descuento y fechas.
- `backend/src/bookings/bookings.service.ts`: total de la línea de actividad.

PR: Sprint 0

---

### QA-S0: Menú compacto en pantallas medianas

git commit -m "fix: usa el menú compacto por debajo de 1024 px (QA-S0)"

En pantallas entre 768 y 1024 px el menú completo no entraba en la barra. Ahora se usa el menú compacto por debajo de 1024 px.

Archivos:
- `frontend/src/app/core/layout/navbar/navbar.component.ts`: cambio de punto de corte.
- `docs/interfaz.md`: punto de corte actualizado.

PR: Sprint 0

---

### QA-S0: .gitignore completo

git commit -m "chore: completa el .gitignore (QA-S0)"

El `.gitignore` solo cubría `backend/.env` y traía restos de otro proyecto. Ahora deja fuera cualquier `.env` en cualquier carpeta (salvo `.env.example`), reportes de cobertura, volcados de base, llaves y certificados, y el `docker-compose.override.yml` de cada uno.

Archivos:
- `.gitignore`.

PR: Sprint 0

---

## Pendiente al cerrar el sprint

- Vuelo de regreso en el paquete: solo hay vuelo de ida.
- Servicio de extras desde la base: hoy los precios están escritos en la pantalla y el seguro se cobra una sola vez aunque es por pasajero.
- Precios del paquete calculados en el servidor (AGENTS.md B6): el frontend todavía envía los precios al confirmar.
- Cancelar una reserva no devuelve los puntos canjeados ni quita los ganados.
- Desde el detalle de un destino, el botón de buscar lleva a una pantalla que pide sesión.
- Columna Decisión de `docs/HEREDADO.md` y datos reales de la agencia.
