# Verificación de estado — US-003, US-004, US-012

Rama: `feat/ts016-us001-us002-roles-auth` (basada en develop). Investigación de solo lectura.
Reporte generado el 2026-10-21.

---

## Resumen ejecutivo

Las tres historias están **PARCIAL** o sin empezar. Ninguna cumple sus criterios de aceptación hoy. Lo más relevante:

- **US-003 (Cambiar mi contraseña):** existe un componente `change-password`, pero es la pantalla heredada de "crear contraseña temporal (DNI)" del CRM anterior, **no** la de "cambiar mi contraseña desde mi perfil". No está enrutada (huérfana), usa estilos en línea (infracción F4), no se enlaza desde el perfil y navega a `/dashboard` (ruta inexistente). El **backend no tiene endpoint** `PATCH /auth/change-password` (área reservada §7 — la escribe integración). La validación de fortaleza del componente es más débil que la del registro.
- **US-004 (Buscar vuelos y filtrarlos):** la búsqueda básica funciona y abre el armador sin pedir cuenta. **No hay ningún filtro** (precio, duración, escalas, aerolínea) ni ordenamiento, ni en frontend ni en backend. El mensaje de fecha pasada y el de "sin resultados" no coinciden con los criterios. **El supuesto bug de duración ya está arreglado** desde el sprint 0 (commit `431d8cf`): el pipe `duracion` existe y se usa correctamente. El criterio del brief que afirma que "hoy se rompe" está desactualizado.
- **US-012 (Elegir vuelo y ver qué pasa en el destino, pasos 1 y 2):** el paso de contexto muestra los 3 bloques (festividades, feriados, clima) pero le falta el mensaje de vacío y el marcado "referencial". El paso de vuelo **solo muestra el vuelo elegido**: no tiene botón para cambiarlo, no pide fecha de regreso, no valida "La fecha de regreso debe ser posterior a la de ida".

**Línea base verde verificada:** `backend` compila y pasa 35/35 pruebas unitarias; `frontend` compila. Ambos `node_modules` presentes.

---

## US-003 — Cambiar mi contraseña

### ¿Existe el componente change-password? ¿Está en routes? ¿Usa piezas visuales del proyecto?

**Existe, pero no es la pantalla que pide la historia, no está enrutada y usa estilo propio.**

- El componente está en `frontend/src/app/features/auth/change-password/change-password.component.ts` (commit inicial `8097b30`, código heredado puro).
- **No está en `app.routes.ts`** (leído completo): no existe ruta `change-password` ni similar. Es un componente **huérfano** (infracción F2). Tampoco se importa en ningún otro archivo: la única referencia fuera del propio archivo es `AuthService.changePassword()` en `core/services/auth.service.ts:62`.
- Es la pantalla heredada de **primer inicio de sesión con contraseña temporal (el DNI)**: el encabezado dice "Crea tu contraseña", la etiqueta de contraseña actual dice "Contraseña actual (tu DNI)" y el botón "Establecer contraseña y continuar". **No es** "cambiar mi contraseña desde mi perfil".
- **Estilo propio, no las piezas del proyecto** (infracción F4): ~25 estilos en línea con colores escritos a mano (`style="background:#050d1a"`, `#c9a84c`, `#5580d0`, `rgba(201,168,76,...)`). Sí reutiliza algunas clases (`aero-card`, `aero-input`, `aero-label`, `btn-primary`), pero la paleta dorada/azul oscuro no corresponde a la del proyecto. `docs/HEREDADO.md:31` lo registra como "F4 (25 estilos en línea)" y decisión "conservar como referencia y rehacer al enrutarla en el sprint 1".
- No usa `ToastService` (infracción F5): muestra errores en un `errorMsg()` signal inline. No confirma con "Contraseña actualizada" — al guardar navega a `/dashboard`, ruta que **no existe** (cae en el wildcard `**` → `/explore`).
- **No se enlaza desde el perfil**: `frontend/src/app/features/profile/profile.component.ts` muestra datos personales, preferencias, viajeros frecuentes y "Cerrar sesión"; **no hay** enlace/acción de cambio de contraseña.

### ¿Existe el endpoint PATCH /auth/change-password? ¿Qué validaciones hace?

**No existe el endpoint ni el método de servicio.** El frontend ya está cableado a él, así que hoy la llamada **fallaría con 404**.

