import { Component, EventEmitter, Input, OnChanges, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LabelPipe } from '../pipes/label.pipe';
import { RatingStarsComponent } from './rating-stars.component';
import { EmptyStateComponent } from './empty-state.component';

/**
 * Lista filtrable de hoteles (US-007).
 * Se usa en el detalle del destino y en el paso de hotel del armador.
 *
 *   <app-hotel-list [hotels]="list" [checkIn]="ci" [checkOut]="co"
 *     [selected]="hotel" (hotelSelect)="state.toggleHotel($event)" />
 */
@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LabelPipe, RatingStarsComponent, EmptyStateComponent],
  template: `
    <!-- Filtros -->
    <div class="mb-4 space-y-3">
      <!-- Estrellas (selección múltiple) -->
      <div class="flex flex-wrap gap-2 items-center">
        <span class="text-xs text-gray-500 font-medium">Categoría:</span>
        @for (star of allStars; track star) {
          <button type="button"
            (click)="toggleStar(star)"
            [class.bg-amber-400]="starFilters().includes(star)"
            [class.text-white]="starFilters().includes(star)"
            [class.border-amber-400]="starFilters().includes(star)"
            class="px-2 py-0.5 border rounded-full text-xs font-medium transition">
            {{ '★'.repeat(star) }}
          </button>
        }
      </div>

      <div class="flex flex-wrap gap-3">
        <!-- Zona -->
        @if (zonas().length > 1) {
          <div class="flex items-center gap-1">
            <label class="text-xs text-gray-500">Zona:</label>
            <select [ngModel]="zoneFilter()" (ngModelChange)="zoneFilter.set($event)"
              class="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Todas</option>
              @for (z of zonas(); track z) {
                <option [value]="z">{{ z }}</option>
              }
            </select>
          </div>
        }

        <!-- Precio -->
        <div class="flex items-center gap-1">
          <label class="text-xs text-gray-500">Precio:</label>
          <input type="number" min="0" placeholder="Mín"
            [ngModel]="minPrice()" (ngModelChange)="minPrice.set($event ?? null)"
            class="w-20 text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <span class="text-xs text-gray-400">–</span>
          <input type="number" min="0" placeholder="Máx"
            [ngModel]="maxPrice()" (ngModelChange)="maxPrice.set($event ?? null)"
            class="w-20 text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <!-- Ordenar -->
        <div class="flex items-center gap-1">
          <label class="text-xs text-gray-500">Ordenar:</label>
          <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)"
            class="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="price">Precio</option>
            <option value="stars">Categoría</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Resultados -->
    @if (filteredHotels().length === 0) {
      <ui-empty-state icon="🏨" title="Ningún hotel coincide con esos filtros" />
    } @else {
      <div class="space-y-3">
        @for (hotel of filteredHotels(); track hotel.id) {
          <div (click)="hotelSelect.emit(hotel)"
            [class.ring-2]="selected && selected.id === hotel.id"
            [class.ring-blue-500]="selected && selected.id === hotel.id"
            [class.cursor-pointer]="hotelSelect.observed"
            class="flex gap-3 border rounded-xl overflow-hidden hover:border-blue-300 transition">
            <!-- Imagen -->
            @if (hotel.imageUrl) {
              <img [src]="hotel.imageUrl" [alt]="hotel.name"
                class="w-24 h-24 object-cover flex-shrink-0" />
            } @else {
              <div class="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <span class="text-2xl">🏨</span>
              </div>
            }
            <!-- Info -->
            <div class="flex-1 p-3 min-w-0">
              <p class="font-semibold text-gray-800 text-sm truncate">{{ hotel.name }}</p>
              <p class="text-xs text-gray-500">{{ hotel.zone }}</p>
              <ui-stars [rating]="hotel.stars" class="mt-1" />
              <div class="mt-1 flex flex-wrap items-baseline gap-3">
                <span class="font-bold text-blue-900 text-sm">S/. {{ hotel.pricePerNight }}<span class="text-xs text-gray-400">/noche</span></span>
                @if (nights() > 0) {
                  <span class="text-xs text-gray-500">Total: S/. {{ hotel.pricePerNight * nights() }}</span>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class HotelListComponent implements OnChanges {
  @Input() hotels: any[] = [];
  @Input() checkIn: string | null = null;
  @Input() checkOut: string | null = null;
  @Input() selected: any = null;
  @Output() hotelSelect = new EventEmitter<any>();

  readonly starFilters = signal<number[]>([]);
  readonly zoneFilter = signal('');
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);
  readonly sortBy = signal<'price' | 'stars'>('price');

  /** Lista interna reactiva (se actualiza en ngOnChanges). */
  private readonly _hotels = signal<any[]>([]);

  readonly zonas = computed(() => {
    const seen = new Set<string>();
    for (const h of this._hotels()) {
      if (h.zone) seen.add(h.zone);
    }
    return Array.from(seen).sort();
  });

  readonly filteredHotels = computed(() => {
    let list = this._hotels();
    const stars = this.starFilters();
    if (stars.length > 0) list = list.filter(h => stars.includes(h.stars));
    const zone = this.zoneFilter();
    if (zone) list = list.filter(h => h.zone === zone);
    const min = this.minPrice();
    if (min !== null) list = list.filter(h => h.pricePerNight >= min);
    const max = this.maxPrice();
    if (max !== null) list = list.filter(h => h.pricePerNight <= max);
    const sort = this.sortBy();
    if (sort === 'price') list = [...list].sort((a, b) => a.pricePerNight - b.pricePerNight);
    else list = [...list].sort((a, b) => b.stars - a.stars);
    return list;
  });

  readonly nights = computed(() => {
    if (!this.checkIn || !this.checkOut) return 0;
    const ms = new Date(this.checkOut).getTime() - new Date(this.checkIn).getTime();
    return Math.max(0, Math.round(ms / 86400000));
  });

  readonly allStars = [1, 2, 3, 4, 5];

  ngOnChanges() {
    this._hotels.set(this.hotels ?? []);
  }

  toggleStar(star: number) {
    const curr = this.starFilters();
    this.starFilters.set(curr.includes(star) ? curr.filter(s => s !== star) : [...curr, star]);
  }
}
