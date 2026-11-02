# Implementation Plan — US-005, US-007, US-008, US-009 fixes

Rama activa: `feat/us005-us007-us008-us009-fixes`

---

## FEAT-001 — Fixes puntuales: US-009 backend + frontend, US-005 backend

- [ ] 1. **Backend — US-009: validar documento duplicado en `createTraveler`**
      En `backend/src/clients/clients.service.ts`, método `createTraveler`, después de resolver `user.client.id` y antes de `prisma.traveler.create`, agregar:
      ```ts
      const existing = await this.prisma.traveler.findFirst({
        where: { clientId: user.client.id, documentNumber: dto.documentNumber },
      });
      if (existing) throw new BadRequestException('Ya tienes un viajero con ese documento');
      ```
      Agregar `BadRequestException` al import de `@nestjs/common`.
      Files: `backend/src/clients/clients.service.ts`
      Verify: `cd backend && npm run lint && npm test` — cero errores, todos los tests en verde.

- [ ] 2. **Frontend — US-009: confirmación al eliminar viajero**
      En `frontend/src/app/features/profile/profile.component.ts`, método `deleteTraveler(id: number)`:
      - Buscar el viajero: `const traveler = this.travelers().find(t => t.id === id);`
      - Mostrar: `if (!confirm(\`¿Eliminar a ${traveler?.firstName} ${traveler?.lastName} de tus viajeros?\`)) return;`
      - Agregar manejo de error con ToastService (también necesario para el paso 3, inyectarlo en este paso).
      Files: `frontend/src/app/features/profile/profile.component.ts`
      Verify: `cd frontend && npm run build` — compila sin errores.

- [ ] 3. **Frontend — US-009: mensaje de éxito "Datos actualizados"**
      En el mismo componente de perfil, en el método `saveProfile()`:
      - Reemplazar `this.saved.set(true); setTimeout(...)` por `this.toast.success('Datos actualizados');`
      - Eliminar la señal `saved` y el `@if (saved())` del template.
      - Inyectar `ToastService` en el constructor si no lo está ya (del paso 2).
      Files: `frontend/src/app/features/profile/profile.component.ts`
      Verify: `cd frontend && npm run build` — compila sin errores.

- [ ] 4. **Backend — US-005: vuelos que LLEGAN en `findOne`**
      En `backend/src/destinations/destinations.service.ts`, método `findOne`, en el bloque `include` del `prisma.destination.findUnique`, cambiar `departingFlights` por `arrivingFlights`. Conservar mismo `where` y `orderBy`.
      Files: `backend/src/destinations/destinations.service.ts`
      Verify: `cd backend && npm run lint && npm test && npm run build` — sin errores.

---

## FEAT-002 — US-005 frontend: listado de destinos con imagen, precio "desde" y filtros

- [ ] 5. **Backend — agregar campo `fromPrice` en `findAll` de destinos**
      En `backend/src/destinations/destinations.service.ts`, método `findAll`:
      - Después de obtener el array de destinos, mapear con `Promise.all`:
        ```ts
        const withPrice = await Promise.all(destinations.map(async (d) => {
          const cheapest = await this.prisma.flight.findFirst({
            where: { destinationId: d.id, isActive: true },
            orderBy: { pricePerPerson: 'asc' },
            select: { pricePerPerson: true },
          });
          return { ...d, fromPrice: cheapest ? Number(cheapest.pricePerPerson) : null };
        }));
        return withPrice;
        ```
      Files: `backend/src/destinations/destinations.service.ts`
      Verify: `cd backend && npm run lint && npm test && npm run build` — sin errores.

- [ ] 6. **Frontend — crear `DestinationsListComponent`**
      Crear `frontend/src/app/features/destinations/destinations-list.component.ts` como componente standalone (`selector: 'app-destinations-list'`).
      - Signals: `destinations = signal<any[]>([])`, `loading = signal(false)`, `typeFilter = signal('')`, `searchText = signal('')`.
      - `computed filteredDestinations()`: filtra `destinations()` por `typeFilter` (si no está vacío) y por `searchText` (insensible a mayúsculas, contra name + country + city).
      - Template:
        - Input de búsqueda (`[(ngModel)]="searchText()"`) con `(ngModelChange)="searchText.set($event)"`.
        - Botones de tipo: `['', 'PLAYA', 'CIUDAD', 'AVENTURA', 'CULTURA']`, mostrando etiqueta con pipe, el vacío como "Todos". Al clicar, `typeFilter.set(t)`.
        - Grilla de tarjetas: imagen (`imageUrl` con fallback a `bg-primary-100`), nombre/ciudad, país, tipo (`etiqueta` pipe), precio "desde S/. X" (`fromPrice`, o "Consultar" si es null).
        - Cada tarjeta enlaza a `/destinations/{{ dest.id }}` con `routerLink`.
        - Si `filteredDestinations()` está vacío (y `typeFilter()` o `searchText()` no están vacíos): `<ui-empty-state icon="🌍" title="No encontramos destinos con esos criterios" />`.
      - `ngOnInit`: `this.api.get<any[]>('destinations').subscribe(data => this.destinations.set(data))`.
      - Importa: `CommonModule`, `FormsModule`, `RouterLink`, `LabelPipe`, `EmptyStateComponent`, `LoadingStateComponent`.
      Files: `frontend/src/app/features/destinations/destinations-list.component.ts`
      Verify: `cd frontend && npm run build` — compila sin errores.

