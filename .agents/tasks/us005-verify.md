# Verificación US-005: Explorar destinos sin cuenta

**Estado general: PARCIAL — 3 de 5 criterios cumplidos, 2 con bugs confirmados**

---

## Resumen ejecutivo

| Criterio | Estado |
|---|---|
| 1. Listado con imagen, tipo y precio "desde" | ❌ INCOMPLETO — falta imagen y precio "desde" |
| 2. Filtros por tipo y búsqueda con mensaje sin resultados | ❌ INCOMPLETO — backend OK, frontend no los expone |
| 3. Detalle con hoteles, actividades, festividades y botón "Armar mi viaje" | ❌ BUG — falta botón correcto; vuelos usan relación equivocada |
| 4. Sin interrupciones de login durante la exploración | ✅ CUMPLIDO |
| 5. Acceso público (rutas sin guard) | ✅ CUMPLIDO |

---

## Evidencia detallada

### Criterio 1 — Listado: imagen, tipo y precio "desde"

**Parcialmente implementado.**

**Backend (`destinations.service.ts` línea 10-19):** `findAll` devuelve el objeto `Destination` completo que incluye el campo `imageUrl` (definido en `schema.prisma` línea 94). Sin embargo, el query NO incluye el precio "desde" (vuelo más barato hacia el destino). El servicio solo hace:

```ts
return this.prisma.destination.findMany({ where, orderBy: { name: 'asc' } });
```

No hay ningún `include` ni subconsulta que calcule el `minPrice` de `arrivingFlights`. El campo `fromPrice` no existe en ninguna parte del codebase.

**Frontend (`search.component.ts` líneas 108-122):** La sección "Destinos populares" solo muestra `dest.city`, `dest.country` y `dest.type`. No muestra `dest.imageUrl` ni ningún precio "desde". No hay `<img>` ni referencia a `imageUrl` en el template.

**Conclusión:** El tipo (`dest.type`) se muestra correctamente. La imagen y el precio "desde" no se muestran.

---

### Criterio 2 — Filtros por tipo, búsqueda por nombre/país/ciudad, mensaje sin resultados

**Backend listo, frontend no lo expone.**

**Backend (`destinations.controller.ts` líneas 12-16):** El endpoint `GET /destinations` acepta `?type=PLAYA` y `?search=texto` y los procesa correctamente en `destinations.service.ts` líneas 11-18 con filtro por `name`, `country` y `city` (case-insensitive).

**Frontend (`search.component.ts`):** El componente llama `this.api.get<any[]>('destinations')` sin pasar ningún parámetro de filtro (línea 145). No hay campos de filtro por tipo ni campo de búsqueda por nombre/país/ciudad en el template. Solo existe un selector de destino para buscar vuelos, no para explorar destinos.

**Mensaje sin resultados:** El texto `"No encontramos destinos con esos criterios"` no existe en ningún archivo del frontend. El mensaje de sin resultados existe solo para vuelos: `"No encontramos vuelos entre 3 días..."` (línea 93).

**Conclusión:** El backend soporta los filtros pero el frontend nunca los usa ni muestra el control de filtrado ni el mensaje correcto.

---

### Criterio 3 — Detalle: hoteles, actividades, festividades del año y botón "Armar mi viaje a [destino]"

**Hoteles, actividades y festividades: ✅ Presentes** en `destination-detail.component.ts`. Los tres bloques están renderizados (líneas 28-71 del template).

**Bug de vuelos — ❌ SIGUE ACTIVO:**

En `destinations.service.ts` línea 29, el método `findOne` incluye:
```ts
departingFlights: { where: { isActive: true }, orderBy: { pricePerPerson: 'asc' } },
```

La relación `departingFlights` está definida en `schema.prisma` línea 110 como `Flight[] @relation("OriginFlights")`, es decir, los vuelos que **salen** del destino. La relación correcta para "vuelos que llegan al destino" es `arrivingFlights` (`@relation("DestinationFlights")`, línea 112).

El campo `departingFlights` que se devuelve en `findOne` no se renderiza en el template del detalle (`destination-detail.component.ts`), pero sí contamina la payload y podría alimentar datos incorrectos si se consume en el armador. Además, el precio "desde" del criterio 1 debería derivarse de `arrivingFlights`, no de `departingFlights`.

**Botón "Armar mi viaje a [destino]" — ❌ NO EXISTE:**

El `destination-detail.component.ts` (línea 75) tiene este botón:
```html
<a routerLink="/search" ...>Buscar vuelos a {{ destination().city }} →</a>
```