- `backend/src/auth/auth.controller.ts` solo expone `POST /auth/login`, `POST /auth/register` y `GET /auth/me`. **No** hay `PATCH /auth/change-password` (ni ningún verbo).
- `backend/src/auth/auth.service.ts` **no** tiene método `changePassword`. Solo `login`, `register`, `getMe`.
- El DTO sí existe: `backend/src/auth/dto/change-password.dto.ts` con `currentPassword: string` y `newPassword: string` con `@MinLength(8)`. Pero **ningún controller lo usa** (`HEREDADO.md:56`: "DTOs sin endpoint"). El `@MinLength(8)` es lo único que valida el DTO; no exige mayúscula ni número (esas reglas en `register` viven en el service, no en el DTO).
- `backend/src/common/validation.ts` **ya tiene** las etiquetas en español listas: `currentPassword: 'contraseña actual'`, `newPassword: 'nueva contraseña'` (`FIELD_LABELS`).
- El frontend `AuthService.changePassword()` (`auth.service.ts:62`) hace `PATCH {apiUrl}/auth/change-password` con `{ currentPassword, newPassword }`. Es decir, la pantalla dispararía un 404 hoy.

**Área reservada (§7):** `backend/src/auth/` es reservada; solo la modifican los responsables de integración (G4). La ficha de `sprint-1.md` (US-003) lo confirma: "como toca la autenticación, lo escriben los responsables de integración". `HEREDADO.md:96` agrega: "el sprint 1 necesita la historia completa (backend y frontend), no solo enrutar la pantalla".

### Validaciones del componente frente a los criterios

El componente (líneas 130-150) calcula `strength` = cantidad de {longitud≥8, mayúscula, número, especial} y deshabilita el botón cuando `strength < 2`:
- Esto **permite enviar** una contraseña con solo 2 condiciones, p. ej. "longitud≥8 + mayúscula" **sin número**. El registro exige las tres (≥8 + mayúscula + número) con el mensaje "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número" (`auth.service.ts:39`). **La fortaleza del cambio es más débil que la del registro**, contradiciendo el criterio 2.
- No muestra el mensaje de fortaleza del registro en línea (solo una lista visual de requisitos).
- No valida "La nueva contraseña debe ser distinta de la actual" en el cliente (el DTO tampoco).
- "La contraseña actual no es correcta" debería venir del backend al comparar con bcrypt; como no hay endpoint, hoy no ocurre.

### Conclusión US-003

Falta prácticamente todo:
1. **Backend:** crear `PATCH /auth/change-password` (JwtAuthGuard, sobre la propia cuenta) que valide actual con bcrypt, rechace nueva igual a actual, exija la misma fortaleza que el registro con el mismo mensaje, actualice el hash y devuelva confirmación. Es área reservada → integración (G4). DTO ya existe (hay que completar validación de fortaleza/igualdad).
2. **Frontend:** rehacer la pantalla como "Cambiar mi contraseña" (no la de DNI), con las piezas visuales del proyecto y `ToastService`, **enrutarla** en `app.routes.ts` (con `authGuard`) y **enlazarla desde el perfil**. Confirmar con "Contraseña actualizada". Ajustar la validación de fortaleza para exigir las 3 condiciones (≥8 + mayúscula + número) con el mismo mensaje que el registro. Validar "La nueva contraseña debe ser distinta de la actual".
3. No se debe reutilizar el componente heredado tal cual: `HEREDADO.md` manda "rehacer al enrutarla". `AuthService.changePassword` ya usa `HttpClient` directo (no `ApiService`) — es el patrón heredado del auth service; una pantalla nueva debería seguir F3 (`ApiService`), salvo que integración decida lo contrario por tocar el área reservada.

---

## US-004 — Buscar vuelos y filtrarlos

### ¿La búsqueda de vuelos tiene filtros? ¿Cuáles faltan?

**No tiene ningún filtro.** Faltan todos los del criterio 2.

- Frontend `frontend/src/app/features/search/search.component.ts`: el formulario solo tiene origen (texto), destino (select), fecha de salida (`<input type="date" [min]="today">`) y pasajeros (número). **No hay** UI de rango de precio por persona, duración máxima, escalas (directo/1/2+), aerolínea (múltiple) ni ordenamiento por precio/duración.
- Backend `GET /destinations/:id/flights` (`destinations.controller.ts:38`, `destinations.service.ts:122` `searchFlights`) acepta solo `origin`, `departureDate`, `passengers`, `flexDays`. **No** acepta parámetros de filtro ni de orden. Devuelve vuelos ordenados por cercanía a la fecha y luego por precio.
- Por tanto los filtros faltan **en ambas capas**; implementarlos requiere tocar el endpoint de `destinations` (no es área reservada).

### Búsqueda: fecha pasada y sin resultados

