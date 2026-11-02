# Verificación US-007 y US-008

Fecha: investigación estática del repositorio  
Estado del sprint documentado: **PARCIAL** para ambas historias (según `docs/tareas/sprint-1.md`)

---

## Resumen ejecutivo

**US-007 (Filtrar hoteles): NO implementada.** El componente de hoteles en el armador (`step-hotel.component.ts`) muestra una lista plana sin ningún filtro de categoría, zona ni rango de precio. No hay ordenamiento, no hay mensaje de "sin resultados" y no existe un componente reutilizable: el detalle del destino tiene su propia lista inline también sin filtros.

**US-008 (Filtrar actividades): NO implementada.** El componente de actividades en el armador (`step-activities.component.ts`) muestra todas las actividades del destino sin filtros de tipo ni de precio. No hay mensaje de "sin resultados" y tampoco existe un componente reutilizable compartido con el detalle del destino.

---

## Evidencia detallada

### US-007 — Filtrar hoteles

#### 1. ¿Existe componente con filtros de categoría (estrellas, múltiple), zona y rango de precio?

**No.** El único componente que muestra hoteles en el armador es `step-hotel.component.ts`:

```typescript
// frontend/src/app/features/packages/steps/step-hotel.component.ts
@for (hotel of state.context()?.hotels; track hotel.id) {
  <div (click)="state.toggleHotel(hotel)" ...>
    <p class="font-medium text-sm">{{ hotel.name }}</p>
    <p class="text-xs text-gray-500">{{ '⭐'.repeat(hotel.stars) }} · {{ hotel.zone }}</p>
    <p class="font-bold text-blue-900 text-sm">S/. {{ hotel.pricePerNight }}/noche</p>
  </div>
}
```

Itera directamente sobre `state.context()?.hotels` sin ninguna lógica de filtrado. No hay controles de UI para estrellas, zona ni precio. No hay `signal` ni propiedad de estado para filtros.

#### 2. ¿Se puede ordenar por precio y categoría?

**No.** No hay ningún control de ordenamiento ni pipe de sort aplicado.

#### 3. ¿Muestra total de estadía si hay fechas?

**Parcialmente.** El componente muestra `S/. {{ hotel.pricePerNight }}/noche`. Cuando el hotel se selecciona se muestran inputs de fecha de entrada/salida, pero el total calculado no se muestra en la tarjeta de cada hotel durante la selección. El `PackageBuilderState` tiene `hotelTotal` computed, pero ese valor no se proyecta en `step-hotel.component.ts` sobre cada opción antes de elegir.

#### 4. ¿Mensaje "Ningún hotel coincide con esos filtros"?

**No.** No existe ningún mensaje de estado vacío porque no hay filtros aplicados.

#### 5. ¿El componente se reutiliza en detalle de destino Y en el armador?

**No.** Son dos implementaciones completamente separadas:

- **Armador** → `step-hotel.component.ts`: lista inline en el template del componente del paso.
- **Detalle del destino** → `destination-detail.component.ts` (líneas 48-56): otra lista inline distinta en el mismo template del componente, sin imagen y con formato diferente.

No existe ningún componente compartido de tipo `HotelListComponent` o similar. La búsqueda de `hotel-filter`, `hotel-list`, `HotelFilter`, `HotelList` en todos los `.ts` del frontend no arrojó resultados.

#### Hallazgo adicional — imagen del hotel

El criterio de aceptación dice "cada hotel muestra imagen". Ninguna de las dos implementaciones actuales muestra imagen. La estructura `HotelSeed` en `backend/prisma/seed-data/catalog.ts` tampoco tiene campo de imagen para hoteles.

---

### US-008 — Filtrar actividades

#### 1. ¿Existe componente con filtros de tipo (múltiple) y rango de precio?

**No.** El componente `step-activities.component.ts` itera directamente sobre `state.context()?.activities`:

```typescript
// frontend/src/app/features/packages/steps/step-activities.component.ts
@for (act of state.context()?.activities; track act.id) {
  <div (click)="state.toggleActivity(act)" ...>
    <p class="font-medium text-sm">{{ act.name }}</p>
    <p class="text-xs text-gray-500">{{ act.type | etiqueta }} · {{ act.durationHours }}h</p>
    <p class="font-bold text-blue-900 text-sm">S/. {{ act.price }}</p>
    <p class="text-xs text-gray-400">por persona</p>
  </div>
}
```

No hay controles de filtro por tipo ni por rango de precio.

#### 2. ¿Muestra nombre, tipo, duración y precio por persona?

**Sí, en el armador.** El componente muestra nombre (`act.name`), tipo transformado con pipe (`act.type | etiqueta`), duración en horas (`act.durationHours`) y precio por persona (`act.price` con label "por persona"). Este criterio se cumple en `step-activities.component.ts`.

En cambio, en `destination-detail.component.ts` (líneas 62-68) el precio se muestra pero **sin el label "por persona"**:

```typescript
<p class="text-sm font-bold text-blue-900 mt-1">S/. {{ act.price }}</p>
// Sin "por persona"
```

