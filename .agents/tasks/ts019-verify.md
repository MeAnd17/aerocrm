# Verificación TS-019: Clima esperado y festividades correctas

**Fecha de análisis:** investigación sobre rama `main` (HEAD `6521fda`) y rama `origin/feat/ts-019-clima-festividades` (punta `c8ad4fd`).

---

## Resumen ejecutivo

**TS-019 está completamente implementada en su rama de feature, pero NO ha sido mergeada a `main`.**

La rama `origin/feat/ts-019-clima-festividades` contiene la implementación completa y correcta de todos los criterios de aceptación. El PR #5 fue creado (la ficha de cierre lo registra) pero el merge a `main`/`develop` no se ejecutó. El archivo de trabajo actual refleja la versión pre-fix de `main`: los dos bugs originales (clima siempre desde hoy, festividades asumen mismo año) siguen activos en la rama principal.

---

## Estado por criterio de aceptación

### CA-1 — Bug: se mostraba el pronóstico desde hoy, no desde las fechas del viaje

**Estado en `main`:** ❌ BUG ACTIVO  
**Estado en la rama TS-019:** ✅ CORREGIDO

**Evidencia en `main`** (`destinations.service.ts` líneas 49–66):
```typescript
// Siempre pide el pronóstico desde ahora (cnt=5 = próximos 5 bloques desde hoy)
const res = await axios.get(
  `.../forecast?...&cnt=5`
);
weather = {
  source: 'pronostico',
  forecast: res.data.list.slice(0, 3).map((item: any) => ({...})),
};
```
No hay ningún filtrado por fecha de viaje. Se muestran los primeros 3 bloques del pronóstico desde el momento de la consulta.

**Corrección en rama TS-019** (commit `3f835b0`):
- Se introduce `isWithinForecast(dep)` que compara la fecha de salida del viaje con `Date.now() + 5 * DAY`.
- Si el viaje está lejos, se salta completamente el llamado a OpenWeatherMap.
- Si está cerca, se pide el pronóstico completo (sin `cnt=5`) y se filtran **solo los bloques cuyo timestamp cae entre `dep` y `ret + 1 día`**.

---

### CA-2 — Viaje cercano: pronóstico real de esas fechas

**Estado en `main`:** ❌ NO IMPLEMENTADO  
**Estado en la rama TS-019:** ✅ IMPLEMENTADO

**Corrección en rama TS-019** (commit `3f835b0`, función `getContext`):
```typescript
const nearTrip = isWithinForecast(dep);
if (nearTrip) {
  // ...llamada a OpenWeatherMap sin cnt limitado...
  const list: ForecastItem[] = res.data.list;
  const items = list.filter((item) => {
    const t = item.dt * 1000;
    return t >= dep.getTime() && t < ret.getTime() + DAY;
  });
  if (items.length) {
    weather = {
      source: 'pronostico',
      label: 'Pronóstico para tus fechas',
      ...
    };
  }
}
```
La constante `FORECAST_DAYS = 5` está documentada. Si no hay bloques en el rango del viaje (viaje muy corto al borde de la ventana), se cae al fallback del promedio.

---

### CA-3 — Viaje lejano: clima promedio del mes con temp mín, máx, condición típica y rótulo "Clima promedio de [mes]"

**Estado en `main`:** ⚠️ PARCIALMENTE IMPLEMENTADO — fallback existe pero sin condición ni rótulo correcto  
**Estado en la rama TS-019:** ✅ COMPLETO

**Estado en `main`** (`destinations.service.ts` líneas 144–157):
```typescript
private async fallbackWeather(destinationId: number, city: string, dep: Date) {
  // ...consulta destinationClimate...
  return {
    source: 'promedio',
    city,
    forecast: [{
      description: `${climate.summary} (promedio del mes)`,  // rótulo embebido en description
      temp_min: ...,
      temp_max: ...,
    }],
  };
}
```
- No hay campo `label` separado.
- El rótulo "promedio del mes" está hardcodeado en la descripción, no como `"Clima promedio de [mes]"` con el nombre real del mes.
- El fallback siempre se usa (no hay distinción viaje cercano vs. lejano), por lo que un viaje lejano mostraría el promedio correcto de mes pero **sin el rótulo exigido**.

**Corrección en rama TS-019** (commit `3f835b0` + `c8ad4fd`):
```typescript
const MESES = ['enero', 'febrero', ..., 'diciembre'];

private async fallbackWeather(destinationId: number, city: string, dep: Date, nearTrip = false) {
  const month = dep.getUTCMonth() + 1;
  // ...
  const label = `Clima promedio de ${MESES[month - 1]}`;
  return {
    source: 'promedio',
    label: nearTrip ? `Dato referencial · ${label}` : label,
    city,
    forecast: [{
      description: climate.summary,  // solo la condición, sin el rótulo embebido
      temp_min: ...,
      temp_max: ...,
    }],
  };
}
```
- `label` toma el nombre real del mes: `"Clima promedio de diciembre"`.
- Cuando el viaje era cercano pero el pronóstico no respondió, el label es `"Dato referencial · Clima promedio de [mes]"`.
- Las tres propiedades (`temp_min`, `temp_max`, `description`) están presentes.

---

### CA-4 — Festividades que cruzan de año

**Estado en `main`:** ❌ BUG ACTIVO  
**Estado en la rama TS-019:** ✅ CORREGIDO

