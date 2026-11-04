# Sprint 2 · Reservas, ventas y panel de administración

Semana 10 · 19 al 25 de octubre de 2026.

> Módulos 1.4.3 Gestión de Viajes y Reservas, 1.4.4 Ventas (flujo de pago simulado) y el panel de administración, que vive dentro de 1.4.1 Plataforma Web CRM.
> Demostración de cierre: el cliente carga a sus pasajeros, paga en el flujo simulado, ve su reserva confirmada con su código en Mis viajes e imprime el detalle; el administrador da de alta un destino con su inventario y cambia el estado de una reserva.

## Historias

### TS-017: Pasajeros de la reserva

Sprint: 2

Módulo: 1.4.3 Gestión de Viajes y Reservas

Prioridad: CRÍTICA

Dependencias: TS-003

Estado actual: FALTA

COMO Sistema QUIERO que cada reserva guarde quiénes viajan PARA poder mostrarlos en el detalle y emitirlos en el comprobante del viaje.

**Qué espero que pase**

Problema que corrige: hoy la reserva solo guarda cuántos pasajeros son, de modo que el comprobante no podría incluir los datos del viajero que el proyecto promete.

Contenido: cada reserva guarda un pasajero por asiento, con nombre, apellido, número de documento y fecha de nacimiento, y uno marcado como titular.

Copia de los datos: los datos se copian a la reserva en el momento de la compra. Si después el cliente edita a ese viajero frecuente, la reserva ya emitida no cambia.

Coherencia: la cantidad de pasajeros se deriva de la lista y no se envía por separado; si no cuadra con los asientos, se rechaza con "La cantidad de pasajeros no coincide".

Acceso: los pasajeros de una reserva los ven su dueño y el administrador.

---

### TS-018: Ciclo de vida de la reserva

Sprint: 2

Módulo: 1.4.3 Gestión de Viajes y Reservas

Prioridad: CRÍTICA

Dependencias: TS-012, TS-016

Estado actual: FALTA

COMO Sistema QUIERO que las reservas cambien de estado con reglas claras PARA que los viajes, los puntos y los niveles reflejen la realidad.

**Qué espero que pase**

Problema que corrige: hoy nada lleva una reserva a En curso ni a Completado, así que los viajes completados nunca aumentan y el nivel del cliente no sube jamás. Sin esto, el programa de fidelización no se puede demostrar.

Transiciones permitidas: de Pendiente a Confirmado cuando se paga; de Pendiente o Confirmado a Cancelado cuando el cliente cancela; de Confirmado a En curso cuando llega la fecha de salida; y de En curso a Completado cuando pasa la fecha del vuelo de regreso. Cualquier otra combinación se rechaza con "Esta reserva no puede pasar de [estado] a [estado]".

Avance automático: un proceso diario mueve las reservas a En curso y a Completado según las fechas del viaje, sin que nadie intervenga.

Efecto al completar: al pasar a Completado se suma un viaje completado al cliente y se recalcula su nivel con el motor de fidelización, una sola vez por reserva aunque el proceso vuelva a ejecutarse.

Operación manual: el administrador puede forzar una transición válida desde el panel, y queda registrado quién la hizo y cuándo.

Acceso: el cliente solo cancela lo suyo; forzar un estado es exclusivo del administrador.

---

### US-016: Pagar mi paquete con método de pago simulado

Sprint: 2

Módulo: 1.4.4 Ventas (flujo de pago simulado)

Prioridad: CRÍTICA

Dependencias: TS-011, TS-018

Estado actual: FALTA

COMO cliente QUIERO elegir un método de pago y confirmar mi compra PARA tener mi viaje reservado con su código.

**Qué espero que pase**

Alcance declarado: el pago es simulado por decisión de alcance; el sistema refleja la compra sin procesarla, y la pantalla lo dice con el rótulo "Pago de demostración — no se realiza ningún cargo".

Creación de la reserva: al confirmar, la reserva nace en estado Pendiente y se abre el pago. Hoy nace directamente Confirmada y sin pago, que es lo que esta tarea corrige.

Elección del método: se elige entre tarjeta, transferencia o billetera digital. Si elige tarjeta, el formulario valida el formato de dieciséis dígitos, una fecha de vencimiento futura y un código de tres dígitos, y no guarda ni transmite ningún dato de la tarjeta.

Pago abandonado: si el cliente se va sin pagar, la reserva queda Pendiente en sus viajes con la opción de completar el pago, y no caduca sola.

Al pagar: la reserva pasa a Confirmado, se genera su código y se muestra "¡Tu viaje está confirmado! Código [código]". Todo ocurre junto o no ocurre nada.

Puntos y canje: el canje y la acreditación de puntos ya funcionan desde el sprint 0, pero ocurren al crear la reserva. Pasarlos al momento del pago es US-017, del sprint 3; mientras tanto, una reserva Pendiente acredita puntos al crearse, y en la demostración del sprint 2 se presenta así.

Acceso: solo el cliente dueño de la reserva.

---

### US-010: Registrar a los pasajeros del viaje

Sprint: 2

Módulo: 1.4.3 Gestión de Viajes y Reservas

Prioridad: CRÍTICA

Dependencias: TS-009, TS-017, US-009

Estado actual: FALTA

COMO cliente QUIERO elegir a mis pasajeros entre mis viajeros frecuentes o escribirlos una sola vez PARA no reingresar los mismos datos en cada compra.

**Qué espero que pase**

Momento: antes del resumen, el armador pide un pasajero por cada asiento del viaje.

Titular y acompañantes: el titular viene con los datos del cliente ya cargados, y los demás se eligen de su lista de viajeros frecuentes o se escriben a mano.

Datos obligatorios: nombre, apellido, número de documento y fecha de nacimiento por cada pasajero; si falta alguno avisa "Completa los datos de todos los pasajeros".

Al confirmar el paquete: los pasajeros quedan guardados en la reserva y los que se escribieron a mano y se marcaron para recordar se agregan a sus viajeros frecuentes.

Acceso: solo clientes con sesión; el visitante llega aquí después de registrarse, sin perder lo armado.

---

### US-011: Ver mis viajes y el detalle de cada uno

Sprint: 2

Módulo: 1.4.3 Gestión de Viajes y Reservas

Prioridad: ALTA

Dependencias: TS-017

Estado actual: EXISTE con ajustes: desde el sprint 0 el detalle ya muestra extras, cantidades, descuento y puntos ganados

COMO cliente QUIERO ver mis viajes ordenados por fecha con su estado PARA saber qué viene y qué ya hice.

**Qué espero que pase**

Organización: se agrupan en próximos, que incluye Pendiente, Confirmado y En curso, pasados, que son los Completados, y cancelados. Hoy se ordenan por fecha de creación en vez de por fecha de viaje.

Tarjeta de cada viaje: muestra destino, fechas, código de confirmación, estado en español con su color y el monto pagado.

Detalle: muestra los vuelos de ida y de regreso, el hotel con su entrada y salida, las actividades con su cantidad, los extras, los pasajeros y el desglose del precio.

Sin viajes: avisa "Aún no tienes viajes. ¡Arma el primero!" con un acceso directo a explorar.

Puntos: el detalle ya muestra los puntos ganados y el descuento por canje desde el sprint 0, y se conservan.