- [ ] 7. **Frontend — registrar ruta `/destinations` en `app.routes.ts`**
      Agregar la ruta pública (sin `canActivate`) antes de `destinations/:id`:
      ```ts
      {
        path: 'destinations',
        loadComponent: () => import('./features/destinations/destinations-list.component')
          .then(m => m.DestinationsListComponent),
      },
      ```
      Files: `frontend/src/app/app.routes.ts`
      Verify: `cd frontend && npm run build` — compila sin errores.

- [ ] 8. **Frontend — corregir botón en `DestinationDetailComponent`**
      En `frontend/src/app/features/destinations/destination-detail.component.ts`:
      - Reemplazar `<a routerLink="/search" ...>Buscar vuelos a {{ destination().city }} →</a>` por un botón que navegue a `/packages/new` con `queryParams: { destinationId: destination().id }`.
      - Inyectar `Router` en el constructor y usar `this.router.navigate(['/packages/new'], { queryParams: { destinationId: this.destination().id } })`.
      - Cambiar el texto a `Armar mi viaje a {{ destination().city }} →`.
      - Importar `Router` de `@angular/router`.
      Files: `frontend/src/app/features/destinations/destination-detail.component.ts`
      Verify: `cd frontend && npm run build` — compila sin errores.

---

## FEAT-003 — US-007 + US-008: componentes reutilizables de hoteles y actividades con filtros

- [ ] 9. **Crear `HotelListComponent` en `shared/ui/`**
      Crear `frontend/src/app/shared/ui/hotel-list.component.ts`:
      - Selector: `app-hotel-list`. Standalone.
      - `@Input() hotels: any[] = []`
      - `@Input() checkIn: string | null = null`
      - `@Input() checkOut: string | null = null`
      - `@Input() selected: any = null` (hotel seleccionado, para highlight)
      - `@Output() hotelSelect = new EventEmitter<any>()`
      - Signals internas: `starFilters = signal<number[]>([])`, `zoneFilter = signal('')`, `minPrice = signal<number|null>(null)`, `maxPrice = signal<number|null>(null)`, `sortBy = signal<'price'|'stars'>('price')`.
      - `computed zones()`: array de zonas únicas de `hotels` (usando `[...new Set(this.hotels.map(h => h.zone))]`).
      - `computed filteredHotels()`: filtra por estrellas (si `starFilters()` no vacío), zona, rango precio; ordena por sortBy.
      - `computed nights()`: si checkIn y checkOut, calcular días; si no, 0.
      - Template:
        - Filtros: checkboxes 1–5 estrellas (múltiple), select de zona, inputs min/max precio, select ordenar por precio/estrellas.
        - Tarjeta por hotel: imagen (`imageUrl`, fallback gradiente `bg-primary-100 h-24`), nombre, zona, `<ui-stars [rating]='hotel.stars' />`, precio por noche. Si `nights() > 0`, mostrar total estadía.
        - Ring highlight cuando `selected?.id === hotel.id`.
        - Clic en tarjeta emite `hotelSelect.emit(hotel)`.
        - Si `filteredHotels()` vacío: `<ui-empty-state icon="🏨" title="Ningún hotel coincide con esos filtros" />`.
      - Importa: `CommonModule`, `FormsModule`, `RatingStarsComponent`, `EmptyStateComponent`.
      Files: `frontend/src/app/shared/ui/hotel-list.component.ts`
      Verify: `cd frontend && npm run build` — compila sin errores.