- **Fecha pasada (criterio 1):** el `<input type="date" [min]="today">` impide elegir fechas pasadas en el selector, pero **no muestra el mensaje "Elige una fecha a partir de hoy"**. El método `search()` (líneas ~105-112) solo valida que haya destino y fecha; no comprueba que la fecha no sea pasada con un mensaje.
- **Sin resultados (criterio 4):** el mensaje actual (líneas ~88-93) es "No encontramos vuelos entre 3 días antes y 3 días después de esa fecha" + "Prueba con otra fecha u otro destino.". **No coincide** con el criterio: "No encontramos vuelos para esa fecha. Prueba con otra fecha o quita filtros" (la parte "quita filtros" es moot hoy porque no hay filtros). El texto debe ajustarse al implementar filtros.

### Resultados: ¿el formato de duración está roto? ¿Qué pipe usa?

**No está roto. El pipe `duracion` existe y se usa correctamente.** El criterio del brief que dice "hoy se rompe porque usa un formato de duración que no existe" está **desactualizado**.

- Pipe: `frontend/src/app/shared/pipes/duration.pipe.ts` → `@Pipe({ name: 'duracion' })`, transforma minutos a "X h Y min" (330 → "5 h 30 min").
- Uso en `search.component.ts:79`: `{{ flight.durationMinutes | duracion }}`. El nombre del pipe coincide.
- El modelo `Flight` en `backend/prisma/schema.prisma` tiene `durationMinutes Int`, y `searchFlights` devuelve el vuelo con spread `...f` (`destinations.service.ts:150`), así que el campo llega al frontend.
- **Historial:** el pipe se introdujo en el commit `431d8cf` ("fix: busca vuelos ±3 días de la fecha elegida y muestra la duración (QA-S0)"), sprint 0. La ficha `sprint-1.md` (US-004) lo confirma: "La duración legible ya funciona desde el sprint 0".
- Verificado además: no hay ninguna otra referencia a un pipe de duración inexistente en el frontend (búsqueda `duracion|duration|DurationPipe` solo aparece en `search.component.ts`, `duration.pipe.ts` y `seed-data/flights.ts`).

### Resultados: demás campos

Cada vuelo muestra aerolínea + número, origen→destino, escalas (`stops === 0 ? 'Directo' : stops + ' escala(s)'`), fecha/hora, duración, **precio total para los pasajeros** (`flight.totalPrice`, calculado en backend como `pricePerPerson * passengers`) y clase (`flight.classType | label`). Cumple el contenido del criterio 3 (salvo que los filtros no existen).

### Al elegir un vuelo: abre armador sin pedir cuenta

**Funciona.** `selectFlight()` (`search.component.ts:135`) navega a `/packages/new` con `queryParams` `{flightId, destinationId, departureDate, passengers, flightPrice}`. La ruta `/packages/new` en `app.routes.ts` **no** tiene `authGuard` (comentario: "Abierto a visitantes (modo explorador, M2)"), así que abre el armador sin pedir cuenta. Cumple el criterio 5.

Observación (no es de US-004, pero conviene registrar): pasa `flightPrice: flight.pricePerPerson` en los queryParams, y `PackageBuilderState` serializa el `flight` (con precios) en localStorage (`package-builder.state.ts`). Choca con TS-010/TS-011 ("nunca precios"). Es consistente con la suite más amplia de historias (TS-011), no con US-004 propiamente.

### Acceso: público

**Cumple.** `/explore` (mismo `SearchComponent`) es público; `/search` requiere sesión, pero la búsqueda pública se sirve desde `/explore`.

### Conclusión US-004

1. **Filtros y orden (criterio 2):** construir UI en `search.component.ts` y parámetros en el endpoint `GET /destinations/:id/flights` (`destinations.service.ts` `searchFlights`) para: rango de precio por persona, duración máxima, escalas (directo/1/2+), aerolínea (múltiple) y orden por precio o duración. Actualizar Swagger (B8).
2. **Mensaje de fecha pasada (criterio 1):** validar en `search()` y mostrar "Elige una fecha a partir de hoy" (vía ToastService, F5).
3. **Mensaje de sin resultados (criterio 4):** cambiar el texto a "No encontramos vuelos para esa fecha. Prueba con otra fecha o quita filtros".
4. **Duración (criterio 3):** no requiere cambios; ya funciona. El brief está desactualizado al respecto.
5. Cobertura de pruebas: hoy `destinations.service.spec.ts` solo prueba el rango ±flexDays de `searchFlights`. Al añadir filtros hay que ampliar el spec (verificación: `cd backend && npm test`).

---