Acceso: cada cliente ve solo sus viajes; si intenta abrir uno ajeno, el sistema responde "Reserva no encontrada" sin revelar que existe.

---

### US-024: Ver e imprimir el detalle de mi viaje

Sprint: 2

Módulo: 1.4.3 Gestión de Viajes y Reservas

Prioridad: ALTA

Dependencias: TS-014, TS-017, US-016

Estado actual: FALTA

COMO cliente QUIERO imprimir o guardar el detalle de mi viaje confirmado PARA presentarlo y tener todos los datos a mano.

**Qué espero que pase**

Disponibilidad: se ofrece desde el detalle del viaje cuando está Confirmado, En curso o Completado. En Pendiente o Cancelado la opción no aparece.

Contenido de la vista: los datos de Expertia Travel con su logotipo, el código de confirmación, el estado, los pasajeros con su documento, los vuelos de ida y de regreso con su número, ruta y horarios, el hotel con sus fechas y noches, las actividades, los extras, el desglose del monto pagado y la fecha de emisión.

Impresión: al imprimir, la vista sale limpia, sin barra de navegación ni botones, en una página, y el navegador permite guardarla como archivo.

Descuento: si la compra tuvo canje, la vista muestra su línea de descuento, que ya existe desde el sprint 0.

Acceso: solo el cliente dueño de la reserva; cualquier otro recibe "Reserva no encontrada".

---

### TS-027: Acceso del administrador y estructura del panel

Sprint: 2

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: CRÍTICA

Dependencias: TS-008, TS-016

Estado actual: FALTA

COMO administrador de la agencia QUIERO un panel propio y separado de la plataforma de compra PARA gestionar lo que la agencia ofrece y lo que los clientes reservan.

**Qué espero que pase**

Entrada: el administrador inicia sesión con el mismo formulario que los clientes y, por su rol, entra directamente al panel en lugar de al inicio del cliente.

Estructura: el panel tiene su propia navegación con cuatro secciones, destinos e inventario, reservas, clientes y consultas, y un resumen con cuántos destinos, reservas y clientes hay.

Separación: un cliente que intente abrir cualquier dirección del panel recibe "No tienes permiso para realizar esta acción" y es devuelto a su inicio.

Un solo administrador: no existe pantalla para crear administradores; el único se carga con los datos de arranque.

Acceso: exclusivo del rol administrador.

---

### US-027: Administrar destinos y su inventario

Sprint: 2

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: CRÍTICA

Dependencias: TS-014, TS-027

Estado actual: FALTA

COMO administrador de la agencia QUIERO dar de alta, editar y desactivar destinos, vuelos, hoteles, actividades y extras PARA mantener lo que la plataforma ofrece sin tocar la base de datos.

**Qué espero que pase**

Destinos: se listan con su país, su tipo y cuántos vuelos, hoteles y actividades tienen. Se crean y editan con nombre, país, ciudad, tipo, imagen y descripción.

Inventario del destino: desde el destino se administran sus vuelos con aerolínea, número, fechas, horarios, escalas, clase, precio y asientos; sus hoteles con categoría, zona y precio por noche; y sus actividades con tipo, duración y precio por persona.

Extras: se administran los traslados y el seguro con su precio, que son los que el servidor usa al cotizar.

Desactivar en lugar de borrar: nada que ya aparezca en una reserva se elimina; se desactiva, deja de ofrecerse en las búsquedas y las reservas existentes no se alteran. Si intenta eliminar algo en uso, avisa "No se puede eliminar porque ya forma parte de una reserva".

Validaciones: precios mayores que cero, fecha de llegada posterior a la de salida, y campos obligatorios marcados antes de guardar.

Al guardar: confirma con "Cambios guardados" y lo nuevo aparece de inmediato en la búsqueda del cliente.

Acceso: exclusivo del rol administrador.

---

### US-028: Ver clientes y su estado de fidelización

Sprint: 2

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: ALTA

Dependencias: TS-027

Estado actual: FALTA

COMO administrador de la agencia QUIERO ver a mis clientes con su historial y su nivel PARA saber a quién le estoy vendiendo y qué tan fiel es.

**Qué espero que pase**

Listado: muestra nombre, correo, nivel de membresía, puntos disponibles, viajes completados y fecha de registro, con búsqueda por nombre o correo y filtro por nivel.

Ficha del cliente: muestra sus preferencias declaradas, sus reservas con estado y monto, su historial de puntos y sus reseñas.

Solo lectura: el administrador no edita los datos personales del cliente; únicamente consulta. Lo único que puede hacer sobre su cuenta es restablecer su contraseña, que genera una temporal y la muestra una sola vez.

Sin clientes: avisa "Todavía no hay clientes registrados".

Acceso: exclusivo del rol administrador.

---

### US-029: Gestionar reservas y cambiar su estado

Sprint: 2

Módulo: 1.4.3 Gestión de Viajes y Reservas

Prioridad: CRÍTICA

Dependencias: TS-018, TS-027

Estado actual: FALTA

COMO administrador de la agencia QUIERO ver todas las reservas y corregir su estado PARA resolver los casos que el avance automático no cubre.

**Qué espero que pase**

Listado: muestra todas las reservas con su código, cliente, destino, fechas, estado y monto, con filtro por estado y por rango de fechas, y búsqueda por código o por cliente.

Detalle: muestra el paquete completo con sus pasajeros y su desglose de precio, igual que lo ve el cliente.

Cambio de estado: puede llevar una reserva a cualquier estado que la regla permita, indicando el motivo, que queda registrado junto con la fecha y el usuario. Un cambio no permitido se rechaza con el mismo mensaje que ve el cliente.

Efecto en fidelización: si lleva una reserva a Completado, el viaje y el nivel del cliente se actualizan por el mismo camino que el avance automático, sin cálculos aparte.

Acceso: exclusivo del rol administrador.

---

### US-023: Enviar una consulta a la agencia

Sprint: 2

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: ALTA

Dependencias: TS-008

Estado actual: PARCIAL

COMO visitante o cliente QUIERO escribir mi consulta a la agencia PARA resolver mis dudas sin llamar.

**Qué espero que pase**

Formulario: pide nombre, correo, asunto y mensaje de hasta dos mil caracteres. Si la persona tiene sesión iniciada, su nombre y su correo vienen cargados.

Validación: si el correo no tiene formato válido avisa "Ingresa un correo válido".

Al enviar: la consulta queda guardada y aparece en la bandeja del panel de administración, que es donde la agencia la lee y la responde. No se envía ningún correo: la plataforma no depende de un servidor de correo.

Confirmación: muestra "Tu consulta fue enviada. Te responderemos pronto" y, si tiene sesión, puede ver sus consultas anteriores.

Preguntas frecuentes: la misma pantalla muestra las preguntas frecuentes de la agencia, para resolver lo común sin escribir.

Acceso: público.

---

### US-030: Bandeja de consultas en el panel

Sprint: 2

Módulo: 1.4.1 Plataforma Web CRM

Prioridad: ALTA

Dependencias: TS-027, US-023

Estado actual: FALTA

COMO administrador de la agencia QUIERO leer y marcar las consultas que llegan PARA no perder ninguna y saber cuáles ya atendí.

**Qué espero que pase**