**Bug en `main`** (`destinations.service.ts` líneas 42–47):
```typescript
const matchingFestivities = destination.festivities.filter(f => {
  const festStart = new Date(dep.getFullYear(), f.startMonth - 1, f.startDay);
  const festEnd   = new Date(dep.getFullYear(), f.endMonth - 1, f.endDay);
  return festStart <= ret && festEnd >= dep;
});
```
Ambas fechas de la festividad se construyen con `dep.getFullYear()`, por lo que una festividad que va de dic→ene queda como dic→ene del mismo año (fin antes que inicio en el calendario). Nunca coincide con un viaje en enero del año siguiente.

**Corrección en rama TS-019** (commit `3f835b0`, función exportada `festivityInTrip`):
```typescript
export function festivityInTrip(f, dep, ret): boolean {
  const crossesYear = f.endMonth < f.startMonth ||
    (f.endMonth === f.startMonth && f.endDay < f.startDay);
  for (let year = dep.getUTCFullYear() - 1; year <= ret.getUTCFullYear(); year++) {
    const start = Date.UTC(year, f.startMonth - 1, f.startDay);
    const end   = Date.UTC(crossesYear ? year + 1 : year, f.endMonth - 1, f.endDay);
    if (start <= ret.getTime() && end >= dep.getTime()) return true;
  }
  return false;
}
```
- Detecta si la festividad cruza de año comparando si el mes de fin es menor al de inicio.
- Itera desde `depYear - 1` hasta `retYear` para cubrir todos los casos.
- Usa `Date.UTC` (no `new Date` local) para evitar problemas de zona horaria.

---

## Tests

La rama TS-019 incluye dos nuevos suites en `destinations.service.spec.ts`:

**`festivityInTrip (TS-019)`** — 4 casos:
- Festividad dic→ene coincide con viaje en diciembre ✓
- Festividad dic→ene coincide con viaje en enero ✓
- Viaje que cruza de año coincide con festividad de enero ✓
- Viaje fuera del rango no coincide ✓

**`DestinationsService.getContext · clima (TS-019)`** — 2 casos:
- Viaje lejano (año 2099) → `destinationClimate.findUnique` se llama con `month: 12`, `weather.label === 'Clima promedio de diciembre'`, forecast tiene las 3 propiedades ✓
- `isWithinForecast` retorna `true` solo para viajes dentro de los 5 días ✓

En `main`, el spec solo tiene los tests de `searchFlights` (los de TS-019 no están mergeados).

---

## Frontend

**`step-context.component.ts`** (armador, paso 2):

En `main` el template muestra solo `description`, `temp_min` y `temp_max` sin ningún rótulo:
```html
<p>🌤 {{ weather?.forecast?.[0]?.description }}, {{ temp_min }}°C - {{ temp_max }}°C</p>
```

En la rama TS-019 (commit `3f835b0`) se añadió el rótulo:
```html
@if (weather?.label) { <span class="font-medium">{{ weather?.label }}:</span> }
```

**`destination-detail.component.ts`** (página pública del destino): este componente llama a `GET /destinations/:id` (sin fechas del viaje), que devuelve todas las festividades del destino sin filtrado por viaje. Este componente no fue modificado por TS-019 y no necesita cambios: TS-019 aplica solo a `getContext`, que es el endpoint del armador.

---

## Conclusiones y recomendaciones

### Diagnóstico
TS-019 fue **implementada correctamente y completamente** en `origin/feat/ts-019-clima-festividades`. Los cuatro criterios de aceptación están cubiertos, hay tests unitarios para los dos casos nuevos, y el frontend muestra el rótulo. El PR #5 fue abierto pero **no fue mergeado a `main`**.

### Bug residual en la rama TS-019 (menor)
La línea `const nearTrip = isWithinForecast(dep);` en `getContext` usa `Date.now()` internamente para la comparación. Esto es correcto en producción pero hace que el test del viaje lejano (año 2099) pase por el path `!nearTrip` implícitamente. No es un bug funcional; el test lo valida correctamente.

### Acción requerida

**1 — Mergear el PR #5** (`origin/feat/ts-019-clima-festividades` → `main`). No se requiere ningún cambio adicional de código.

**2 — Verificar que la ficha de cierre llegue a `main`**: el cierre de TS-019 está solo en el branch. Al mergear, la sección `## Fichas de cierre` de `docs/tareas/sprint-1.md` recibirá la ficha.

**3 — No hay bugs residuales funcionales** en la lógica de TS-019 dentro de su rama. La implementación cubre todos los criterios incluyendo el edge case de festividades dic→ene, el rótulo con el nombre real del mes, y la diferenciación entre viaje cercano (pronóstico filtrado) y lejano (promedio con label).

---

## Archivos relevantes

| Archivo | Estado en `main` | Estado en rama TS-019 |
|---|---|---|
| `backend/src/destinations/destinations.service.ts` | Bug activo (clima desde hoy, festividades mismo año) | Corregido con `festivityInTrip`, `isWithinForecast`, `nearTrip`, `MESES`, `label` |
| `backend/src/destinations/destinations.service.spec.ts` | Solo tests de `searchFlights` | +4 tests `festivityInTrip` +2 tests `getContext·clima` |
| `frontend/src/app/features/packages/steps/step-context.component.ts` | Sin rótulo | Muestra `weather.label` antes de la descripción |
| `docs/tareas/sprint-1.md` | Sin ficha de cierre TS-019 | Ficha de cierre completa + PR #5 |
