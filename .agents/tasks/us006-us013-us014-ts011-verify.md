# Verificación: US-006, US-013, US-014, TS-011

Rama activa: `feat/ts016-us001-us002-roles-auth` (basada en develop).
Investigación de solo lectura sobre el armador de paquetes y la creación de reservas. No se modificó nada.

---

## Resumen ejecutivo

| Historia | Estado registrado (sprint-1.md) | Estado real en el código | Brecha principal |
|---|---|---|---|
| **US-006** | PARCIAL | PARCIAL | Sin vencimiento de 7 días en localStorage; el resumen solo ofrece iniciar sesión (no "crear cuenta"), y el mensaje no es el exigido; abrir desde un destino aterriza en estado vacío. |
| **US-013** | PARCIAL | PARCIAL | No valida que las fechas del hotel estén dentro del viaje; noches y total los calcula el frontend, no el servidor; el botón dice "Omitir" y no "Ya tengo alojamiento". |
| **US-014** | PARCIAL | PARCIAL | Las actividades no permiten elegir cantidad de personas (siempre cobran a todos); los extras tienen precio escrito en la pantalla (80/45), solo se ofrece `TRASLADO_COMPLETO` (falta ida/vuelta) y el seguro se cobra una sola vez (debería ser por pasajero). |
| **TS-011** | ROTO | ROTO (confirmado) | El backend **acepta** los precios que manda el navegador; no valida existencia/activo/destino del vuelo, hotel y actividades; no valida coherencia de fechas ni disponibilidad del vuelo; **no existe** endpoint de cotización; la cotización pública no existe; los extras no se leen del catálogo. |