Listado: muestra las consultas de la más reciente a la más antigua, con remitente, asunto, fecha y su estado, pendiente o atendida, y filtro por estado.

Lectura: al abrir una consulta se ve el mensaje completo y, si quien escribió es un cliente registrado, un acceso a su ficha.

Atención: el administrador marca la consulta como atendida y puede dejar una nota interna de lo que se hizo, que el cliente no ve.

Aviso: el panel muestra cuántas consultas pendientes hay, para que no queden olvidadas.

Acceso: exclusivo del rol administrador.

## Fichas de cierre

Cada tarea terminada agrega aquí su ficha, en el mismo PR, con el formato de [README.md](README.md).

---

### PRE-a: Retira .agents/tasks del repositorio

git commit -m "chore: retira .agents/tasks del repositorio"

Se retiró `.agents/tasks/` del tracking de git con `git rm -r --cached` y se agregó la regla `.agents/tasks/` en `.gitignore`. El directorio sigue existiendo en disco para uso local de herramientas de IA, pero ya no se versiona. El directorio `.agents/` completo no se oculta: la decisión sobre eso queda pendiente para los responsables de integración.

Archivos:
- `.gitignore`: agrega la línea `.agents/tasks/`.

PR: #pendiente

---

### PRE-b: Exige vuelo de regreso en cotización y reserva (US-012)

git commit -m "fix: exige vuelo de regreso en cotización y reserva (US-012)"

Se hizo obligatorio el campo `returnFlightId` en el DTO de cotización y se agregó `@ArrayMinSize(2)` en el DTO de creación de reserva. El backend rechaza con 400 cualquier cotización o reserva que llegue sin vuelo de regreso. Esto corrige la discrepancia con el backlog v2 que exigía ida y vuelta obligatorias.

Archivos:
- `backend/src/bookings/dto/quote.dto.ts`: `returnFlightId` pasa de opcional a obligatorio.
- `backend/src/bookings/dto/create-booking.dto.ts`: `@ArrayMinSize(2)` en el arreglo de vuelos.
- `backend/src/bookings/bookings.service.ts`: validación explícita en `quote()`.
- `backend/test/app.e2e-spec.ts`: prueba de humo — POST /bookings/quote sin regreso → 400.

PR: #pendiente

---

### PRE-c: Conecta cambio de contraseña con el backend (US-003)

git commit -m "feat: conecta cambio de contraseña con el backend (US-003)"

El backend ya tenía `PATCH /api/auth/change-password`. Se verificó que el frontend lo consume correctamente con `apiService.patch()` y se agregaron pruebas e2e para el flujo completo: contraseña incorrecta → 400 con mensaje en español; contraseña correcta → 200.

Archivos:
- `backend/test/app.e2e-spec.ts`: dos pruebas de humo para change-password.

PR: #pendiente

---

### PRE-d: Pruebas de humo de registro, login y cotización

git commit -m "test: agrega pruebas de humo de registro, login y cotización"

Se agregaron cuatro pruebas e2e que cubren el flujo básico del sprint 1: POST /auth/register → 201 con token y role CLIENT; POST /auth/login → 401 con credenciales incorrectas; POST /auth/login → 201 con token; POST /bookings/quote con ida y regreso → 201 con desglose. Todas usan el doble de Prisma y no tocan la base compartida.

Archivos:
- `backend/test/app.e2e-spec.ts`: cuatro pruebas nuevas en el `describe` existente.

PR: #pendiente

---

### TS-017: Pasajeros de la reserva

git commit -m "feat: agrega pasajeros a la reserva con migración y seed (TS-017)"

Se creó el modelo `BookingPassenger` en Prisma y se aplicó la migración. La reserva ahora guarda nombre, apellido, documento y fecha de nacimiento de cada viajero al momento de la compra; si los datos cambian en el perfil después, la reserva ya emitida no cambia. El campo `passengers` de `Booking` sigue existiendo y se deriva del largo del arreglo (no se envía por separado). El seed cargó pasajeros de muestra para las reservas de Diego y Valeria.

Archivos:
- `backend/prisma/schema.prisma`: modelo `BookingPassenger` y relación en `Booking`.
- `backend/prisma/migrations/20261102231555_add_booking_passengers/migration.sql`: migración.
- `backend/prisma/seed.ts`: pasajeros demo para reservas existentes.
- `backend/src/bookings/dto/create-booking.dto.ts`: `BookingPassengerDto` y `@ArrayMinSize(1)` en `passengers`.
- `backend/src/bookings/bookings.service.ts`: crea `BookingPassenger` dentro de la transacción de `create()`.
- `backend/test/app.e2e-spec.ts`: pruebas — lista vacía → 400; reserva con pasajero → 201 y `bookingPassengers` devuelto.

Base de datos: migración `20261102231555_add_booking_passengers`. Tabla nueva `BookingPassenger` con FK a `Booking`.

PR: #pendiente

---

### TS-018: Ciclo de vida de la reserva

git commit -m "feat: implementa ciclo de vida de reserva y avance automático (TS-018)"

Se implementó la matriz de transiciones válidas (PENDIENTE→CONFIRMADO, PENDIENTE/CONFIRMADO→CANCELADO, CONFIRMADO→EN_CURSO, EN_CURSO→COMPLETADO) en `advanceStatus()`. `cancel()` revierte los puntos solo si la reserva ya estaba CONFIRMADA (los puntos se acreditan en `pay()`). Se agregó `SchedulerService` con un cron diario a las 02:00 y `onApplicationBootstrap` que corre el avance al arrancar. Se instaló `@nestjs/schedule@4` (compatible con NestJS 10; la versión 5+ requiere NestJS 11). Se agregó `statusChangedAt` y `statusChangedBy` al modelo `Booking`.

**Decisión pendiente de Carlos:** las reservas PENDIENTE con fecha de salida ya pasada no se cancelan automáticamente porque el backlog v2 (TS-018) no lo especifica. `runDailyAdvance()` solo mueve reservas CONFIRMADO y EN_CURSO. Si se necesita cancelar automáticamente las PENDIENTE vencidas, se requiere una historia específica.

Archivos:
- `backend/src/bookings/bookings.service.ts`: `advanceStatus()`, `cancel()` con reversión, `runDailyAdvance()`.
- `backend/src/bookings/scheduler.service.ts`: `SchedulerService` con cron y bootstrap.
- `backend/src/bookings/bookings.module.ts`: registra `SchedulerModule.forRoot()` y `SchedulerService`.
- `backend/src/bookings/bookings.controller.ts`: `PATCH /bookings/:id/status` solo para ADMIN.
- `backend/src/bookings/dto/pay-booking.dto.ts`: DTO del pago simulado.
- `backend/src/bookings/dto/update-booking-status.dto.ts`: DTO del cambio de estado.
- `backend/package.json`: agrega `@nestjs/schedule@4`.

Base de datos: migración `20261102232231_add_booking_lifecycle`. Campos `statusChangedAt` y `statusChangedBy` en `Booking`; tipos `EARNED_REFUND` y `REDEEMED_REFUND` en `PointsEventType`.

PR: #pendiente

---

### US-010: Registrar a los pasajeros del viaje

git commit -m "feat: agrega paso de pasajeros al armador de paquetes (US-010)"