#### 3. ¿Mensaje "No hay actividades de ese tipo en este destino"?

**No.** No existe ningún mensaje de estado vacío ni en el armador ni en el detalle del destino.

#### 4. ¿El componente se reutiliza en detalle de destino Y en el armador?

**No.** Al igual que con hoteles, son dos implementaciones distintas:

- **Armador** → `step-activities.component.ts`
- **Detalle** → `destination-detail.component.ts` (líneas 57-70)

La búsqueda de `activity-filter`, `activity-list`, `ActivityFilter`, `ActivityList` en todos los `.ts` no arrojó resultados.

---

## Estado confirmado en la documentación

`docs/tareas/sprint-1.md` marca explícitamente ambas historias como **PARCIAL**:

```
### US-007: Filtrar los hoteles de un destino
Estado actual: PARCIAL

### US-008: Filtrar las actividades de un destino
Estado actual: PARCIAL
```

El código refleja ese estado: lo que existe es el andamiaje básico de listado, no la funcionalidad de filtros pedida.

---

## Tabla de criterios por historia

### US-007

| Criterio | Estado |
|---|---|
| Filtros: estrellas (múltiple), zona, rango de precio | ❌ No implementado |
| Ordenamiento por precio y categoría | ❌ No implementado |
| Resultados: imagen, nombre, estrellas, zona, precio/noche | ⚠️ Parcial (sin imagen) |
| Total de estadía cuando hay fechas elegidas | ⚠️ Parcial (solo después de seleccionar, no en la selección) |
| Mensaje "Ningún hotel coincide con esos filtros" | ❌ No implementado |
| Reutilización: mismo componente en detalle Y armador | ❌ No implementado (dos implementaciones inline separadas) |
| Acceso público | ✅ Sí |

### US-008

| Criterio | Estado |
|---|---|
| Filtros: tipo (múltiple) y rango de precio | ❌ No implementado |
| Resultados: nombre, tipo, duración, precio/persona | ⚠️ Parcial (precio sin label "por persona" en detalle del destino) |
| Mensaje "No hay actividades de ese tipo en este destino" | ❌ No implementado |
| Reutilización: mismo componente en detalle Y armador | ❌ No implementado (dos implementaciones inline separadas) |
| Acceso público | ✅ Sí |

---

## Archivos relevantes identificados

| Archivo | Rol |
|---|---|
| `frontend/src/app/features/packages/steps/step-hotel.component.ts` | Lista de hoteles del armador (sin filtros) |
| `frontend/src/app/features/packages/steps/step-activities.component.ts` | Lista de actividades del armador (sin filtros) |
| `frontend/src/app/features/destinations/destination-detail.component.ts` | Detalle del destino (lista inline de hoteles y actividades, sin filtros) |
| `frontend/src/app/features/packages/package-builder.state.ts` | Estado del armador (tiene `hotelTotal` computed pero no signals de filtros) |
| `backend/src/destinations/destinations.service.ts` | Devuelve hoteles y actividades sin soporte de filtrado por query params |
| `backend/src/destinations/destinations.controller.ts` | No expone endpoints de filtrado de hoteles ni actividades |

---

## Recomendaciones de fix

### Para US-007

1. **Crear `HotelListComponent`** en `frontend/src/app/shared/components/hotel-list/` con:
   - Signals internas: `selectedStars: Signal<number[]>`, `selectedZone: Signal<string>`, `minPrice/maxPrice: Signal<number>`, `sortBy: Signal<'price'|'stars'>`.
   - `computed` `filteredHotels` que aplica los filtros sobre el input `@Input() hotels`.
   - Mensaje "Ningún hotel coincide con esos filtros" cuando `filteredHotels()` es vacío.
   - Total de estadía: recibe `@Input() nights` y lo multiplica por `pricePerNight` cuando `nights > 0`.
   - Para la imagen: agregar campo `imageUrl` al modelo `Hotel` en Prisma y al seed.

2. **Reemplazar las listas inline** en `step-hotel.component.ts` y `destination-detail.component.ts` con `<app-hotel-list [hotels]="..." [nights]="..." />`.

### Para US-008

1. **Crear `ActivityListComponent`** en `frontend/src/app/shared/components/activity-list/` con:
   - Signals internas: `selectedTypes: Signal<string[]>`, `minPrice/maxPrice: Signal<number>`.
   - `computed` `filteredActivities` que aplica los filtros.
   - Mensaje "No hay actividades de ese tipo en este destino" cuando `filteredActivities()` es vacío.
   - Mostrar consistentemente el label "por persona" en el precio.

2. **Reemplazar las listas inline** en `step-activities.component.ts` y `destination-detail.component.ts` con `<app-activity-list [activities]="..." />`.

### Backend (opcional para esta fase)

El filtrado puede hacerse completamente en el frontend sobre los datos que ya llegan en `context.hotels` y `context.activities`, por lo que no se requiere cambio en el backend para cumplir los criterios de aceptación actuales.
