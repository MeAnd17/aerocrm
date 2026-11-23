import { Component, OnInit, computed, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { PackageDraftService } from '../packages/package-draft.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { apiErrorMessage } from '../../core/services/api-error';
import {
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  EmptyStateComponent,
  FormFieldComponent,
  InputDirective,
} from '../../shared/ui';

/** Opciones de filtro de escala. */
type StopsFilter = 'todos' | 'directo' | '1' | '2+';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, LabelPipe, DurationPipe, BadgeComponent, ButtonComponent, CardComponent, EmptyStateComponent, FormFieldComponent, InputDirective],
  template: `
    <div class="space-y-8 lg:space-y-10">
      <!-- Portada -->
      <section>
        <ui-badge tone="accent">✈️ Vuelo + hotel + actividades en un solo flujo</ui-badge>
        <h1 class="mt-4 max-w-3xl text-[36px] leading-[44px] sm:text-[56px] sm:leading-[64px] font-extrabold tracking-tight text-primary-700">
          Arma tu viaje a tu propio ritmo
        </h1>
        <p class="mt-3 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-500">
          Busca vuelos, combina hospedaje y actividades, y ingresa tus datos recién al momento de reservar.
        </p>
      </section>

      <!-- Formulario de búsqueda -->
      <section class="rounded-2xl border border-slate-900/[0.06] bg-white p-4 shadow-raised sm:p-6" aria-label="Buscar vuelos">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ui-field label="Origen" [error]="originDestinationError()">
            <select uiInput [(ngModel)]="searchForm.origin" (ngModelChange)="onRouteChange()">
              <option value="">Selecciona un origen</option>
              @for (orig of origins(); track orig.iataCode) {
                <option [value]="orig.iataCode">{{ orig.city }} ({{ orig.iataCode }})</option>
              }
            </select>
          </ui-field>
          <ui-field label="Destino" [error]="originDestinationError()">
            <select uiInput [(ngModel)]="searchForm.destinationId" (ngModelChange)="onRouteChange()">
              <option value="">Selecciona un destino</option>
              @for (dest of destinations(); track dest.id) {
                <option [value]="dest.id">{{ dest.city }}, {{ dest.country }}</option>
              }
            </select>
          </ui-field>
          <ui-field label="Fecha de salida" [error]="dateError()">
            <input uiInput type="date" [(ngModel)]="searchForm.departureDate" [min]="today" (ngModelChange)="onDateChange()" />
          </ui-field>
          <ui-field label="Pasajeros" [error]="passengersError()">
            <input uiInput type="number" [(ngModel)]="searchForm.passengers" min="1" max="9" (ngModelChange)="onPassengersChange()" />
          </ui-field>
        </div>
        <div class="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-slate-500">
            <span class="font-semibold text-success-700">✓</span>
            Mostramos salidas hasta 3 días antes y después de tu fecha.
          </p>
          <button type="button" uiButton size="lg" (click)="search()" [disabled]="loading() || !!originDestinationError()">
            {{ loading() ? 'Buscando...' : 'Buscar vuelos →' }}
          </button>
        </div>
      </section>

      <!-- Filtros y resultados -->
      @if (allFlights().length > 0) {
        <div class="flex flex-col gap-5 lg:flex-row">

          <!-- Panel de filtros -->
          <aside class="w-full shrink-0 space-y-5 self-start rounded-2xl border border-slate-900/[0.06] bg-white p-5 shadow-card lg:sticky lg:top-24 lg:w-72">
            <h3 class="text-lg font-bold text-primary-700">Filtros</h3>

            <!-- Ordenar por -->
            <ui-field label="Ordenar por">
              <select uiInput [(ngModel)]="filters.sortBy">
                <option value="cercania">Cercanía a la fecha</option>
                <option value="precio">Precio</option>
                <option value="duracion">Duración</option>
              </select>
            </ui-field>

            <!-- Precio por persona -->
            <div>
              <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Precio por persona</p>
              <div class="flex gap-2">
                <input uiInput type="number" [(ngModel)]="filters.minPrice" placeholder="Mín" min="0" aria-label="Precio mínimo" />
                <input uiInput type="number" [(ngModel)]="filters.maxPrice" placeholder="Máx" min="0" aria-label="Precio máximo" />
              </div>
            </div>

            <!-- Duración máxima -->
            <div>
              <label for="duracion-max" class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Duración máxima: <span class="normal-case text-primary-700">{{ filters.maxDuration ? (filters.maxDuration | duracion) : 'Cualquiera' }}</span>
              </label>
              <input id="duracion-max" type="range" [(ngModel)]="filters.maxDuration"
                min="0" [max]="maxDurationAvailable()" step="30"
                class="w-full accent-accent-600" />
            </div>

            <!-- Escalas -->
            <fieldset>
              <legend class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Escalas</legend>
              <div class="flex flex-wrap gap-2">
                @for (opt of stopsOptions; track opt.value) {
                  <label class="cursor-pointer">
                    <input type="radio" name="stops" [value]="opt.value" [(ngModel)]="filters.stops" class="peer sr-only" />
                    <span class="inline-block rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition peer-checked:border-primary-700 peer-checked:bg-primary-700 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-primary-500/20">{{ opt.label }}</span>
                  </label>
                }
              </div>
            </fieldset>

            <!-- Aerolínea -->
            @if (airlines().length > 1) {
              <fieldset>
                <legend class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Aerolínea</legend>
                <div class="space-y-2">
                  @for (airline of airlines(); track airline) {
                    <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" [checked]="filters.airlines.includes(airline)"
                        (change)="toggleAirline(airline)"
                        class="h-4 w-4 rounded accent-accent-600" />
                      {{ airline }}
                    </label>
                  }
                </div>
              </fieldset>
            }

            <button type="button" uiButton variant="ghost" size="sm" (click)="resetFilters()">Limpiar filtros</button>
          </aside>

          <!-- Lista de resultados -->
          <div class="flex-1 space-y-4">
            <div>
              <ui-badge tone="brand" [caps]="true">Paso 1 · Vuelos disponibles</ui-badge>
              <h2 class="mt-2 text-2xl font-bold tracking-tight text-primary-700">{{ filteredFlights().length }} vuelo{{ filteredFlights().length !== 1 ? 's' : '' }} disponible{{ filteredFlights().length !== 1 ? 's' : '' }}</h2>
            </div>

            @if (filteredFlights().length === 0) {
              <ui-card>
                <ui-empty-state icon="✈️" title="Sin vuelos con esos filtros"
                  message="No encontramos vuelos cerca de esa fecha. Prueba con otra fecha o quita filtros." />
              </ui-card>
            }

            @for (flight of filteredFlights(); track flight.id) {
              <article class="rounded-2xl border border-slate-900/[0.06] bg-white p-5 shadow-card transition hover:border-accent-500 hover:shadow-raised">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex min-w-0 flex-1 gap-4">
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-xl" aria-hidden="true">✈️</span>
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="font-bold text-primary-700">{{ flight.airline }} · {{ flight.flightNumber }}</p>
                        <ui-badge [tone]="flight.daysFromRequested === 0 ? 'success' : 'warning'">{{ dayLabel(flight.daysFromRequested) }}</ui-badge>
                      </div>
                      <p class="mt-1 text-sm font-medium text-slate-700">
                        {{ flight.origin?.city }} → {{ flight.destination?.city }} ·
                        {{ flight.stops === 0 ? 'Directo' : flight.stops === 1 ? '1 escala' : flight.stops + ' escalas' }}
                      </p>
                      <p class="mt-1 text-xs text-slate-500 tabular-nums">
                        Salida {{ flight.departureDate | date:'dd MMM yyyy, HH:mm':'UTC':'es-PE' }}
                        · Llegada {{ flight.arrivalDate | date:'dd MMM yyyy, HH:mm':'UTC':'es-PE' }}
                        · {{ flight.durationMinutes | duracion }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <div class="sm:text-right">
                      <p class="text-2xl font-extrabold tracking-tight text-primary-700 tabular-nums">S/. {{ flight.totalPrice | number:'1.2-2' }}</p>
                      <p class="text-xs text-slate-500">{{ searchForm.passengers }} pax · {{ flight.classType | label }}</p>
                    </div>
                    <button type="button" uiButton size="sm" (click)="selectFlight(flight)">Seleccionar</button>
                  </div>
                </div>
              </article>
            }
          </div>
        </div>
      }

      @if (searched() && allFlights().length === 0 && !loading()) {
        <ui-card>
          <ui-empty-state icon="✈️" title="No encontramos vuelos"
            message="No hay salidas cerca de esa fecha. Prueba con otra fecha o quita filtros." />
        </ui-card>
      }

      <!-- Recomendaciones (basadas en búsquedas anteriores) -->
      @if (!searched() && recommendations().length > 0) {
        <section>
          <p class="text-[11px] font-bold uppercase tracking-wider text-accent-700">Recomendados</p>
          <h2 class="mt-1 text-2xl font-bold tracking-tight text-primary-700">Porque buscaste {{ busquedaTipos() }}</h2>
          <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (rec of recommendations(); track rec.destination.id) {
              <div class="flex flex-col rounded-2xl border border-slate-900/[0.06] bg-white p-5 shadow-card">
                <p class="text-lg font-bold text-primary-700">{{ rec.destination.city }}</p>
                <p class="text-sm text-slate-500">{{ rec.destination.country }}</p>
                <p class="mt-2 flex-1 text-sm italic text-slate-500">{{ rec.reason }}</p>
                <button type="button" uiButton size="sm" class="mt-4" (click)="armarViaje(rec.destination.id)"
                  [disabled]="armando() === rec.destination.id">
                  {{ armando() === rec.destination.id ? 'Preparando...' : 'Armar mi viaje' }}
                </button>
              </div>
            }
          </div>
        </section>
      }

      <!-- Destinos populares (solo antes de buscar) -->
      @if (!searched()) {
        <section>
          <p class="text-[11px] font-bold uppercase tracking-wider text-accent-700">Inspírate</p>
          <h2 class="mt-1 text-2xl font-bold tracking-tight text-primary-700">Destinos populares</h2>
          <p class="mt-1 text-sm text-slate-500">Elige uno y completa la fecha para ver sus vuelos.</p>
          <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            @for (dest of destinations(); track dest.id) {
              <button type="button" (click)="selectDestination(dest)"
                [attr.aria-pressed]="searchForm.destinationId == dest.id"
                class="group rounded-2xl border bg-white p-4 text-left shadow-card transition hover:shadow-raised"
                [ngClass]="searchForm.destinationId == dest.id ? 'border-accent-500 ring-2 ring-accent-500/30' : 'border-slate-900/[0.06]'">
                <span class="flex items-start justify-between gap-2">
                  <span>
                    <span class="block font-bold text-primary-700">{{ dest.city }}</span>
                    <span class="block text-xs text-slate-500">{{ dest.country }}</span>
                  </span>
                  @if (searchForm.destinationId == dest.id) {
                    <span class="flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-[11px] text-white" aria-hidden="true">✓</span>
                  }
                </span>
                <span class="mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  [ngClass]="{
                    'bg-primary-50 text-primary-700': dest.type === 'PLAYA',
                    'bg-slate-100 text-slate-700': dest.type === 'CIUDAD',
                    'bg-success-50 text-success-700': dest.type === 'AVENTURA',
                    'bg-accent-50 text-accent-700': dest.type === 'CULTURA'
                  }">
                  {{ dest.type | label }}
                </span>
              </button>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class SearchComponent implements OnInit {
  /** Ciudades de origen disponibles (desde donde salen vuelos activos). */
  origins = signal<{ iataCode: string; city: string; country: string }[]>([]);
  /** Todos los destinos disponibles. */
  destinations = signal<any[]>([]);
  /** Vuelos que devolvió la última búsqueda (sin filtrar). */
  allFlights = signal<any[]>([]);
  loading = signal(false);
  searched = signal(false);
  dateError = signal('');
  originDestinationError = signal('');
  passengersError = signal('');
  /** Recomendaciones basadas en señales de búsqueda. */
  recommendations = signal<any[]>([]);
  /** ID del destino cuyo quick-package se está preparando. */
  armando = signal<number | null>(null);

  searchForm = { origin: '', destinationId: '', departureDate: '', passengers: 1 };

  /** No se puede buscar hacia atrás en el tiempo. */
  readonly today = new Date().toISOString().slice(0, 10);

  /** Filtros que se aplican sobre allFlights() en el frontend. */
  filters: {
    sortBy: 'cercania' | 'precio' | 'duracion';
    minPrice: number | null;
    maxPrice: number | null;
    maxDuration: number;
    stops: StopsFilter;
    airlines: string[];
  } = {
    sortBy: 'cercania',
    minPrice: null,
    maxPrice: null,
    maxDuration: 0,
    stops: 'todos',
    airlines: [],
  };

  readonly stopsOptions: { value: StopsFilter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'directo', label: 'Directo' },
    { value: '1', label: '1 escala' },
    { value: '2+', label: '2 o más escalas' },
  ];

  /** Lista de aerolíneas únicas en los resultados actuales. */
  readonly airlines = computed(() => {
    const set = new Set<string>(this.allFlights().map((f: any) => f.airline));
    return Array.from(set).sort();
  });

  /** Duración máxima de los vuelos encontrados (para el rango del slider). */
  readonly maxDurationAvailable = computed(() => {
    const flights = this.allFlights();
    if (!flights.length) return 1440;
    return Math.max(...flights.map((f: any) => f.durationMinutes ?? 0));
  });

  /** Vuelos filtrados y ordenados según los controles del panel. */
  readonly filteredFlights = computed(() => {
    const f = this.filters;
    let list: any[] = [...this.allFlights()];

    // Filtro: precio mínimo por persona
    if (f.minPrice != null && f.minPrice > 0) {
      list = list.filter((fl) => Number(fl.pricePerPerson) >= f.minPrice!);
    }
    // Filtro: precio máximo por persona
    if (f.maxPrice != null && f.maxPrice > 0) {
      list = list.filter((fl) => Number(fl.pricePerPerson) <= f.maxPrice!);
    }
    // Filtro: duración máxima
    if (f.maxDuration > 0) {
      list = list.filter((fl) => (fl.durationMinutes ?? 0) <= f.maxDuration);
    }
    // Filtro: escalas
    if (f.stops === 'directo') list = list.filter((fl) => fl.stops === 0);
    else if (f.stops === '1') list = list.filter((fl) => fl.stops === 1);
    else if (f.stops === '2+') list = list.filter((fl) => fl.stops >= 2);

    // Filtro: aerolínea (si hay alguna marcada)
    if (f.airlines.length > 0) {
      list = list.filter((fl) => f.airlines.includes(fl.airline));
    }

    // Ordenación
    if (f.sortBy === 'precio') {
      list.sort((a, b) => Number(a.pricePerPerson) - Number(b.pricePerPerson));
    } else if (f.sortBy === 'duracion') {
      list.sort((a, b) => (a.durationMinutes ?? 0) - (b.durationMinutes ?? 0));
    }
    // 'cercania': ya viene ordenado por el backend; mantener ese orden

    return list;
  });

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private draftService: PackageDraftService,
    private toast: ToastService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.api.get<{ iataCode: string; city: string; country: string }[]>('destinations/origins').subscribe((data) => {
      this.origins.set(data);
    });

    this.api.get<any[]>('destinations').subscribe((data) => {
      // Excluir el destino que sea igual al origen seleccionado; aquí se cargan todos y se filtra en la vista.
      this.destinations.set(data.filter((d) => d.city !== 'Lima'));
      // Pre-seleccionar el destino si viene desde la página de detalle (US-006)
      const destId = this.route.snapshot.queryParamMap.get('destinationId');
      if (destId) {
        this.searchForm.destinationId = destId;
      }
    });

    // Cargar recomendaciones si hay señales de búsqueda previas
    const signals = this.draftService.getSearchSignals();
    if (signals.viewedDestinationTypes.length > 0) {
      this.cargarRecomendaciones(signals);
    }
  }

  search() {
    // Validar: origen igual a destino
    const selectedDest = this.destinations().find((d) => String(d.id) === String(this.searchForm.destinationId));
    const selectedOrigin = this.origins().find((o) => o.iataCode === this.searchForm.origin);
    if (this.searchForm.origin && this.searchForm.destinationId && selectedOrigin && selectedDest
        && selectedOrigin.city === selectedDest.city) {
      this.originDestinationError.set('El origen y el destino no pueden ser iguales');
      return;
    }
    this.originDestinationError.set('');

    // Validar pasajeros: mínimo 1, máximo 9
    const pax = Number(this.searchForm.passengers);
    if (!pax || pax < 1) {
      this.passengersError.set('La cantidad de pasajeros debe ser al menos 1');
      return;
    }
    this.passengersError.set('');

    // Validar fecha: debe ser hoy o futura
    if (this.searchForm.departureDate && this.searchForm.departureDate < this.today) {
      this.dateError.set('Elige una fecha a partir de hoy.');
      return;
    }
    this.dateError.set('');

    if (!this.searchForm.destinationId || !this.searchForm.departureDate) return;

    this.loading.set(true);
    this.searched.set(false);
    this.allFlights.set([]);

    // Registrar el tipo del destino seleccionado como señal de búsqueda
    if (selectedDest?.type) {
      this.draftService.recordViewedDestinationType(selectedDest.type);
    }

    this.api
      .get<any[]>(`destinations/${this.searchForm.destinationId}/flights`, {
        origin: this.searchForm.origin,
        departureDate: this.searchForm.departureDate,
        passengers: this.searchForm.passengers,
      })
      .subscribe({
        next: (data) => {
          this.allFlights.set(data);
          this.resetFilters();
          // Inicializar el slider de duración al máximo disponible
          const max = data.length ? Math.max(...data.map((f: any) => f.durationMinutes ?? 0)) : 0;
          this.filters.maxDuration = max;
          this.loading.set(false);
          this.searched.set(true);
          // Actualizar recomendaciones con la nueva señal
          const signals = this.draftService.getSearchSignals();
          if (signals.viewedDestinationTypes.length > 0) {
            this.cargarRecomendaciones(signals);
          }
        },
        error: () => {
          this.loading.set(false);
          this.searched.set(true);
        },
      });
  }

  /** Recalcula el error de misma ruta cuando cambia origen o destino. */
  onRouteChange() {
    const selectedDest = this.destinations().find((d) => String(d.id) === String(this.searchForm.destinationId));
    const selectedOrigin = this.origins().find((o) => o.iataCode === this.searchForm.origin);
    if (this.searchForm.origin && this.searchForm.destinationId && selectedOrigin && selectedDest
        && selectedOrigin.city === selectedDest.city) {
      this.originDestinationError.set('El origen y el destino no pueden ser iguales');
    } else {
      this.originDestinationError.set('');
    }
  }

  /** Limpia el error de fecha cuando el usuario cambia la fecha. */
  onDateChange() {
    if (this.searchForm.departureDate && this.searchForm.departureDate < this.today) {
      this.dateError.set('Elige una fecha a partir de hoy.');
    } else {
      this.dateError.set('');
    }
  }

  /** Limpia el error de pasajeros cuando el usuario cambia el valor. */
  onPassengersChange() {
    const pax = Number(this.searchForm.passengers);
    if (!pax || pax < 1) {
      this.passengersError.set('La cantidad de pasajeros debe ser al menos 1');
    } else {
      this.passengersError.set('');
    }
  }

  /** Carga recomendaciones del backend con las señales actuales. */
  private cargarRecomendaciones(signals: { viewedDestinationTypes: string[]; priceRangeFilter: { min: number; max: number } | null }) {
    this.api.post<any[]>('recommendations', { searchSignals: signals }).subscribe({
      next: (data) => this.recommendations.set(data ?? []),
      error: () => {}, // silencioso
    });
  }

  /** Texto que resume los tipos buscados para el encabezado de recomendaciones. */
  busquedaTipos(): string {
    const tipos = this.draftService.getSearchSignals().viewedDestinationTypes;
    const MAP: Record<string, string> = { PLAYA: 'playa', CIUDAD: 'ciudad', AVENTURA: 'aventura', CULTURA: 'cultura' };
    return tipos.map((t) => MAP[t] ?? t.toLowerCase()).join(' y ');
  }

  /** Botón "Armar mi viaje": pide un quick-package y navega al armador. */
  armarViaje(destinationId: number) {
    this.armando.set(destinationId);
    const user = this.auth.currentUser();
    this.api.post<any>('recommendations/quick-package', { destinationId }).subscribe({
      next: (draft) => {
        this.draftService.save({
          ownerId: user?.id ?? null,
          step: 1,
          destinationId: draft.destinationId,
          flightId: draft.flightId,
          returnFlightId: null,
          departureDate: draft.departureDate,
          passengers: 1,
          hotelId: draft.hotelId ?? null,
          checkIn: draft.departureDate,
          checkOut: draft.departureDate,
          activitySelections: (draft.activityIds ?? []).map((id: number) => ({ activityId: id, quantity: 1 })),
          extraIds: [],
          pointsToRedeem: 0,
        });
        this.armando.set(null);
        void this.router.navigate(['/packages/new']);
      },
      error: (err: unknown) => {
        this.armando.set(null);
        this.toast.error(apiErrorMessage(err, 'No pudimos preparar tu viaje'));
      },
    });
  }

  /** Texto de cercanía a la fecha elegida: "Tu fecha", "1 día antes", "2 días después". */
  dayLabel(days: number): string {
    if (!days) return 'Tu fecha';
    const n = Math.abs(days);
    return `${n} ${n === 1 ? 'día' : 'días'} ${days < 0 ? 'antes' : 'después'}`;
  }

  /** Selecciona un destino desde la cuadrícula y registra su tipo como señal. */
  selectDestination(dest: any) {
    this.searchForm.destinationId = dest.id;
    if (dest.type) {
      this.draftService.recordViewedDestinationType(dest.type);
    }
  }

  selectFlight(flight: any) {
    // Guardar el flightId en el draft y navegar al armador.
    // El armador (PackageBuilderComponent) llama a state.start() con los query params.
    const salida = new Date(flight.departureDate);
    const fecha = `${salida.getUTCFullYear()}-${String(salida.getUTCMonth() + 1).padStart(2, '0')}-${String(salida.getUTCDate()).padStart(2, '0')}`;
    this.router.navigate(['/packages/new'], {
      queryParams: {
        flightId: flight.id,
        destinationId: this.searchForm.destinationId,
        departureDate: fecha,
        passengers: this.searchForm.passengers,
        flightPrice: flight.pricePerPerson,
      },
    });
  }

  /** Activa o desactiva una aerolínea del filtro de checkboxes. */
  toggleAirline(airline: string) {
    const idx = this.filters.airlines.indexOf(airline);
    if (idx >= 0) {
      this.filters.airlines = this.filters.airlines.filter((a) => a !== airline);
    } else {
      this.filters.airlines = [...this.filters.airlines, airline];
    }
  }

  /** Vuelve todos los filtros a su estado inicial (sin borrar los resultados). */
  resetFilters() {
    const max = this.allFlights().length
      ? Math.max(...this.allFlights().map((f: any) => f.durationMinutes ?? 0))
      : 0;
    this.filters = {
      sortBy: 'cercania',
      minPrice: null,
      maxPrice: null,
      maxDuration: max,
      stops: 'todos',
      airlines: [],
    };
  }
}
