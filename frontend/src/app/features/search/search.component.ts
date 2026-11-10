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

/** Opciones de filtro de escala. */
type StopsFilter = 'todos' | 'directo' | '1' | '2+';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, LabelPipe, DurationPipe],
  template: `
    <div class="space-y-6">
      <div class="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white">
        <h1 class="text-2xl font-bold mb-1">Busca tu destino</h1>
        <p class="text-blue-200 text-sm">Encuentra vuelos, hoteles y actividades en un solo lugar</p>
      </div>

      <!-- Formulario de búsqueda -->
      <div class="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Origen</label>
            <input type="text" [(ngModel)]="searchForm.origin" placeholder="Lima (LIM)"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Destino</label>
            <select [(ngModel)]="searchForm.destinationId"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecciona un destino</option>
              @for (dest of destinations(); track dest.id) {
                <option [value]="dest.id">{{ dest.city }}, {{ dest.country }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de salida</label>
            <input type="date" [(ngModel)]="searchForm.departureDate" [min]="today"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Pasajeros</label>
            <input type="number" [(ngModel)]="searchForm.passengers" min="1" max="9"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        @if (dateError()) {
          <p class="text-sm text-red-600">{{ dateError() }}</p>
        }
        <button (click)="search()" [disabled]="loading()"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
          {{ loading() ? 'Buscando...' : '🔍 Buscar vuelos' }}
        </button>
      </div>

      <!-- Filtros y resultados -->
      @if (allFlights().length > 0) {
        <div class="flex flex-col lg:flex-row gap-4">

          <!-- Panel de filtros -->
          <aside class="w-full lg:w-64 shrink-0 bg-white rounded-xl border shadow-sm p-4 space-y-5 self-start">
            <h3 class="font-semibold text-gray-800">Filtros</h3>

            <!-- Ordenar por -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Ordenar por</label>
              <select [(ngModel)]="filters.sortBy"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="cercania">Cercanía a la fecha</option>
                <option value="precio">Precio</option>
                <option value="duracion">Duración</option>
              </select>
            </div>

            <!-- Precio por persona -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Precio por persona</label>
              <div class="flex gap-2">
                <input type="number" [(ngModel)]="filters.minPrice" placeholder="Mín" min="0"
                  class="w-1/2 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" [(ngModel)]="filters.maxPrice" placeholder="Máx" min="0"
                  class="w-1/2 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <!-- Duración máxima -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                Duración máxima: {{ filters.maxDuration ? (filters.maxDuration | duracion) : 'Cualquiera' }}
              </label>
              <input type="range" [(ngModel)]="filters.maxDuration"
                min="0" [max]="maxDurationAvailable()" step="30"
                class="w-full accent-blue-600" />
            </div>

            <!-- Escalas -->
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Escalas</label>
              <div class="space-y-1">
                @for (opt of stopsOptions; track opt.value) {
                  <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="stops" [value]="opt.value" [(ngModel)]="filters.stops"
                      class="accent-blue-600" />
                    {{ opt.label }}
                  </label>
                }
              </div>
            </div>

            <!-- Aerolínea -->
            @if (airlines().length > 1) {
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Aerolínea</label>
                <div class="space-y-1">
                  @for (airline of airlines(); track airline) {
                    <label class="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" [checked]="filters.airlines.includes(airline)"
                        (change)="toggleAirline(airline)"
                        class="accent-blue-600 rounded" />
                      {{ airline }}
                    </label>
                  }
                </div>
              </div>
            }

            <button (click)="resetFilters()"
              class="w-full text-sm text-blue-600 hover:underline text-left">
              Limpiar filtros
            </button>
          </aside>

          <!-- Lista de resultados -->
          <div class="flex-1 space-y-3">
            <div>
              <h2 class="font-semibold text-gray-800">{{ filteredFlights().length }} vuelo{{ filteredFlights().length !== 1 ? 's' : '' }} disponible{{ filteredFlights().length !== 1 ? 's' : '' }}</h2>
              <p class="text-xs text-gray-500">Mostramos salidas hasta 3 días antes y después de la fecha que elegiste.</p>
            </div>

            @if (filteredFlights().length === 0) {
              <div class="text-center py-10 text-gray-400">
                <p class="text-4xl mb-3">✈️</p>
                <p>No encontramos vuelos cerca de esa fecha. Prueba con otra fecha o quita filtros.</p>
              </div>
            }

            @for (flight of filteredFlights(); track flight.id) {
              <div class="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-gray-800">{{ flight.airline }} · {{ flight.flightNumber }}</p>
                    <span class="inline-block mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      [class.bg-green-100]="flight.daysFromRequested === 0"
                      [class.text-green-700]="flight.daysFromRequested === 0"
                      [class.bg-amber-50]="flight.daysFromRequested !== 0"
                      [class.text-amber-700]="flight.daysFromRequested !== 0">
                      {{ dayLabel(flight.daysFromRequested) }}
                    </span>
                    <p class="text-sm text-gray-500 mt-1">
                      {{ flight.origin?.city }} → {{ flight.destination?.city }} ·
                      {{ flight.stops === 0 ? 'Directo' : flight.stops === 1 ? '1 escala' : flight.stops + ' escalas' }}
                    </p>
                    <p class="text-xs text-gray-400 mt-1">
                      Salida: {{ flight.departureDate | date:'dd MMM yyyy, HH:mm':'UTC':'es-PE' }}
                    </p>
                    <p class="text-xs text-gray-400">
                      Llegada: {{ flight.arrivalDate | date:'dd MMM yyyy, HH:mm':'UTC':'es-PE' }}
                      · {{ flight.durationMinutes | duracion }}
                    </p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-xl font-bold text-blue-900">S/. {{ flight.totalPrice | number:'1.2-2' }}</p>
                    <p class="text-xs text-gray-400">{{ searchForm.passengers }} pax · {{ flight.classType | label }}</p>
                    <button (click)="selectFlight(flight)"
                      class="mt-2 bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition">
                      Seleccionar
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (searched() && allFlights().length === 0 && !loading()) {
        <div class="text-center py-10 text-gray-400">
          <p class="text-4xl mb-3">✈️</p>
          <p>No encontramos vuelos cerca de esa fecha. Prueba con otra fecha o quita filtros.</p>
        </div>
      }

      <!-- Recomendaciones (basadas en búsquedas anteriores) -->
      @if (!searched() && recommendations().length > 0) {
        <div class="bg-white rounded-xl shadow-sm border p-5">
          <h2 class="font-semibold text-gray-800 mb-3">
            Porque buscaste {{ busquedaTipos() }}
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            @for (rec of recommendations(); track rec.destination.id) {
              <div class="border rounded-xl p-3 space-y-2">
                <div>
                  <p class="font-medium text-sm text-gray-800">{{ rec.destination.city }}</p>
                  <p class="text-xs text-gray-500">{{ rec.destination.country }}</p>
                  <p class="text-xs text-gray-400 italic mt-0.5">{{ rec.reason }}</p>
                </div>
                <button (click)="armarViaje(rec.destination.id)"
                  [disabled]="armando() === rec.destination.id"
                  class="w-full bg-blue-600 text-white text-xs py-1.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                  {{ armando() === rec.destination.id ? 'Preparando...' : 'Armar mi viaje' }}
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Destinos populares (solo antes de buscar) -->
      @if (!searched()) {
        <div>
          <h2 class="font-semibold text-gray-800 mb-3">Destinos populares</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            @for (dest of destinations(); track dest.id) {
              <button (click)="selectDestination(dest)"
                [class.ring-2]="searchForm.destinationId == dest.id"
                [class.ring-blue-500]="searchForm.destinationId == dest.id"
                class="bg-white border rounded-xl p-3 text-left hover:border-blue-300 transition">
                <p class="font-medium text-sm text-gray-800">{{ dest.city }}</p>
                <p class="text-xs text-gray-500">{{ dest.country }}</p>
                <span class="text-xs mt-1 inline-block px-2 py-0.5 rounded-full"
                  [ngClass]="{
                    'bg-blue-100 text-blue-700': dest.type === 'PLAYA',
                    'bg-gray-100 text-gray-700': dest.type === 'CIUDAD',
                    'bg-green-100 text-green-700': dest.type === 'AVENTURA',
                    'bg-yellow-100 text-yellow-700': dest.type === 'CULTURA'
                  }">
                  {{ dest.type | label }}
                </span>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class SearchComponent implements OnInit {
  /** Todos los destinos disponibles (sin el origen Lima). */
  destinations = signal<any[]>([]);
  /** Vuelos que devolvió la última búsqueda (sin filtrar). */
  allFlights = signal<any[]>([]);
  loading = signal(false);
  searched = signal(false);
  dateError = signal('');
  /** Recomendaciones basadas en señales de búsqueda. */
  recommendations = signal<any[]>([]);
  /** ID del destino cuyo quick-package se está preparando. */
  armando = signal<number | null>(null);

  searchForm = { origin: 'LIM', destinationId: '', departureDate: '', passengers: 1 };

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
    this.api.get<any[]>('destinations').subscribe((data) => {
      // Criterio 1: excluir Lima (origen) de la lista de destinos disponibles
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
    const selectedDest = this.destinations().find((d) => String(d.id) === String(this.searchForm.destinationId));
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