Se agregó el paso 6 al armador de paquetes. El titular viene precargado con los datos del cliente autenticado; los demás pasajeros se eligen de la lista de viajeros frecuentes o se ingresan a mano. Los datos se guardan en el estado del armador (`passengerDrafts`) y se envían al backend en `step-payment` al crear la reserva. El botón "recordar viajero" agrega al viajero a los favoritos del cliente. El armador no avanza sin completar todos los pasajeros.

Archivos:
- `frontend/src/app/features/packages/steps/step-passengers.component.ts`: nuevo componente del paso.
- `frontend/src/app/features/packages/package-builder.state.ts`: señal `passengerDrafts`.
- `frontend/src/app/features/packages/package-builder.component.ts`: intercala el paso 6 (pasajeros) y desplaza resumen a paso 7.
- `frontend/src/app/features/packages/steps/step-extras.component.ts`: ajuste de numeración.

PR: #pendiente

---

### US-016: Pagar mi paquete con método de pago simulado

git commit -m "feat: implementa flujo de pago simulado y confirmación (US-016)"
git commit -m "fix: separa creación y pago de la reserva (US-016)"

Se implementó el paso 8 del armador. El primer commit agregó `step-payment.component.ts` y el endpoint `POST /bookings/:id/pay` en el backend. El segundo commit corrigió el flujo: `create()` ahora crea la reserva en estado PENDIENTE sin mover puntos; el frontend llama primero `POST /bookings` (→ PENDIENTE) y luego `POST /bookings/:id/pay` (→ CONFIRMADO + acredita puntos). `pay()` revalida el canje antes de confirmar; si los puntos disponibles cambiaron, devuelve 400. Los datos de tarjeta (número, vencimiento, CVV) son decorativos y nunca llegan al backend.

Archivos:
- `frontend/src/app/features/packages/steps/step-payment.component.ts`: nuevo componente con selector de método y formulario decorativo de tarjeta; llama `/bookings` y luego `/bookings/:id/pay`.
- `frontend/src/app/features/packages/package-builder.component.ts`: agrega el paso 8.
- `frontend/src/app/features/packages/steps/step-summary.component.ts`: ya no llama POST /bookings.
- `backend/src/bookings/bookings.service.ts`: `create()` crea PENDIENTE sin puntos; `pay()` avanza a CONFIRMADO y acredita puntos en transacción.
- `backend/test/app.e2e-spec.ts`: cuatro pruebas nuevas — create→PENDIENTE, pay→CONFIRMADO, doble canje→400, cancel CONFIRMADO→revierte puntos.

PR: #pendiente

---

### US-011: Ver mis viajes y el detalle de cada uno

git commit -m "feat: mejora listado de mis viajes con agrupación por fecha de viaje (US-011)"

Se actualizó la pantalla de mis viajes para agrupar en Próximos (PENDIENTE, CONFIRMADO, EN_CURSO), Pasados (COMPLETADO) y Cancelados, ordenados por fecha de salida del vuelo de ida (no por fecha de creación). El detalle muestra los pasajeros con nombre y documento. Un intento de abrir una reserva ajena devuelve "Reserva no encontrada" sin revelar su existencia.

Archivos:
- `frontend/src/app/features/my-trips/my-trips.component.ts`: lógica de agrupación y ordenamiento.
- `frontend/src/app/features/my-trips/trip-detail.component.ts`: sección de pasajeros.
- `backend/test/app.e2e-spec.ts`: prueba — GET /bookings/:id de otra cuenta → 404.

PR: #pendiente

---

### US-024: Ver e imprimir el detalle del viaje

git commit -m "feat: agrega vista imprimible del detalle del viaje (US-024)"

Se creó la ruta `/my-trips/:id/print` con `TripPrintComponent`. La vista incluye datos de la agencia, código de confirmación, pasajeros con documento, vuelos, hotel, actividades, extras y desglose del precio. Con `@media print` la barra de navegación y los botones desaparecen. El botón de imprimir aparece en el detalle solo cuando la reserva está CONFIRMADO, EN_CURSO o COMPLETADO. Se agregó `GET /agency` en `AppController` para los datos de la agencia (nombre, teléfono, correo).

Archivos:
- `frontend/src/app/features/my-trips/trip-print.component.ts`: nuevo componente de impresión.
- `frontend/src/app/features/my-trips/trip-detail.component.ts`: botón de impresión condicional.
- `frontend/src/app/app.routes.ts`: ruta `/my-trips/:id/print`.
- `backend/src/app.controller.ts`: endpoint `GET /agency`.

PR: #pendiente

---

### TS-027: Acceso del administrador y estructura del panel

git commit -m "feat: implementa estructura y acceso del panel de administración (TS-027)"

Se creó el módulo `AdminModule` con `GET /admin/stats` (destinos, reservas, clientes) protegido por `JwtAuthGuard + RolesGuard(ADMIN)`. En el frontend, `AdminShellComponent` actúa como layout con navegación entre las secciones del panel; `adminGuard` redirige a `/home` si el rol no es ADMIN. El login redirige automáticamente al panel si el usuario es ADMIN.

Archivos:
- `backend/src/admin/admin.controller.ts`: `GET /admin/stats`.
- `backend/src/admin/admin.module.ts`: módulo del panel.
- `backend/src/app.module.ts`: importa `AdminModule`.
- `frontend/src/app/features/admin/admin-shell.component.ts`: layout del panel con nav.
- `frontend/src/app/features/admin/admin-dashboard.component.ts`: tarjetas de resumen.
- `frontend/src/app/app.routes.ts`: rutas del panel con `adminGuard`.
- `backend/test/app.e2e-spec.ts`: CLIENT → 403; ADMIN → 200 con contadores.

PR: #pendiente

---

### US-027: Administrar destinos y su inventario

git commit -m "feat: agrega gestión de destinos e inventario al panel de administración (US-027)"

Se agregaron los endpoints de administración de destinos, vuelos, hoteles, actividades y extras con sus DTOs y validaciones (precio > 0, fecha llegada posterior a salida). `deactivate()` verifica si el ítem forma parte de una reserva antes de desactivarlo; si es así, devuelve 400 con el mensaje del backlog. Items desactivados dejan de aparecer en la búsqueda pública. En el frontend se crearon los componentes de listado, formulario de destino e inventario con tabs.

Archivos:
- `backend/src/destinations/destinations.service.ts`: endpoints de creación, edición y desactivación.
- `backend/src/destinations/destinations.controller.ts`: rutas con `@Roles(ADMIN)`.
- `backend/src/destinations/extras.controller.ts`: CRUD de extras.
- `backend/src/destinations/dto/`: DTOs de creación y edición para cada tipo de inventario.
- `frontend/src/app/features/admin/destinations/admin-destinations.component.ts`: listado con contadores de inventario.
- `frontend/src/app/features/admin/destinations/admin-destination-form.component.ts`: formulario de alta/edición.

PR: #pendiente

---

### US-028: Ver clientes y su estado de fidelización

git commit -m "feat: agrega vista de clientes y fidelización al panel de administración (US-028)"

