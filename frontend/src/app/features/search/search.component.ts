import { Component, OnInit, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

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
        <button (click)="search()" [disabled]="loading()"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
          {{ loading() ? 'Buscando...' : '🔍 Buscar vuelos' }}
        </button>
      </div>

      <!-- Resultados de vuelos -->
      @if (flights().length > 0) {
        <div class="space-y-3">
          <div>
            <h2 class="font-semibold text-gray-800">{{ flights().length }} vuelos disponibles</h2>
            <p class="text-xs text-gray-500">Mostramos salidas hasta 3 días antes y después de la fecha que elegiste.</p>
          </div>
          @for (flight of flights(); track flight.id) {
            <div class="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-bold text-gray-800">{{ flight.airline }} · {{ flight.flightNumber }}</p>
                  <span class="inline-block mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium"
                    [class.bg-green-100]="flight.daysFromRequested === 0" [class.text-green-700]="flight.daysFromRequested === 0"
                    [class.bg-amber-50]="flight.daysFromRequested !== 0" [class.text-amber-700]="flight.daysFromRequested !== 0">
                    {{ dayLabel(flight.daysFromRequested) }}
                  </span>
                  <p class="text-sm text-gray-500">
                    {{ flight.origin?.city }} → {{ flight.destination?.city }} ·
                    {{ flight.stops === 0 ? 'Directo' : flight.stops + ' escala(s)' }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ flight.departureDate | date:'dd MMM yyyy, HH:mm' }}
                    · {{ flight.durationMinutes | duracion }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-xl font-bold text-blue-900">S/. {{ flight.totalPrice | number:'1.2-2' }}</p>
                  <p class="text-xs text-gray-400">{{ searchForm.passengers }} pax · {{ flight.classType | etiqueta }}</p>
                  <button (click)="selectFlight(flight)"
                    class="mt-2 bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition">
                    Seleccionar
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (searched() && flights().length === 0 && !loading()) {
        <div class="text-center py-10 text-gray-400">
          <p class="text-4xl mb-3">✈️</p>
          <p>No encontramos vuelos entre 3 días antes y 3 días después de esa fecha</p>
          <p class="text-sm mt-1">Prueba con otra fecha u otro destino.</p>
        </div>
      }

      <!-- Todos los destinos -->
      @if (!searched()) {
        <div>
          <h2 class="font-semibold text-gray-800 mb-3">Destinos populares</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            @for (dest of destinations(); track dest.id) {
              <button (click)="searchForm.destinationId = dest.id"
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
                  {{ dest.type | etiqueta }}
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
  destinations = signal<any[]>([]);
  flights = signal<any[]>([]);
  loading = signal(false);
  searched = signal(false);

  searchForm = { origin: 'LIM', destinationId: '', departureDate: '', passengers: 1 };
  /** No se puede buscar hacia atrás en el tiempo. */
  readonly today = new Date().toISOString().slice(0, 10);

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.get<any[]>('destinations').subscribe(data => this.destinations.set(data));
  }

  search() {
    if (!this.searchForm.destinationId || !this.searchForm.departureDate) return;
    this.loading.set(true);
    this.searched.set(false);
    this.api.get<any[]>(`destinations/${this.searchForm.destinationId}/flights`, {
      origin: this.searchForm.origin,
      departureDate: this.searchForm.departureDate,
      passengers: this.searchForm.passengers,
    }).subscribe({
      next: (data) => { this.flights.set(data); this.loading.set(false); this.searched.set(true); },
      error: () => { this.loading.set(false); this.searched.set(true); },
    });
  }

  /** Texto de cercanía a la fecha elegida: "Tu fecha", "1 día antes", "2 días después". */
  dayLabel(days: number): string {
    if (!days) return 'Tu fecha';
    const n = Math.abs(days);
    return `${n} ${n === 1 ? 'día' : 'días'} ${days < 0 ? 'antes' : 'después'}`;
  }

  selectFlight(flight: any) {
    // El armador arranca con la fecha real del vuelo elegido (puede no ser la que se buscó).
    const salida = new Date(flight.departureDate);
    const fecha = `${salida.getFullYear()}-${String(salida.getMonth() + 1).padStart(2, '0')}-${String(salida.getDate()).padStart(2, '0')}`;
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
}