## US-012 — Elegir vuelo y ver qué pasa en el destino (pasos 1 y 2)

### ¿Step-flight muestra el vuelo elegido y pide fecha de regreso?

**Muestra el vuelo elegido, pero no pide fecha de regreso ni permite cambiarlo.**

- `frontend/src/app/features/packages/steps/step-flight.component.ts` ("Paso 1 · Vuelo"): muestra `airline + flightNumber`, `origin.city → destination.city` y `flightTotal` (pricePerPerson × pasajeros). **No** hay botón "cambiar vuelo" que vuelva al buscador conservando el resto. **No** hay input de fecha de regreso. **No** hay validación "La fecha de regreso debe ser posterior a la de ida".
- La fecha de regreso hoy se calcula **implícitamente** en `package-builder.component.ts` `loadFlightAndContext()` (líneas ~110-118): `const ret = new Date(departureDate); ret.setDate(ret.getDate() + 7)` y se usa solo para pedir el contexto. **No existe** señal `returnDate` en `PackageBuilderState` (`package-builder.state.ts` no la declara), así que la estadía queda fija en +7 días sin UI para ajustarla.
- **Discrepancia brief vs. ficha:** el brief pide "Pide fecha de regreso que define la estadía". La ficha `sprint-1.md` (US-012) pide más: elegir el **vuelo de regreso** entre los que salen del destino al origen tras la llegada del de ida (misma búsqueda ±3 días, propuesto a +7 días), con aviso "No encontramos vuelos de regreso cerca de esa fecha. Prueba con otra fecha", y el paquete no avanza sin ida y regreso. **Ninguna de las dos versiones está implementada.** Recomendación: confirmar el alcance con el equipo (¿solo fecha de regreso, o selección de vuelo de regreso?) antes de implementar, porque cambia bastante el trabajo (TS-019 ya trae "datos de arranque ya trae los vuelos de regreso de cada ruta").

### ¿Step-context muestra festividades, feriados y clima?

**Sí muestra los 3 bloques, pero le falta el mensaje de vacío y el marcado "referencial".**

- `frontend/src/app/features/packages/steps/step-context.component.ts` ("Paso 2"): rendera festividades (`context()?.festivities`), feriados (`context()?.holidays`) y clima (`context()?.weather?.forecast?.[0]` con descripción, temp_min, temp_max). Cumple el criterio 2 (3 bloques).
- **Nunca vacío (criterio 3) — incompleto:** los bloques usan `@if (...length)` / `@if (weather)`, de modo que si no hay coincidencias **la sección queda en blanco**. No existe el mensaje "No hay feriados ni festividades en tus fechas".
- **Dato referencial (criterio 3) — incompleto:** el backend sí distingue la fuente. En `destinations.service.ts` `getContext`, `weather` trae `source: 'pronostico'` (OpenWeatherMap en vivo) o `source: 'promedio'` (respaldo del clima promedio del mes, `fallbackWeather`). El componente **no muestra** ese `source` ni la etiqueta "Dato referencial". (La ficha TS-013/TS-019 indica que el respaldo debe rotularse "Dato referencial"; hoy `fallbackWeather` lo rotula "(promedio del mes)"). Los `holidays` no llevan campo de fuente individual, así que el "referencial" para feriados debería derivarse de si se usó respaldo (hoy la UI no lo sabe).

### Origen de los datos del contexto

- El contexto se carga en `package-builder.component.ts` `loadFlightAndContext()` con `GET /destinations/:id/context?departureDate=...&returnDate=dep+7` (`destinations.controller.ts` `getContext`, `destinations.service.ts` `getContext`). Devuelve `{ destination, festivities, weather, holidays, hotels, activities }`. Las festividades se filtran por cruce de fechas (incluye viajes que cruzan de año, TS-019). Los feriados usan Calendarific si hay API key, si no `fallbackHolidays` (feriados fijos de la base).
- La ficha TS-019 señala un problema aparte que afecta a este paso: hoy el pronóstico se pide "desde hoy", no desde las fechas del viaje; para viajes lejanos debe mostrarse el clima promedio del mes rotulado "Clima promedio de [mes]". No se evaluó a fondo (no es US-012 directo), pero conviene revisarlo junto con el marcado "referencial".

### Acceso: público

**Cumple.** `/packages/new` no tiene `authGuard`.

### Conclusión US-012