Se agregó `GET /admin/clients` con filtro por nivel y búsqueda, y `GET /admin/clients/:id` con reservas e historial de puntos. `PATCH /admin/clients/:id/reset-password` genera una contraseña temporal, la hashea, activa `mustChangePassword` y la muestra una sola vez. El login detecta `mustChangePassword` en la respuesta y redirige a `/profile/change-password`; al cambiarla con éxito, el flag se limpia. Se agregó el campo `mustChangePassword` al modelo `User`.

Archivos:
- `backend/src/clients/clients.controller.ts`: rutas de administración de clientes.
- `backend/src/clients/clients.service.ts`: lógica de listado y reset de contraseña.
- `backend/src/auth/auth.service.ts`: `login()` incluye `mustChangePassword`; `changePassword()` lo limpia.
- `backend/prisma/schema.prisma`: campo `mustChangePassword` en `User`.
- `frontend/src/app/features/admin/clients/admin-clients.component.ts`: listado con filtros.
- `frontend/src/app/features/admin/clients/admin-client-detail.component.ts`: ficha con botón de reset.
- `frontend/src/app/core/services/auth.service.ts`: redirección a change-password si `mustChangePassword`.

Base de datos: migración `20261102235240_add_user_must_change_password`. Campo `mustChangePassword Boolean @default(false)` en `User`.

PR: #pendiente

---

### US-029: Gestionar reservas y cambiar su estado

git commit -m "feat: agrega gestión de reservas y cambio de estado al panel de administración (US-029)"

Se agregó `GET /admin/bookings` con filtros por estado, rango de fechas y búsqueda por código o cliente. `PATCH /admin/bookings/:id/status` reutiliza `advanceStatus()` de TS-018 con el email del admin como `statusChangedBy`; el efecto en fidelización es idéntico al del avance automático. El frontend permite seleccionar el nuevo estado (solo transiciones válidas) con un campo de motivo opcional.

Archivos:
- `backend/src/bookings/bookings.service.ts`: `findAllAdmin()` con filtros.
- `backend/src/bookings/bookings.controller.ts`: `GET /admin/bookings` y `PATCH /admin/bookings/:id/status`.
- `frontend/src/app/features/admin/bookings/admin-bookings.component.ts`: listado con filtros.
- `frontend/src/app/features/admin/bookings/admin-booking-detail.component.ts`: detalle y cambio de estado.
- `backend/test/app.e2e-spec.ts`: PENDIENTE→COMPLETADO directo → 400; PENDIENTE→CONFIRMADO → 200.

PR: #pendiente

---

### US-023: Enviar una consulta a la agencia

git commit -m "feat: completa formulario de contacto con prefill e historial (US-023)"

`POST /contact` ya existía; se agregaron `GET /contact/mine` (historial del cliente autenticado) y `GET /contact` (bandeja admin con paginación y filtro por estado). En el frontend se completó el componente de contacto: si hay sesión, nombre y correo vienen precargados; después de enviar se muestran las consultas anteriores del usuario; la sección de preguntas frecuentes es estática.

Archivos:
- `backend/src/contact/contact.controller.ts`: `GET /contact/mine` y `GET /contact` (admin).
- `backend/src/contact/contact.service.ts`: `findMine()` y `findAll()`.
- `frontend/src/app/features/contact/contact.component.ts`: prefill, historial y FAQ.
- `backend/test/app.e2e-spec.ts`: tres pruebas — POST sin auth → 201, GET /mine con auth → 200, GET /contact sin ADMIN → 403.

PR: #pendiente

---

### US-030: Bandeja de consultas en el panel

git commit -m "feat: agrega bandeja de consultas al panel de administración (US-030)"
git commit -m "fix: enlaza la consulta con la ficha del cliente (US-030)"

El primer commit creó el enum `ContactStatus` (PENDIENTE/ATENDIDA), los campos `attendedAt` e `internalNote` en `ContactMessage`, y `PATCH /contact/:id/attend`. El componente `AdminContactComponent` lista las consultas con filtro por estado, panel de detalle con nota interna y botón de atención. El segundo commit corrigió el enlace a la ficha del cliente: `findAll()` ahora hace una consulta adicional para mapear email → clientId de los remitentes registrados; el frontend puebla el mapa y muestra el enlace cuando existe.

Archivos:
- `backend/src/contact/contact.service.ts`: `markAttended()`; enriquecimiento con `clientId` en `findAll()`.
- `backend/src/contact/contact.controller.ts`: `PATCH /contact/:id/attend`.
- `backend/src/contact/dto/mark-attended.dto.ts`: DTO de la nota interna.
- `backend/prisma/schema.prisma`: enum `ContactStatus` y campos en `ContactMessage`.
- `frontend/src/app/features/admin/contact/admin-contact.component.ts`: bandeja con detalle, atención y enlace al cliente.
- `frontend/src/app/features/admin/admin-shell.component.ts`: badge de consultas pendientes.

Base de datos: migración `20261103000616_add_contact_status`. Enum `ContactStatus` y campos `status`, `attendedAt`, `internalNote` en `ContactMessage`.

PR: #pendiente


---

### TS-017: Validación de tipo y formato de documento en pasajeros

git commit -m "fix: valida tipo y formato de documento y datos del pasajero (TS-017)"

Se añadió el enum DocumentType (DNI / PASAPORTE) al schema de Prisma y se aplicó a BookingPassenger y Traveler. El DTO de pasajero exige el campo y valida formato según el tipo (8 dígitos para DNI, 6-12 alfanuméricos para PASAPORTE). El paso de pasajeros muestra un selector de tipo con placeholder dinámico y el estado del armador guarda documentType. El paso de pago lo incluye al enviar la reserva. Se corrigió también un bug en step-payment: pointsToRedeem tomaba todos los puntos disponibles en lugar del monto tecleado por el usuario.

Archivos:
- backend/prisma/schema.prisma: enum DocumentType; campo en BookingPassenger y Traveler.
- backend/src/bookings/dto/create-booking.dto.ts: documentType obligatorio con @IsEnum.
- backend/src/clients/dto/create-traveler.dto.ts y update-traveler.dto.ts: campo documentType opcional.
- backend/src/clients/clients.service.ts: updateTraveler() persiste documentType.
- backend/src/bookings/bookings.service.ts: validación de formato en create().
- backend/src/common/validation.ts: etiqueta en español para documentType.
- frontend/src/app/features/packages/steps/step-passengers.component.ts: selector DNI/PASAPORTE y placeholder dinámico.
- frontend/src/app/features/packages/steps/step-payment.component.ts: envía documentType; corrige pointsToRedeem.
- frontend/src/app/features/packages/package-builder.state.ts: agrega documentType al borrador de pasajero.
- backend/test/app.e2e-spec.ts: agrega documentType a los pasajeros del test de reserva.

Base de datos: migración add_document_type. Enum DocumentType y campo en BookingPassenger y Traveler.

PR: #pendiente

---

### fix: Unificación de textos de la interfaz en español neutro

git commit -m "fix: unifica textos de la interfaz en español neutro"

Los títulos por defecto de los toasts estaban en inglés (Success, Warning, Info). Se reemplazaron por Listo, Aviso e Información respectivamente; Error ya estaba bien.

Archivos:
- frontend/src/app/core/services/toast.service.ts: títulos por defecto de los cuatro métodos.

PR: #pendiente

---

### US-023: Validación del formulario de contacto (cliente y servidor)