Este botón lleva a `/search`, no a `/packages/new`. La ruta `/search` tiene `canActivate: [authGuard]` en `app.routes.ts` (línea 36), por lo que **fuerza el login** antes de dejar pasar al visitante. El botón correcto debe navegar a `/packages/new?destinationId=X` y el texto debe ser "Armar mi viaje a [destino]". Adicionalmente, el sprint doc de US-005 confirma este bug explícitamente: *"Hoy el botón de buscar del detalle del destino lleva a una pantalla que sí la pide."*

---

### Criterio 4 — Sin interrupciones de login

**✅ CUMPLIDO** para las rutas de exploración en sí.

- `/explore` → `search.component.ts`, sin guard (`app.routes.ts` línea 18).
- `/destinations/:id` → `destination-detail.component.ts`, sin guard (`app.routes.ts` línea 42).
- `/packages/new` → `package-builder.component.ts`, sin guard (`app.routes.ts` línea 47).

El armador usa `auth.isAuthenticated()` solo para cargar puntos de fidelización (línea 89 de `package-builder.component.ts`), no para bloquear el acceso.

**Excepción activa:** el botón en el detalle lleva a `/search` que sí tiene `authGuard` → este es el bug del criterio 3 que rompe también este criterio para ese flujo específico.

---

### Criterio 5 — Acceso público

**✅ CUMPLIDO.** Las rutas `/explore`, `/destinations/:id` y `/packages/new` no tienen `canActivate` en `app.routes.ts`. El navbar (`navbar.component.ts` línea 14) muestra el link "Explorar" a visitantes sin sesión apuntando a `/explore`.

---

## Bugs confirmados

### BUG-1 (Alta): Botón "Buscar vuelos" en detalle lleva a `/search` con authGuard

- **Archivo:** `frontend/src/app/features/destinations/destination-detail.component.ts` línea 75
- **Problema:** `routerLink="/search"` → `/search` requiere login. El texto tampoco coincide con el criterio ("Armar mi viaje a [destino]").
- **Fix:** Cambiar a `[routerLink]="['/packages/new']" [queryParams]="{ destinationId: destination().id }"` y actualizar el texto del botón.

### BUG-2 (Alta): `findOne` incluye `departingFlights` en lugar de `arrivingFlights`

- **Archivo:** `backend/src/destinations/destinations.service.ts` línea 29
- **Problema:** `departingFlights` devuelve vuelos que **salen** del destino. El criterio pide los que **llegan**.
- **Fix:** Reemplazar `departingFlights` por `arrivingFlights` en el include de `findOne`.

### BUG-3 (Media): Listado no muestra imagen ni precio "desde"

- **Archivos:** 
  - `backend/src/destinations/destinations.service.ts` línea 10 (falta calcular minPrice de arrivingFlights)
  - `frontend/src/app/features/search/search.component.ts` líneas 108-122 (falta `<img>` y precio en el card)
- **Fix backend:** Agregar `_min: { pricePerPerson: true }` sobre `arrivingFlights` o hacer un join separado para calcular el precio "desde".
- **Fix frontend:** Mostrar `imageUrl` con `<img>` y añadir el campo `fromPrice` en el card de cada destino.

### BUG-4 (Media): Filtros por tipo y búsqueda textual no expuestos en el frontend

- **Archivo:** `frontend/src/app/features/search/search.component.ts` línea 145
- **Problema:** El componente de exploración no tiene controles de filtro por tipo ni campo de búsqueda. El backend los soporta.
- **Fix:** Agregar selector de tipo (`PLAYA`, `CIUDAD`, `AVENTURA`, `CULTURA`) y campo de texto de búsqueda en el template, pasarlos como query params a `GET /destinations`, y mostrar el mensaje "No encontramos destinos con esos criterios" cuando el array resultante esté vacío.

---

## Recomendaciones de fix (prioridad)

1. **Inmediato (criterio 4 roto):** Cambiar el `routerLink` en `destination-detail.component.ts` de `/search` a `/packages/new` con `destinationId` como query param. Actualizar texto del botón a "Armar mi viaje a [nombre del destino]".
2. **Alta:** Corregir `departingFlights` → `arrivingFlights` en `findOne` del service.
3. **Media:** Agregar controles de filtro y búsqueda en el template de exploración, pasar params al backend, mostrar mensaje de vacío.
4. **Media:** Agregar precio "desde" en `findAll` (calcular min de `arrivingFlights`) y mostrar imagen + precio en el card del listado.
