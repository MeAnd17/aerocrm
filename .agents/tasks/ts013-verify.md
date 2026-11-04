# TS-013 — Datos externos con respaldo · Verificación de estado

Rama: `feat/ts016-us001-us002-roles-auth` (basada en develop)
Investigación de solo lectura. No se modificó código.

---

## Resumen

TS-013 está **PARCIALMENTE implementado**. El criterio de "ninguna pantalla en blanco" ya se cumple gracias a un respaldo estático en la base (`DestinationClimate` + `Holiday`), y el acceso público y el modo sin credenciales funcionan. Pero el núcleo de la historia —**guardar cada respuesta externa con su fecha de vencimiento, no volver a consultar mientras haya dato vigente, y servir el dato guardado (aunque esté vencido) rotulado "Dato referencial"**— **no existe**. Hoy no hay modelos de caché con vencimiento, no se persiste ninguna respuesta de Calendarific/OpenWeatherMap, y el frontend nunca muestra "Dato referencial".

Estado por criterio:
- Criterio 1 (no pantalla en blanco): **cumplido** vía respaldo estático.
- Criterio 2 (servicios gratuitos, preferir sin clave): **parcial** — usa Calendarific y OpenWeatherMap, ambos requieren clave (la historia "prefiere" uno sin clave; hoy no hay sustituto sin clave).
- Criterio 3 (guardado con vencimiento + no reconsultar): **NO implementado**.
- Criterio 4 (dato guardado aunque vencido + respaldo + "Dato referencial"): **NO implementado** (solo la rama de respaldo existe; falta la rama de caché vencido y el rótulo "Dato referencial").
- Criterio 5 (sin credenciales funciona con respaldo): **cumplido**.
- Criterio 6 (acceso público): **cumplido**.

La propia ficha en `docs/tareas/sprint-1.md` (línea ~340) lo marca `Estado actual: PARCIAL`.

---

## Respuestas a las preguntas

### 1. ¿Existen modelos en Prisma para guardar feriados y clima (caché)? ¿Tienen campo de vencimiento?

**No hay modelos de caché.** Existen dos modelos de respaldo estático, pero **ninguno guarda la respuesta en vivo ni tiene campo de vencimiento** (`expiresAt`/`vencimiento`/`fetchedAt` no existen en el schema).

`backend/prisma/schema.prisma`:
- `DestinationClimate` (líneas finales, sección "DATOS DE RESPALDO DE APIS EXTERNAS (TS-014)"): campos `destinationId`, `month`, `avgTempC`, `minTempC`, `maxTempC`, `rainyDays`, `summary`, `@@unique([destinationId, month])`. Es un promedio mensual curado, no una respuesta cacheada.
- `Holiday`: campos `countryCode`, `month`, `day`, `name`, `@@unique([countryCode, month, day])`. Son feriados nacionales de fecha fija curados, no la lista que devuelve Calendarific.

Búsqueda negativa: `grep -ni "WeatherForecast|HolidayCache|cachedAt|expiresAt|fetchedAt|cacheKey|vencimient" backend/prisma/schema.prisma` → sin resultados. No existe ningún modelo de caché de respuestas externas.

### 2. ¿El backend consulta las APIs externas en cada petición o usa caché?

**Consulta en cada petición; no usa caché.** En `backend/src/destinations/destinations.service.ts`, `getContext(id, departureDate, returnDate)` (líneas ~52-110) hace, cuando hay credenciales válidas:
- `axios.get('https://api.openweathermap.org/data/2.5/forecast?...')` (clima, línea ~73)
- `axios.get('https://calendarific.com/api/v2/holidays?...')` (feriados, línea ~91)

No hay lectura previa de una caché vigente: no se busca en base una respuesta guardada antes de llamar al servicio. La regla "mientras haya dato vigente no se vuelve a consultar el servicio" **no está implementada**. Cada visita con credenciales válidas genera dos llamadas externas en vivo.

### 3. ¿Qué pasa cuando las APIs fallan o no hay credenciales? ¿Se muestra algo o queda vacío?

**No queda vacío: cae al respaldo estático de la base.** La pantalla nunca se queda en blanco por una API caída, lo que ya cumple la regla del proyecto (criterio 1).

`destinations.service.ts`:
- Clima: el bloque `try { ... } catch { weather = null; }` (líneas ~69-83). Si la API lanza o no hay clave (`apiKey && apiKey !== 'your-openweather-key'`), `weather = null`. Luego `if (!weather) weather = await this.fallbackWeather(...)` (línea ~86) devuelve el promedio del mes desde `DestinationClimate`, con `source: 'promedio'`.
- Feriados: `try { ... } catch { holidays = []; }` (líneas ~89-100). Si falla o no hay clave, `holidays = []`. Luego `if (!holidays.length) holidays = await this.fallbackHolidays(...)` (línea ~103) devuelve los feriados de fecha fija desde `Holiday`.

Diferencias de forma entre las dos fuentes:
- Clima en vivo → `source: 'pronostico'`; respaldo → `source: 'promedio'` (campo presente, utilizable).
- Feriados en vivo → sin campo `source`; respaldo → sin campo `source` (no hay forma de distinguir en vivo de respaldo para feriados).

**No existe la rama "servir el dato guardado aunque esté vencido"**, porque no se guarda ninguna respuesta. El flujo es binario: en vivo (si hay clave y responde) o respaldo estático (si no). El criterio 4 pide tres estados (en vivo / guardado aunque vencido / respaldo de arranque); hoy hay solo dos (en vivo / respaldo de arranque).

### 4. ¿Existen datos de respaldo en el seed para feriados y clima?