1. **Paso vuelo (criterio 1):** añadir botón "cambiar vuelo" que vuelva al buscador conservando el resto del paquete; añadir UI de fecha de regreso (y, según la ficha, selección de vuelo de regreso) con señal `returnDate` en `PackageBuilderState`; validar "La fecha de regreso debe ser posterior a la de ida". Confirmar alcance (fecha vs. vuelo de regreso) con el equipo.
2. **Paso contexto (criterio 2 y 3):** añadir mensaje "No hay feriados ni festividades en tus fechas" cuando no haya coincidencias; marcar como "referencial" el dato que no provenga de consulta en vivo (usar `weather.source` y, para feriados, indicar si se usó respaldo).
3. La carga del contexto y la estructura de 3 bloques ya están; el trabajo es completar los estados vacíos y el rotulado referencial.

---

## Respuestas a las 7 preguntas

1. **¿Existe el componente change-password? ¿Está en routes? ¿Usa piezas visuales?** Existe, pero es la pantalla heredada de "crear contraseña temporal (DNI)", no la de cambiar contraseña desde el perfil. **No** está en `app.routes.ts` (huérfano). Mezcla clases del proyecto con muchos estilos en línea y colores a mano (infracción F4); `HEREDADO.md` manda rehacerla.
2. **¿Existe PATCH /auth/change-password? ¿Qué validaciones hace?** **No existe** ni el endpoint ni el método en `AuthService`. El DTO `change-password.dto.ts` existe pero solo valida `@MinLength(8)` y ningún controller lo usa. El frontend ya lo llama (404 hoy). Es área reservada (§7) → integración (G4).
3. **¿La búsqueda de vuelos tiene filtros? ¿Cuáles faltan?** **No tiene ninguno.** Faltan todos: rango de precio por persona, duración máxima, escalas, aerolínea (múltiple) y orden por precio/duración, en frontend y backend.
4. **¿El formato de duración está roto? ¿Qué pipe usa?** **No está roto.** Usa el pipe `duracion` (`duration.pipe.ts`), el campo `durationMinutes` existe en `Flight` y se renderiza "X h Y min". Arreglado en sprint 0 (`431d8cf`); la ficha lo confirma. El brief está desactualizado en este punto.
5. **¿Step-flight muestra el vuelo elegido y pide fecha de regreso?** Muestra el vuelo elegido, pero **no** pide fecha de regreso, **no** permite cambiarlo y **no** valida "La fecha de regreso debe ser posterior a la de ida". La fecha de regreso hoy es fija (+7 días, sin UI ni señal de estado).
6. **¿Step-context muestra festividades, feriados y clima?** Sí, los 3 bloques. Le falta el mensaje "No hay feriados ni festividades en tus fechas" (queda en blanco) y el marcado "referencial" (el backend trae `weather.source` pero la UI no lo usa).
7. **¿Qué falta en cada historia?** US-003: endpoint backend + pantalla rehecha + ruta + enlace desde perfil + validaciones de fortaleza/igualdad + confirmación "Contraseña actualizada". US-004: filtros y orden (FE+BE), mensaje de fecha pasada, texto de "sin resultados"; la duración ya está. US-012: cambiar vuelo + fecha/vuelo de regreso + validación; mensaje de vacío y rotulado "referencial" en el contexto.

---

## Notas para la implementación (no se implementa nada aquí)

- **Áreas reservadas (§7):** el backend de US-003 (`backend/src/auth/`) solo lo tocan los responsables de integración (G4), con prueba que cubra el cambio. US-004 (endpoint de `destinations`) y US-004/US-012 (frontend de `search`, `packages/steps`, `package-builder.state`) **no** son reservadas.
- **Convenios de verificación (CI `.github/workflows/ci.yml`):** backend `npm run lint -- --max-warnings 13`, `npm run build`, `npm test`, `npm run test:e2e` (en `backend/`); frontend `npm run build` (en `frontend/`). La definición de terminado (§10) exige compilar, pasar lint, pruebas del flujo en verde y ficha de cierre en `docs/tareas/sprint-1.md`.
- **Pruebas existentes a mantener:** `destinations.service.spec.ts` cubre el rango ±flexDays de `searchFlights` (35/35 hoy); ampliarlo al añadir filtros. El e2e (`backend/test/app.e2e-spec.ts`) no cubre estas historias — conveniente añadir casos para `change-password` y para filtros/contexto.
- **Discrepancia a confirmar:** US-012, ¿la fecha de regreso es solo una fecha o una selección de vuelo de regreso? El brief pide fecha; la ficha `sprint-1.md` pide selección de vuelo de regreso. Conviene confirmar antes de implementar.
- **Fuente de estado del heredado:** `docs/HEREDADO.md` (H3/H4) es la fuente sobre qué conservar/rehacer/retirar; releerla antes de copiar el componente `change-password` como referencia.