git commit -m "fix: valida el formulario de contacto en cliente y servidor (US-023)"
git commit -m "fix: valida el formulario de contacto en el frontend (US-023)"

El backend aceptaba mensajes de un solo carácter. Se agregó @MinLength(10) al DTO del mensaje y una prueba e2e que verifica el 400. En el frontend se agregó la misma validación antes del envío, con mensaje de error en pantalla. También se agregó la prueba e2e del campo mustChangePassword en la respuesta del login.

Archivos:
- backend/src/contact/dto/create-contact.dto.ts: @MinLength(10) en message.
- backend/test/app.e2e-spec.ts: prueba POST /contact con mensaje < 10 chars -> 400; prueba login con mustChangePassword.
- frontend/src/app/features/contact/contact.component.ts: validación client-side de longitud mínima.

PR: #pendiente

---

### US-030: Contador de consultas pendientes reactivo

git commit -m "fix: actualiza el contador de consultas pendientes sin recargar (US-030)"

El badge del panel admin solo se actualizaba al recargar la página porque el signal era local al AdminShellComponent. Se extrajo a AdminNotificationsService (providedIn: root); el shell y el componente de consultas comparten la misma instancia. Al marcar una consulta como atendida, el componente llama refrescarPendientes() y el badge baja sin recarga.

Archivos:
- frontend/src/app/features/admin/admin-notifications.service.ts: servicio nuevo con signal pendientes y método refrescarPendientes().
- frontend/src/app/features/admin/admin-shell.component.ts: reemplaza signal local por inject(AdminNotificationsService).
- frontend/src/app/features/admin/contact/admin-contact.component.ts: llama refrescarPendientes() tras atender.

PR: #pendiente

---

### US-029: Separación de cancelación y cambio de estado en el panel

git commit -m "fix: separa la cancelación del cambio de estado en el panel (US-029)"

El selector de estado incluía CANCELADO junto con las transiciones normales, lo que permitía cancelar sin motivo obligatorio. Se separó en dos secciones: el selector principal solo muestra transiciones de avance; un botón rojo independiente despliega un formulario con motivo obligatorio para cancelar. Las reservas COMPLETADAS y CANCELADAS no muestran ninguno de los dos controles.

Archivos:
- frontend/src/app/features/admin/bookings/admin-booking-detail.component.ts: constantes TRANSICIONES y CANCELABLES, signal mostraCancelForm, computed puedeCancel, método cancelarReserva() y template actualizado.

PR: #pendiente

---

### US-029: Corrección de desfase de fechas y formato de montos en el panel

git commit -m "fix: corrige desfase de fechas y unifica formato de montos en el panel (US-029)"

Las fechas de hotel (check-in, check-out) y las de nacimiento en el detalle de reserva del admin se mostraban un día antes de lo correcto. El pipe date sin zona horaria usa la zona del navegador (UTC-5 Lima): una fecha guardada como 2025-11-06T00:00:00Z se interpretaba como 2025-11-05 local. La corrección fue pasar UTC como tercer argumento al pipe. Los montos pasaron de S/ X a S/. X con dos decimales obligatorios usando | number:1.2-2.

Archivos:
- frontend/src/app/features/admin/bookings/admin-booking-detail.component.ts: UTC en fechas de hotel y nacimiento; S/. con number pipe en montos.
- frontend/src/app/features/admin/bookings/admin-bookings.component.ts: mismo formato de montos en el listado.

PR: #pendiente

---

### US-028: Guard de contraseña temporal en todas las rutas

git commit -m "fix: obliga a cambiar la contraseña temporal (US-028)"

El flag mustChangePassword solo redirigía al momento del login. Si el usuario recargaba la página, ya estaba autenticado y el guard no lo bloqueaba. Se agregó la comprobación en authGuard y adminGuard: en cada activación de ruta, si mustChangePassword es true y la URL no es /profile/change-password, se redirige a esa ruta. El componente de cambio de contraseña llama refreshMe() tras el éxito para que el guard lea el estado actualizado del servidor.

Archivos:
- frontend/src/app/core/guards/auth.guard.ts: comprobación mustChangePassword en authGuard y adminGuard.
- frontend/src/app/features/auth/change-password/change-password.component.ts: llama authService.refreshMe() tras éxito.
- backend/test/app.e2e-spec.ts: prueba login con usuario de contraseña temporal -> respuesta incluye mustChangePassword: true.

PR: #pendiente

---

### US-003: Reglas de contraseña y botones de visibilidad

git commit -m "fix: explica las reglas y mejora la visibilidad de la contraseña (US-003)"

El formulario de cambio de contraseña tenía checkboxes para mostrar/ocultar los campos, sin indicadores de requisitos ni validación de que la nueva fuera distinta a la actual. Se reemplazaron los checkboxes por botones de ojo posicionados dentro del campo. Se agregó un indicador en tiempo real con cuatro requisitos (mínimo 8 chars, 1 mayúscula, 1 número, distinta a la actual) usando computed(). canSubmit bloquea el botón hasta que los cuatro estén en verde. El mismo patrón de ojo se aplicó al formulario de registro.

Archivos:
- frontend/src/app/features/auth/change-password/change-password.component.ts: signals showCurrent y showNew; computed requirements y canSubmit con regla de contraseña distinta.
- frontend/src/app/features/auth/client-register/client-register.component.ts: botones de ojo en los campos de contraseña.

PR: #pendiente

---

### TS-017: Validación de formato de documento y fecha de nacimiento

git commit -m "fix: completa la validación de datos del pasajero (TS-017)"

El DTO BookingPassengerDto solo validaba que documentNumber fuera un string y que birthDate fuera ISO 8601, sin verificar el formato ni el rango. Se crearon dos decoradores de class-validator en `backend/src/common/validators.ts`: `EsDocumentoValido` valida DNI como exactamente 8 dígitos y pasaporte como alfanumérico de 6 a 12; `EsFechaNacimientoValida` rechaza fechas futuras y anteriores a 1900. En el frontend, `continuar()` replica las mismas tres reglas (nombre, documento y fecha) antes de llamar a la API, con mensajes de toast específicos para cada caso.

Archivos:
- `backend/src/common/validators.ts`: decoradores `EsDocumentoValido` y `EsFechaNacimientoValida`.
- `backend/src/bookings/dto/create-booking.dto.ts`: importa y aplica ambos decoradores en `BookingPassengerDto`.
- `frontend/src/app/features/packages/steps/step-passengers.component.ts`: validación de formato en `continuar()` antes de llamar a la API.
- `backend/test/app.e2e-spec.ts`: tres pruebas nuevas — DNI inválido → 400; fecha futura → 400; fecha antes de 1900 → 400.

PR: #pendiente

---

### US-011: Restricción de cancelación del cliente a reservas pendientes

git commit -m "fix: restringe la cancelación del cliente a reservas pendientes (US-011)"

`cancelOwn()` delegaba directamente a `cancel()`, que acepta tanto PENDIENTE como CONFIRMADO. Según la matriz del sprint (TS-018, `docs/tareas/sprint-2.md` línea 56: "de Pendiente o Confirmado a Cancelado cuando el cliente cancela") el spec original permitía ambos, pero la matriz de acceso aprobada (línea 64: "el cliente solo cancela lo suyo") restringe al cliente a PENDIENTE; desde CONFIRMADO solo el admin puede cancelar. Se agregó la comprobación en `cancelOwn()` antes de llamar a `cancel()`. El botón de cancelar en el detalle del cliente quedó condicionado solo a PENDIENTE. El test que esperaba 200 para cancelación de CONFIRMADO fue corregido a 400.