**Sí.** `backend/prisma/seed-data/reference.ts`:
- `CLIMATE` (líneas ~50-62): series de promedio mensual (12 meses) para 11 destinos (CUN, GRU, GIG, MAD, SVQ, BAQ, MDE, BOG, PTY, OAX, LIM), con `spread` y `rainyDays`. `climateSummary(avg, rainyDays)` genera el texto ("Cálido, algunas lluvias", etc.).
- `HOLIDAYS` (líneas ~67-130): feriados de fecha fija para PE, MX, CO, ES, BR, PA.

`backend/prisma/seed.ts`, `seedReferenceData(ids)` (líneas ~155-180) los carga de forma idempotente: `upsert` por `destinationId_month` para clima y por `countryCode_month_day` para feriados (cumple AGENTS.md D5). El conteo final imprime `climaMensual` y `feriados`.

### 5. ¿El frontend muestra "Dato referencial" cuando el dato no es en vivo?

**No.** No aparece "Dato referencial" (ni variante) en ningún archivo del frontend (`grep -rln "Dato referencial|referencial" frontend/src` → sin resultados).

`frontend/src/app/features/packages/steps/step-context.component.ts` (única pantalla que muestra clima y feriados, paso 2 del armador):
- Muestra `weather.forecast[0].description`, `temp_min`, `temp_max` (línea ~25 del template).
- Muestra `holidays` por nombre y fecha (líneas ~18-21).
- **No usa `weather.source`** (el campo `promedio`/`pronostico` que el backend sí envía) y **no muestra ningún rótulo** que distinga dato en vivo de respaldo.

Nota: `destination-detail.component.ts` carga `destinations/:id` (`findOne`), que **no incluye** clima ni feriados (solo hoteles, actividades, festividades). El clima y los feriados solo aparecen vía `getContext`, consumido por `package-builder.component.ts` (`loadFlightAndContext`, líneas ~120-133) y guardado en `state.context()`. Por tanto "Dato referencial", si se añade, debe ir en `step-context.component.ts`.

### 6. ¿Qué falta exactamente?

1. **Modelos de caché con vencimiento** en `schema.prisma`, p. ej. `HolidayCache { countryCode, year, data (JSON), fetchedAt, expiresAt }` (TTL ~1 mes) y `WeatherCache { destinationId/city, data (JSON), fetchedAt, expiresAt }` (TTL ~horas). Cada uno con su migración Prisma.
2. **Lógica de caché en `getContext`** con tres estados por servicio:
   - leer caché vigente → devolverla como "en vivo" sin llamar al servicio;
   - caché vencida pero existente → intentar el servicio; si responde, guardar y devolver en vivo; si no responde, **servir la caché vencida** rotulada "Dato referencial";
   - sin caché y servicio caído → respaldo estático (`DestinationClimate`/`Holiday`) rotulado "Dato referencial".
   - Al traer dato en vivo, **persistirlo con su `expiresAt`**.
3. **Indicador "Dato referencial" en el frontend** (`step-context.component.ts`) cuando el dato no es en vivo, usando el campo `source` (hay que unificarlo: hoy el clima lleva `source` pero los feriados no llevan ninguno).
4. **(Opcional / más amplio) Criterio 2 "preferir sin clave"**: evaluar un servicio que no exija registrar clave, o documentar por qué se mantienen Calendarific/OpenWeatherMap. Hoy ambos requieren clave; el modo sin clave ya funciona con respaldo.

Restricciones del repositorio a considerar:
- **AGENTS.md §7 reserva el esquema y las migraciones a los responsables de integración (G4)**. Cualquier modelo de caché nuevo exige una migración, así que el implementador debe detenerse y pedir aprobación de G4 antes de tocar `schema.prisma` / `migrations/`, no hacerlo unilateralmente.
- **AGENTS.md D1**: cambio de esquema = migración commiteada + carga de arranque actualizada en el mismo PR. La caché de arranque no aplica (es runtime), pero si se quisiera sembrar caché inicial de respaldo, habría que añadirla a `seed.ts`.

---

## Conclusión

TS-013 ya no deja la pantalla en blanco: el respaldo estático (`DestinationClimate`, `Holiday`) cubre el caso de API caída o sin credenciales, y el endpoint es público. El trabajo restante es la **capa de caché con vencimiento** que la historia describe explícitamente: persistir las respuestas externas, no reconsultar mientras estén vigentes, servir la caché vencida cuando el servicio falla, y rotular "Dato referencial" en pantalla todo lo que no sea dato en vivo. Eso implica nuevos modelos Prisma (área reservada, requiere G4) y cambios en `destinations.service.ts` + `step-context.component.ts`.

## Recomendaciones de implementación (no se implementan aquí)

- Añadir `HolidayCache` y `WeatherCache` en `schema.prisma` con `expiresAt DateTime` y `data String @db.JsonB` (o campos desnormalizados); migración Prisma, aprobada por G4.
- En `getContext`, reemplazar el patrón "llama y si falla usa respaldo" por "consulta-caché → (¿vigente?) sirve; (¿vencida?) intenta servicio, guarda y sirve, o sirve vencida como referencial; (¿no hay?) respaldo como referencial". Devolver un `source` unificado: `'live' | 'stale' | 'fallback'` para ambos (clima y feriados), para que el frontend pueda mostrar "Dato referencial" tanto para `stale` como para `fallback`.
- En `step-context.component.ts`, mostrar "Dato referencial" cuando `weather.source` o `holidays[].source` no sea `live`.
- Pruebas: extender `destinations.service.spec.ts` (hoy solo cubre `searchFlights`) con casos de `getContext`: credenciales vacías → respaldo; caché vigente → no llama al servicio; caché vencida + servicio caído → sirve vencida con `source: 'stale'`; servicio en vivo → guarda y `source: 'live'`. Como `axios` se usa directo, conviene inyectar el cliente/mocks para no depender de red.