- [ ] 10. **Crear `ActivityListComponent` en `shared/ui/`**
       Crear `frontend/src/app/shared/ui/activity-list.component.ts`:
       - Selector: `app-activity-list`. Standalone.
       - `@Input() activities: any[] = []`
       - `@Input() selectedIds: number[] = []` (ids de actividades seleccionadas, para highlight)
       - `@Output() activityToggle = new EventEmitter<any>()`
       - Signals internas: `typeFilters = signal<string[]>([])`, `minPrice = signal<number|null>(null)`, `maxPrice = signal<number|null>(null)`.
       - Constante `activityTypes = ['AVENTURA', 'CULTURAL', 'GASTRONOMICO', 'FAMILIAR', 'RELAX', 'DEPORTIVO']`.
       - `computed filteredActivities()`: filtra por tipos (si no vacío) y rango precio.
       - Template:
         - Filtros: checkboxes por tipo (con pipe `etiqueta`), inputs min/max precio.
         - Tarjeta por actividad: nombre, tipo (pipe `etiqueta`), duración en horas, precio por persona.
         - Ring highlight cuando `selectedIds.includes(act.id)`.
         - Clic emite `activityToggle.emit(act)`.
         - Si `filteredActivities()` vacío: `<ui-empty-state icon="🎯" title="No hay actividades de ese tipo en este destino" />`.
       - Importa: `CommonModule`, `FormsModule`, `LabelPipe`, `EmptyStateComponent`.
       Files: `frontend/src/app/shared/ui/activity-list.component.ts`
       Verify: `cd frontend && npm run build` — compila sin errores.

- [ ] 11. **Exportar nuevos componentes desde `shared/ui/index.ts`**
       Agregar al final de `frontend/src/app/shared/ui/index.ts`:
       ```ts
       export * from './hotel-list.component';
       export * from './activity-list.component';
       ```
       Files: `frontend/src/app/shared/ui/index.ts`
       Verify: `cd frontend && npm run build` — compila sin errores.

- [ ] 12. **Integrar `HotelListComponent` en `StepHotelComponent`**
       En `frontend/src/app/features/packages/steps/step-hotel.component.ts`:
       - Reemplazar el `@for (hotel of ...)` por `<app-hotel-list [hotels]="state.context()?.hotels ?? []" [checkIn]="state.hotelCheckIn()" [checkOut]="state.hotelCheckOut()" [selected]="state.hotel()" (hotelSelect)="state.toggleHotel($event)" />`.
       - Eliminar los estilos de highlight inline que ya no se necesitan.
       - Mantener las inputs de fechas y los botones Continuar/Omitir debajo.
       - Importar `HotelListComponent`.
       Files: `frontend/src/app/features/packages/steps/step-hotel.component.ts`
       Verify: `cd frontend && npm run build` — compila sin errores.

- [ ] 13. **Integrar `ActivityListComponent` en `StepActivitiesComponent`**
       En `frontend/src/app/features/packages/steps/step-activities.component.ts`:
       - Reemplazar el `@for (act of ...)` por `<app-activity-list [activities]="state.context()?.activities ?? []" [selectedIds]="state.activities().map(a => a.id)" (activityToggle)="state.toggleActivity($event)" />`.
       - Importar `ActivityListComponent`.
       - Mantener los botones Continuar/Omitir.
       Files: `frontend/src/app/features/packages/steps/step-activities.component.ts`
       Verify: `cd frontend && npm run build` — compila sin errores.

- [ ] 14. **Integrar ambos componentes en `DestinationDetailComponent`**
       En `frontend/src/app/features/destinations/destination-detail.component.ts` (leer el estado actual del archivo después de FEAT-002 paso 8):
       - En la sección de hoteles, reemplazar el `@for (hotel of ...)` por `<app-hotel-list [hotels]="destination().hotels ?? []" />`.
       - En la sección de actividades, reemplazar el `@for (act of ...)` por `<app-activity-list [activities]="destination().activities ?? []" />`.
       - Sin inputs `selected`/`selectedIds` ni outputs (en esta pantalla es solo exploración, sin selección).
       - Importar `HotelListComponent` y `ActivityListComponent`.
       Files: `frontend/src/app/features/destinations/destination-detail.component.ts`
       Verify: `cd frontend && npm run build` — compila sin errores.

---

## Verificación final de todo el conjunto

Verificar: 
```sh
cd /Users/admin/Downloads/2026-2/Admin/aerocrm/backend && npm run lint && npm test && npm run build
cd /Users/admin/Downloads/2026-2/Admin/aerocrm/frontend && npm run build
```
Todos los comandos deben terminar sin errores.

Commit local (no push): `fix: implementa fixes US-005, US-007, US-008 y US-009 (US-005, US-007, US-008, US-009)`