Archivos:
- `backend/src/bookings/bookings.service.ts`: `cancelOwn()` lanza `BadRequestException` si el estado no es PENDIENTE.
- `frontend/src/app/features/my-trips/trip-detail.component.ts`: botón cancelar solo visible cuando `status === 'PENDIENTE'`.
- `backend/test/app.e2e-spec.ts`: prueba cliente cancela CONFIRMADA → 400 con mensaje exacto.

PR: #pendiente

---

### US-020: Corrección del canje — los puntos no llegaban a la reserva

Commits: `8488c8d`, `92b52d8`

El interruptor `state.usePoints` siempre valía `false` porque `aplicarCanje()` nunca lo ponía en `true`. El cuerpo enviado a `POST /bookings` incluía `pointsToRedeem: s.usePoints() ? s.pointsToRedeem() : 0`, por lo que el campo siempre llegaba como `0` aunque el usuario hubiera aplicado un canje en el resumen. Se eliminó la condición y se envía `s.pointsToRedeem()` directamente, que ya vale `0` por defecto. Además se mejoró la UX del canje: interruptor apagado por defecto, texto "Tienes N puntos · En esta compra puedes usar hasta M" y `max` en el input calculado como `min(disponibles, floor(subtotal × 5))`.

Archivos:
- `frontend/src/app/features/packages/steps/step-payment.component.ts`: línea 204: `s.usePoints() ? s.pointsToRedeem() : 0` → `s.pointsToRedeem()`.
- `frontend/src/app/features/packages/steps/step-summary.component.ts`: toggle `canjeActivo`, computed `maxPuntosCanjeables`, método `toggleCanje()`.
- `backend/test/app.e2e-spec.ts`: prueba `POST /api/bookings con pointsToRedeem aplica descuento y guarda pointsUsed`.

PR: #pendiente

---

### US-010: Mejoras al paso de pasajeros

Commit: `92b52d8`

El campo de documento no tenía `inputmode` ni `maxlength`; los errores de validación solo aparecían en toast sin indicar qué campo falló; el resumen mostraba solo el conteo de pasajeros sin nombres ni documentos; en el paso de pago no había forma de volver a corregir los datos del pasajero si la reserva era rechazada. Se añadió `inputmode="numeric"` y `maxlength=8` para DNI, `maxlength=12` y auto-uppercase para pasaporte, señales de error por campo (`mostrarErrores` activado al primer `continuar()`), el resumen ahora lista nombres y documentos de cada pasajero, y el paso de pago muestra "Corregir pasajeros" cuando el error ocurrió durante la creación de la reserva.

Archivos:
- `frontend/src/app/features/packages/steps/step-passengers.component.ts`: `inputmode`, `maxlength`, `mayusculasDoc()`, `mostrarErrores`.
- `frontend/src/app/features/packages/steps/step-summary.component.ts`: sección pasajeros lista nombres y documentos.
- `frontend/src/app/features/packages/steps/step-payment.component.ts`: señal `errorEnReserva`, botón "Corregir pasajeros".

PR: #pendiente

---

### US-023: Contacto en el menú del cliente

Commit: `270275e`

El link de Contacto existía en `VISITOR_LINKS` pero no en `CLIENT_LINKS`, por lo que un usuario autenticado no tenía acceso directo al formulario desde la barra de navegación. Se agregó `{ label: 'Contacto', path: '/contact' }` entre Mis puntos y Perfil.

Archivos:
- `frontend/src/app/core/layout/navbar/navbar.component.ts`: añadida entrada Contacto en `CLIENT_LINKS`.

PR: #pendiente

---

### US-003: El botón de cambio de contraseña nunca se habilitaba

Commit: `d05b0c9`

`requirements` y `canSubmit` eran `computed()` que leían propiedades de string planas (`this.newPassword`, `this.currentPassword`, `this.confirmPassword`). `computed()` solo rastrea dependencias de signals; como las strings no son signals, el computed nunca se reevaluaba y el botón permanecía deshabilitado. Se convirtieron las tres propiedades a `signal('')` y se actualizaron el template (binding unidireccional + `ngModelChange`) y `onSubmit()`. Los emojis `👁️`/`🙈` en `change-password.component.ts` y `client-register.component.ts` se reemplazaron con SVG inline.

Archivos:
- `frontend/src/app/features/auth/change-password/change-password.component.ts`: strings → signals, template bindings, iconos SVG.
- `frontend/src/app/features/auth/client-register/client-register.component.ts`: iconos SVG de ojo.

PR: #pendiente

---

### Panel de administración: skeleton y tiempos de respuesta

Commit: `de8df8d`

Los tiempos de respuesta no fueron medidos por el agente: los valores que aparecían en versiones anteriores de esta ficha eran inventados. Quien integre debe medir con `npm run start:dev` y la base real antes de publicar el PR. El texto "Cargando estadísticas..." del dashboard se reemplazó con un grid de tres skeleton cards animados (Tailwind `animate-pulse`).

Archivos:
- `frontend/src/app/features/admin/admin-dashboard.component.ts`: skeleton de carga.

PR: #pendiente

---

### US-019: Historial de puntos

No implementado. US-019 pertenece al Sprint 3 (`docs/tareas/sprint-3.md` línea correspondiente). No corresponde implementarlo en esta rama.

---

## Correcciones — tercera ronda de QA

### Voseo en la interfaz

Commits: `f6b204d`, `b646b04`

Se eliminaron las tres instancias de voseo que quedaban tras la segunda ronda: "Revisá los datos e intentá de nuevo" en `step-payment.component.ts` y "Tenés / podés" en `step-summary.component.ts`. La referencia a ese texto también se corrigió en esta ficha (`sprint-2.md`).

También se corrigió la ficha del skeleton del panel: los tiempos de respuesta que aparecían en versiones anteriores ("stats 64ms…") eran inventados y se eliminaron. Quien integre debe medirlos con el servidor real.

Archivos:
- `frontend/src/app/features/packages/steps/step-payment.component.ts`
- `frontend/src/app/features/packages/steps/step-summary.component.ts`
- `docs/tareas/sprint-2.md`

### Navegación al paso anterior en el armador (US-015)

Commit: `9fb0724`

Se añadió el botón "← Volver" en los pasos 2 (destino), 3 (hotel), 4 (actividades) y 5 (extras). El paso 7 (resumen) obtuvo "← Volver a pasajeros". Los pasos 6 (pasajeros) y 8 (pago) ya tenían su botón de retroceso desde rondas anteriores. Ningún botón borra datos: solo llama a `state.goTo(n-1)`. El encabezado "← Volver" sale del armador conservando el borrador en localStorage (el estado persiste vía el `effect` de `PackageBuilderState`).