La precisión de dinero (criterio TS-011 #6) sí está cubierta: `loyalty.rules.ts` trabaja en céntimos enteros (`toCents`/`fromCents`) y el esquema usa `Decimal(10,2)`. El problema es que esos céntimos se calculan a partir del precio del cliente, no del catálogo.

La raíz común es que **no existe el endpoint de cotización** queTS-011 exige: sin él, el resumen (US-015/US-006) no puede mostrar "exactamente eso sin recalcular", US-013 no puede mostrar noches y total "calculados por el servidor", US-014 no puede tomar precios de extras del servidor, y TS-011 no puede validar nada porque el `create` confía en el frontend. La historia que habilita a las demás es **TS-011**.

---

## Respuestas a las preguntas

### 1. ¿El armador exige sesión desde el primer paso? ¿Hay un guard en `/packages/new`?

**No exige sesión.** La ruta `/packages/new` **no** tiene `canActivate`:

```ts
// frontend/src/app/app.routes.ts
{
  // Abierto a visitantes (modo explorador, M2): la cuenta se pide recién al confirmar.
  path: 'packages/new',
  loadComponent: () => import('./features/packages/package-builder.component').then(m => m.PackageBuilderComponent),
},
```

`PackageBuilderComponent.ngOnInit` (`package-builder.component.ts:62-75`) solo llama a `auth.isAuthenticated()` para cargar el estado de fidelización, jamás para bloquear. La sesión se pide únicamente en el `POST /bookings` (controlador con `@UseGuards(JwtAuthGuard)` a nivel de clase) y en el flujo de login del resumen. **Criterio US-006 #2 (inicio sin cuenta): cubierto** en la ruta y en el armador.

### 2. ¿Existe persistencia en localStorage del estado del armador?

**Sí, existe persistencia, pero sin vencimiento de 7 días.** `package-builder.state.ts`:

- Llave: `const DRAFT_KEY = 'aerocrm.paquete';`
- En el constructor restaura (`readDraft()`) y un `effect` persiste (`writeDraft`/`removeDraft`) cada vez que cambia el `flightId`.
- `restore()` solo acepta `version === 2`.

**Brecha US-006 #3 / TS-010 (caducidad):** `writeDraft` hace `localStorage.setItem(DRAFT_KEY, text)` sin marca de tiempo ni TTL. No hay nada que descarte el paquete a los 7 días. El sprint-1.md lo registra textualmente: *"Falta el vencimiento de los siete días."*

**Brecha adicional (TS-010 "nunca precios"):** el borrador guarda el vuelo y el hotel **completos, con precios** (`toDraft()` incluye `flight`, `hotel`, `activities` con `price`, `extras` con `price`). La ficha TS-010 exige guardar solo selecciones, fechas y cantidades, nunca precios. Hoy los guarda.

**Lo que sí funciona:** al iniciar sesión el paquete pasa a ser del usuario (`syncOwner`, `state.ts:96-113`); al cerrar sesión o entrar otro usuario se descarta (`syncOwner` → `reset()`).

### 3. ¿Step-hotel tiene filtros? ¿Propone fechas del viaje? ¿Valida rango? ¿Calcula noches y total?

- **Filtros: SÍ.** Reusa `HotelListComponent` (`shared/ui/hotel-list.component.ts`), el mismo de la búsqueda de hoteles (US-007): categoría (estrellas multi-selección), zona, rango de precio, ordenar por precio/categoría. `step-hotel.component.ts` lo alimenta con `state.context()?.hotels`. **Criterio US-013 #1: cubierto.**
- **Propone fechas: PARCIAL.** `prefillHotelDates()` (`state.ts:123-131`) pone la entrada = llegada del vuelo y la salida = **+7 noches** (fija), no la fecha de regreso del vuelo. La ficha pide "la salida con el vuelo de regreso". Hoy no hay vuelo de regreso modelado, así que se usa +7 noches.
- **Valida rango: NO.** `step-hotel.component.ts` enlaza `hotelCheckIn`/`hotelCheckOut` a dos `<input type="date">` sin ninguna validación de que caigan dentro del viaje. No existe el mensaje *"Las fechas del hotel deben estar dentro de tu viaje"*. **Criterio US-013 #2: NO cubierto.**
- **Noches y total: calculados en el frontend.** `state.hotelNights()` y `state.hotelTotal()` son `computed` del frontend; `HotelListComponent` muestra `hotel.pricePerNight * nights()` por tarjeta. La ficha exige que los calcule el servidor. **Criterio US-013 #3: NO cubierto.**
- **Paso opcional: PARCIAL.** Hay botón "Omitir" (`step-hotel.component.ts`) que borra el hotel y avanza. La ficha pide literalmente *"Ya tengo alojamiento"*; el texto actual es "Omitir". **Criterio US-013 #4: parcial (funciona, texto distinto).**

### 4. ¿Step-activities permite elegir cantidad de personas por actividad?

**No.** `step-activities.component.ts` usa `ActivityListComponent` con `[selectedIds]` y `(activityToggle)`. `state.toggleActivity(act)` (`state.ts:134-138`) solo añade/quita la actividad entera; no guarda cantidad. El resumen siempre muestra `× state.passengers()` y el `create` envía `quantity: s.passengers()`. La ficha lo dice: *"Hoy se cobra siempre a todos los pasajeros, sin poder elegir."* **Criterio US-014 #1: NO cubierto** (falta selector 1..pasajeros con valor inicial = todos).

### 5. ¿Step-extras toma precios del servidor o del frontend?

**Del frontend (escritos en la pantalla).** `step-extras.component.ts`:

```ts
// Pendiente (deuda heredada, ver docs/HEREDADO.md): precios escritos en la pantalla.
readonly extraOptions = [
  { type: 'TRASLADO_COMPLETO', label: '🚌 Traslados ida y vuelta', price: 80 },
  { type: 'SEGURO_VIAJE', label: '🛡️ Seguro de viaje', price: 45 },
];
```

Brechas frente a US-014 #2:
- Solo se ofrece `TRASLADO_COMPLETO`; faltan `TRASLADO_IDA` y `TRASLADO_VUELTA` (ambos existen en el catálogo, `ExtraType` del esquema).
- El precio va desde la pantalla, no del servidor. (El catálogo `ExtraOption` ya tiene `price` y `pricing` `POR_RESERVA`/`POR_PASAJERO`, pero ningún servicio lo expone ni lo usa.)
- El seguro se cobra una sola vez: `state.extrasTotal()` es `extras.reduce((s,e) => s + e.price, 0)` y el `create` envía `price: e.price` (sin multiplicar por pasajeros). Debería ser `POR_PASAJERO` → `× passengers`.

**Criterio US-014 #2: NO cubierto.** (Pasos opcionales y acceso público: cubiertos.)

### 6. ¿CreateBookingDto acepta precios del cliente? ¿El service valida existencia y coherencia?

**Acepta precios del cliente (es lo opuesto a lo exigido).** `dto/create-booking.dto.ts`:

```ts
export class BookingFlightDto  { @IsInt() flightId; @IsNumber() priceSnapshot; }
export class BookingHotelDto   { @IsInt() hotelId; @IsString() checkIn; @IsString() checkOut; @IsInt() nights; @IsNumber() priceSnapshot; }
export class BookingActivityDto{ @IsInt() activityId; @IsInt() @Min(1) quantity; @IsNumber() priceSnapshot; }
export class BookingExtraDto    { @IsEnum(ExtraType) type; @IsNumber() price; ... }
```

Todos llevan `priceSnapshot`/`price` **obligatorios**. TS-011 #2 exige que si la petición trae precios se **rechace**; hoy los **requiere**.

**El service NO valida nada del catálogo.** `bookings.service.ts:create` (`:55-66`):

```ts
// Pendiente (deuda, AGENTS.md B6): los precios aún llegan del cliente como priceSnapshot;
const flightsCents    = dto.flights.reduce((s, f) => s + toCents(f.priceSnapshot) * dto.passengers, 0);
const hotelsCents     = (dto.hotels ?? []).reduce((s, h) => s + toCents(h.priceSnapshot), 0);
const activitiesCents = (dto.activities ?? []).reduce((s, a) => s + toCents(a.priceSnapshot) * a.quantity, 0);
const extrasCents    = (dto.extras ?? []).reduce((s, e) => s + toCents(e.price), 0);
```

El comentario del propio código reconoce la deuda (B6). Consecuencias:
- No busca el vuelo/hotel/actividad en la base; no comprueba `isActive`, `destinationId` ni `seatsAvailable >= passengers`.
- No valida coherencia de fechas del hotel.
- No existe el mensaje *"El vuelo seleccionado ya no está disponible"* ni *"Las fechas del hotel no son válidas"*.
- El comprador puede enviar `priceSnapshot: 1` para un vuelo de S/ 3200: exactamente el bug que TS-011 #1 describe. **Confirmado.**

### 7. ¿Existe endpoint de cotización (preview/quote)? ¿Qué devuelve?

**No existe un endpoint de cotización de paquete.** El único `preview` del backend es `POST /loyalty/redemption-preview` (`loyalty.controller.ts:27`), que **no** es una cotización de paquete: recibe `packageTotal` (string) y `pointsToRedeem` y devuelve solo el descuento de canje. Además está **protegido por `JwtAuthGuard`** (no es público), y `packageTotal` lo recalcula y lo manda el frontend (`step-summary.component.ts:onUsePointsChange`), de modo que el canje se calcula sobre un total que el cliente controla.

No hay ningún endpoint que, a partir de identificadores, fechas y cantidades, devuelva el desglose completo (vuelo por pasajero, hotel por noche, cada actividad por cantidad, cada extra, subtotal, descuento por canje y total). **Criterios TS-011 #4 (cotización con desglose) y #7 (cotización pública): NO cubiertos.**

### 8. ¿Los montos se calculan con Decimal o number?

**Mezcla correcta en el mecanismo, incorrecta en el origen.**
- En DB todo es `Decimal @db.Decimal(10,2)` (`Booking.totalPrice`, `Booking*.priceSnapshot`, `Flight.pricePerPerson`, `Hotel.pricePerNight`, `Activity.price`, `ExtraOption.price`).
- El motor de fidelización opera en céntimos enteros: `toCents`/`fromCents` (`loyalty.rules.ts:42-63`) evita aritmética de coma flotante y `computeRedemption` solo usa enteros.
- `pointsForPurchase` redondea hacia abajo con `Math.floor(totalPaidCents / (SOLES_PER_POINT*100))`.

Es decir, el **tipo exacto para dinero existe** (céntimos + Decimal) y el redondeo a 2 decimales es solo al final (`fromCents`). **Criterio TS-011 #6: cubierto en cuanto a precisión.** El problema no es el tipo de dato: es que el monto de partida es el `priceSnapshot` del cliente en vez del catálogo.

### 9. ¿Qué falta en cada historia?

**US-006 — faltan:**
1. Vencimiento de 7 días en el borrador de localStorage (guardar timestamp; descartar si pasó). Hoy persiste indefinidamente.
2. En el resumen, al confirmar sin sesión: mostrar *"Crea tu cuenta o inicia sesión para confirmar tu viaje"* con **ambos** caminos visibles (login y registro). Hoy solo hay un botón "Inicia sesión para confirmar" y el mensaje no coincide.
3. Abrir el armador **desde un destino** y que cargue el contexto del destino. Hoy `destination-detail.component.ts:81` navega a `/packages/new?destinationId=...`, pero `ngOnInit` solo actúa si llega `flightId`; sin vuelo, aterriza en el estado vacío "Todavía no elegiste un vuelo".

**US-013 — faltan:**
1. Validar que entrada/salida del hotel estén dentro del rango del viaje; si no, mostrar *"Las fechas del hotel deben estar dentro de tu viaje"*.
2. Que noches y total provengan del servidor (cotización), no de `state.hotelNights()`/`hotelTotal()` ni de `hotel.pricePerNight * nights()` en la lista.
3. Renombrar "Omitir" a "Ya tengo alojamiento".
4. (Deseable) Proponer la salida con el vuelo de regreso si existiera; hoy es +7 noches fijo.

**US-014 — faltan:**
1. Selector de cantidad de personas por actividad (1..pasajeros, inicial = todos) y guardar esa cantidad por actividad (no multiplicar todo por `passengers`).
2. Extras: ofrecer `TRASLADO_IDA`, `TRASLADO_VUELTA`, `TRASLADO_COMPLETO` (por paquete) y `SEGURO_VIAJE` (por pasajero), con **precio y modalidad (`pricing`) traídas del catálogo `ExtraOption`** vía el servidor (hoy 80/45 escritos en la pantalla).
3. El seguro debe cobrarse `× passengers` (es `POR_PASAJERO`).

**TS-011 — faltan (la historia habilitante):**
1. Rechazar precios en `CreateBookingDto`: el navegador debe enviar solo `flightId`, `hotelId`, `checkIn/checkOut`, `activityId`+`quantity`, `type` de extra. Eliminar `priceSnapshot`/`price` del DTO y del `create`.
2. En el service: cargar vuelo/hotel/actividades/extra del catálogo, validar `isActive` y que `destinationId` coincida con el destino del vuelo; validar `seatsAvailable >= passengers` (sino *"El vuelo seleccionado ya no está disponible"*); validar coherencia de fechas del hotel (sino *"Las fechas del hotel no son válidas"*).
3. Crear el **endpoint de cotización** (público, sin `JwtAuthGuard`) que devuelva el desglose completo: vuelo por pasajero, hotel por noche, cada actividad por su cantidad, cada extra (aplicando `pricing`), subtotal, descuento por canje (usando el motor `computeRedemption`) y total. Todo en céntimos/Decimal, redondeo a 2 al final.
4. El resumen del armador debe mostrar **exactamente** esa cotización sin recalcular (reemplazar los `computed` de `state` por la respuesta del endpoint). El canje debe pedirse sobre el total del servidor, no sobre un `packageTotal` que manda el frontend.
5. Exponer los extras del catálogo (`ExtraOption`) para que US-014 los consuma; hoy ningún servicio los lee (`grep ExtraOption` en `backend/src/` no da resultados; solo `seed.ts` los usa).
6. Los extras en el `create`: precio y modalidad desde el catálogo, seguro `× passengers`.

> Nota de alcance: TS-011 toca **áreas reservadas** según AGENTS.md §7 (cálculo de precios del paquete y transacción de compra). Un agente debe detenerse y derivar a G4, o trabajar con autorización explícita, antes de modificar `bookings.service.ts` (cálculo/validación) y la creación de la cotización.

---

## Evidencia por archivo

### Frontend — armador
- `frontend/src/app/app.routes.ts`: `/packages/new` sin guard. `/search` con `authGuard`; `/explore` público. Confirmado item 1.
- `frontend/src/app/core/guards/auth.guard.ts`: `authGuard`/`adminGuard` redirigen a `/login?returnUrl=...`. No aplican a `/packages/new`.
- `frontend/src/app/features/packages/package-builder.state.ts`:
  - `DRAFT_KEY = 'aerocrm.paquete'`; persistencia con `writeDraft`/`readDraft`/`removeDraft` (sin TTL).
  - `toDraft()` guarda `flight`, `hotel`, `activities`, `extras` con precios → contradice TS-010.
  - `flightTotal/hotelNights/hotelTotal/activitiesTotal/extrasTotal/totalPrice` son `computed` del frontend → recálculo prohibido por TS-011 #4.
  - `activitiesTotal = activities.reduce(...Number(a.price)...) * this.passengers` → cobra a todos los pasajeros (US-014 #1).
  - `extrasTotal = extras.reduce((s,e) => s + e.price, 0)` → seguro sin `× passengers`.
  - `syncOwner` (`:96-113`) asocia el paquete al usuario al iniciar sesión; descarta al cerrar o cambiar de usuario.
- `frontend/src/app/features/packages/package-builder.component.ts`: `ngOnInit` solo inicia si llega `flightId`; si solo llega `destinationId` (desde un destino), no carga nada.
- `frontend/src/app/features/packages/steps/step-hotel.component.ts`: reusa `HotelListComponent`; dos `<input type="date">` sin validación de rango; botón "Omitir".
- `frontend/src/app/features/packages/steps/step-activities.component.ts`: `ActivityListComponent` con toggle simple, sin cantidad.
- `frontend/src/app/features/packages/steps/step-extras.component.ts`: `extraOptions` con `price: 80`/`price: 45` escritos; solo `TRASLADO_COMPLETO` + `SEGURO_VIAJE`.
- `frontend/src/app/features/packages/steps/step-summary.component.ts`:
  - Desglose 100% frontend (`state.flightTotal()`, `hotelTotal()`, `act.price * passengers`, `extra.price`).
  - Si no logueado: mensaje "Inicia sesión o crea tu cuenta..." pero solo botón "Inicia sesión para confirmar" → `goToLogin()` a `/login?returnUrl=/packages/new`. Sin botón de registro; sin mensaje exacto *"Crea tu cuenta o inicia sesión para confirmar tu viaje"*.
  - `confirmBooking()` envía `priceSnapshot` (vuelo/hotel/actividades) y `price` (extras) → confirma item 6.
  - `onUsePointsChange()` manda `packageTotal: state.totalPrice().toFixed(2)` a `loyalty/redemption-preview`.
- `frontend/src/app/shared/ui/hotel-list.component.ts`: filtros de estrellas/zona/precio/orden (US-007); muestra `hotel.pricePerNight * nights()` por tarjeta (cálculo frontend).
- `frontend/src/app/shared/ui/activity-list.component.ts`: filtros de tipo/precio; solo `activityToggle`, sin selector de cantidad.
- `frontend/src/app/features/destinations/destination-detail.component.ts:81`: navega a `/packages/new?destinationId=...` (abre desde destino, pero el builder no lo consume).
- `frontend/src/app/features/search/search.component.ts:selectFlight`: navega con `flightId,destinationId,departureDate,passengers,flightPrice` (funciona).

### Backend
- `backend/src/bookings/bookings.controller.ts`: `@UseGuards(JwtAuthGuard)` a nivel de clase → compra exige sesión (correcto). Sin endpoint de cotización.
- `backend/src/bookings/bookings.service.ts:create`: suma `toCents(f.priceSnapshot)*passengers`, etc.; **no** consulta catálogo, no valida existencia/activo/destino/fechas/disponibilidad. Comentario reconoce la deuda (B6).
- `backend/src/bookings/dto/create-booking.dto.ts`: `priceSnapshot`/`price` obligatorios → acepta precios del cliente.
- `backend/src/loyalty/loyalty.controller.ts`: solo `status`, `history`, `redemption-preview`; todos con `JwtAuthGuard`. No hay cotización pública.
- `backend/src/loyalty/loyalty.service.ts:previewRedemption`: recibe `packageTotal` (string) del cliente; calcula descuento con `computeRedemption`. No es cotización de paquete.
- `backend/src/loyalty/loyalty.rules.ts`: `toCents`/`fromCents`/`computeRedemption` en céntimos enteros; precisión correcta (TS-011 #6).
- `backend/src/destinations/destinations.service.ts:getContext`: devuelve `hotels` y `activities` del destino (los que usa el armador); sin cálculo de precios de paquete. `searchFlights` calcula `totalPrice = Number(pricePerPerson)*passengers` en el servidor (único total ya server-side, pero es solo vuelo).
- `backend/prisma/schema.prisma`: `ExtraType { TRASLADO_IDA, TRASLADO_VUELTA, TRASLADO_COMPLETO, SEGURO_VIAJE }`; `ExtraPricing { POR_RESERVA, POR_PASAJERO }`; `ExtraOption` con `type`, `price Decimal`, `pricing` (catálogo de extras). `Booking*` con `Decimal(10,2)`.
- `backend/prisma/seed-data/reference.ts`: catálogo de extras cargado con precios y modalidad correctos (`TRASLADO_*` POR_RESERVA 45/45/80; `SEGURO_VIAJE` POR_PASAJERO 45). `seed.ts:275` sí aplica `pricing === 'POR_PASAJERO' ? pax : 1` al sembrar compras de ejemplo, pero el `bookings.service` real no lo hace.

### Docs
- `docs/tareas/sprint-1.md`: estado registrado de cada historia (TS-011 "ROTO"; US-006/US-013/US-014 "PARCIAL") y frases textuales de lo que falta, coincidentes con el código. TS-010 registra "Falta el vencimiento de los siete días" y que el paquete ya pasa a ser del cliente al iniciar sesión.

---

## Conclusiones y recomendaciones

1. **El habilitador es TS-011.** Sin el endpoint de cotización y sin el cálculo desde el catálogo, US-013, US-014 y el resumen (US-006/US-015) no pueden cumplir "calculado por el servidor / sin recalcular". Recomiendo implementar TS-011 primero (o en paralelo muy coordinado).
2. **Modelo de cotización sugerido:** un endpoint público (p. ej. `POST /packages/quote`) que reciba solo identificadores, fechas y cantidades, cargue el catálogo, valide y devuelva el desglose. El `create` debe reutilizar la misma función de cálculo (DRY) y solo diferir en exigir sesión y persistir.
3. **DTO del `create`:** quitar `priceSnapshot`/`price`; dejar `flightId`, `hotelId`+`checkIn`/`checkOut`, `activityId`+`quantity`, `type` de extra. Si llega cualquier precio, responder 400.
4. **Validaciones del service:** existencia + `isActive` + `destinationId` coincide con el vuelo; `seatsAvailable >= passengers` → *"El vuelo seleccionado ya no está disponible"*; fechas del hotel coherentes y dentro del viaje → *"Las fechas del hotel no son válidas"* (frontend puede pre-validar con *"Las fechas del hotel deben estar dentro de tu viaje"*).
5. **Extras:** exponer `ExtraOption` (con `pricing`) vía un endpoint público y consumirlo en `step-extras`; cobrar `SEGURO_VIAJE` por pasajero y traslados por paquete, todo desde el catálogo. Agregar ida/vuelta además del completo.
6. **Actividades:** añadir `quantity` por actividad en el estado y en el DTO de cotización; selector 1..pasajeros con valor inicial = pasajeros.
7. **US-006 persistencia:** añadir marca de tiempo al borrador y descartar a los 7 días; dejar de guardar precios (guardar solo ids/fechas/cantidades) en línea con TS-010. En el resumen sin sesión: mostrar el mensaje exacto y los dos caminos (login y registro) con `returnUrl=/packages/new`; que ambos vuelvan al resumen intacto. Cargar el contexto cuando se entra solo con `destinationId`.
8. **Restricción de áreas reservadas:** TS-011 y el `create` tocan "cálculo de precios del paquete" y "transacción de compra" (AGENTS.md §7). Se debe derivar a G4 o contar con autorización explícita antes de modificar `bookings.service.ts` y crear la cotización.

No se implementó nada; este es solo el diagnóstico.