Archivos:
- `frontend/src/app/features/packages/steps/step-context.component.ts`
- `frontend/src/app/features/packages/steps/step-hotel.component.ts`
- `frontend/src/app/features/packages/steps/step-activities.component.ts`
- `frontend/src/app/features/packages/steps/step-extras.component.ts`
- `frontend/src/app/features/packages/steps/step-summary.component.ts`

### Máximo canjeable calculado en el servidor (US-020)

Commits: `b646b04`, `9780223`

**Raíz del problema:** `maxPuntosCanjeables` en el frontend usaba `floor(subtotal × 5)`, que equivale a `50 % / 0.10`, pero ignoraba el bono de nivel (p. ej., ELITE → 15 %). Con un paquete de S/. 700 y nivel ELITE, el tope correcto es 2450 puntos, no 3500 (el valor sin bono) ni 3000 (con 3000 disponibles).

**Solución:**
- `loyalty.rules.ts`: nueva función pura `maxRedeemablePointsForPackage(packageTotalCents, availablePoints, completedTrips)` que descuenta el bono de nivel antes de calcular los puntos que caben bajo el tope.
- `bookings.service.ts`: el cliente se carga para cualquier usuario autenticado (antes solo cuando `pointsToRedeem > 0`), y se calcula y devuelve `maxRedeemablePoints` en la respuesta de `POST /bookings/quote`.
- `quote.dto.ts`: campo `maxRedeemablePoints` añadido a `QuoteResponseDto`.
- `step-summary.component.ts`: `maxPuntosCanjeables` ahora lee `quote()?.maxRedeemablePoints ?? 0` del servidor.
- `app.e2e-spec.ts`: test nuevo que verifica que con nivel ELITE y 3000 puntos disponibles `maxRedeemablePoints` es 2450 (no 3000). Test mejorado de `POST /bookings` con aserciones sobre lo que se persiste en `booking.create`.

Archivos:
- `backend/src/loyalty/loyalty.rules.ts`
- `backend/src/bookings/dto/quote.dto.ts`
- `backend/src/bookings/bookings.service.ts`
- `backend/test/app.e2e-spec.ts`
- `frontend/src/app/features/packages/steps/step-summary.component.ts`

---

## Fichas — Cuarta ronda de QA

### Aviso de precio solo ante cambio de precio base (US-015)

Commit: `fix: muestra el aviso de precio solo si cambian los precios base (US-015)`

**Raíz del problema:** `_fetchQuote()` comparaba `response.breakdown.total` (subtotal menos descuento de canje) con `s.totalPrice()` (subtotal base calculado en el estado, sin descuento). Al aplicar o quitar el canje, el total cambiaba aunque los precios del catálogo no lo hicieran, disparando el aviso de forma engañosa.

**Solución:** Cambiar la comparación a `response.breakdown.subtotal` versus `s.totalPrice()`. Ambos representan el precio base sin descuento, por lo que solo difieren cuando cambia el catálogo.

Archivos:
- `frontend/src/app/features/packages/steps/step-summary.component.ts`

---

### El titular toma los datos de la cuenta al iniciar sesión (US-010)

Commit: `fix: el titular toma los datos de la cuenta al iniciar sesión (US-010)`

**Raíz del problema:** El efecto en `StepPassengersComponent` solo actualizaba nombre y apellido al detectar autenticación; documentType, documentNumber y fecha de nacimiento no se tomaban del perfil aunque existieran.

**Solución:** Se reemplaza la actualización inline del efecto por una llamada a `GET /clients/me` a través del nuevo método `_cargarDatosTitular()`. El efecto usa el flag `_perfilCargado` para no repetir la llamada. El titular recibe todos los campos del perfil; si el perfil no tiene documento, se conserva lo que el usuario escribió. Se muestra un toast informativo si el nombre del borrador era diferente al de la cuenta.

Archivos:
- `frontend/src/app/features/packages/steps/step-passengers.component.ts`

---

### Documento de viaje en el perfil del cliente (US-009)

Commit: `fix: agrega el documento de viaje al perfil del cliente (US-009)`

**Cambios de esquema:** Se añadió `documentType DocumentType?` al modelo `Client` en `schema.prisma`. El enum `DocumentType` ya existía para `Traveler`. Se generó la migración `20261104061905_agrega_document_type_al_cliente` (SQL: `ALTER TABLE "Client" ADD COLUMN "documentType" "DocumentType"`). **Backend:**
- `update-client.dto.ts`: agrega `documentType?: DocumentType`.
- `clients.service.ts` → `updateProfile()`: persiste `documentType`.
- `bookings.service.ts` → `_rellenarDocumentoSiVacio()`: método privado que, después de crear una reserva, actualiza el perfil del cliente con los datos del titular si esos campos están vacíos (auto-relleno en la primera compra).
- `seed-data/users.ts`: agrega `documentType: 'DNI'` a los tres clientes de demostración.
- `seed.ts` → `seedDemoClients()`: incluye `documentType` en el perfil del upsert.

**Frontend:**
- `profile.component.ts`: nuevo bloque "Documento de viaje" con tipo, número y fecha de nacimiento; validaciones idénticas al paso de pasajeros; botón "Guardar documento" independiente del formulario de datos personales.

Archivos:
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20261104061905_agrega_document_type_al_cliente/migration.sql`
- `backend/prisma/seed-data/users.ts`
- `backend/prisma/seed.ts`
- `backend/src/clients/dto/update-client.dto.ts`
- `backend/src/clients/clients.service.ts`
- `backend/src/bookings/bookings.service.ts`
- `frontend/src/app/features/profile/profile.component.ts`

---

### Restringe al administrador al panel de gestión (TS-027)

Commit: `fix: restringe al administrador al panel de gestión (TS-027)`

**Frontend:**
- `auth.guard.ts`: nuevo guard `clientOnlyGuard` que redirige a `/admin/dashboard` si el usuario es ADMIN; `adminGuard` actualizado para redirigir a `/admin/change-password` en lugar de `/profile/change-password` cuando hay contraseña temporal.
- `app.routes.ts`: `clientOnlyGuard` aplicado a home, my-trips, loyalty, profile y profile/change-password. Nueva ruta `/admin/change-password` que carga `ChangePasswordComponent`.
- `navbar.component.ts`: nueva constante `ADMIN_LINKS` con solo "Panel de administración"; `links` computed diferencia entre visitante, cliente y administrador.
- `admin-shell.component.ts`: agrega "Cambiar contraseña" y "Cerrar sesión" al pie de la barra lateral.

**Backend:**
- `clients.controller.ts`: `GET /clients/me` y `PATCH /clients/me` reciben `@UseGuards(RolesGuard)` + `@Roles(UserRole.CLIENT)` → 403 para administradores.
- `bookings.controller.ts`: `POST /bookings/quote` verifica `req.user.role === ADMIN` y lanza `ForbiddenException`; `POST /bookings` y `POST /bookings/:id/pay` reciben `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.CLIENT)`.
- `app.e2e-spec.ts`: 5 nuevas pruebas que verifican 403 para admin en cada una de esas rutas.

Archivos:
- `frontend/src/app/core/guards/auth.guard.ts`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/core/layout/navbar/navbar.component.ts`
- `frontend/src/app/features/admin/admin-shell.component.ts`
- `backend/src/clients/clients.controller.ts`
- `backend/src/bookings/bookings.controller.ts`
- `backend/test/app.e2e-spec.ts`
