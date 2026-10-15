import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent, RatingStarsComponent } from '../../ui';

type Orden = 'precio-asc' | 'precio-desc' | 'estrellas';

/**
 * Lista de hoteles con filtros (US-007). Se usa en el detalle del destino y en el paso 3 del armador.
 *   <app-hotel-list [hotels]="lista" [selectable]="true" [selectedId]="id" [nights]="noches" (select)="elegir($event)" />
 */
@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RatingStarsComponent, EmptyStateComponent],
  template: `
    <!-- Filtros -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <div class="col-span-2">
        <p class="text-xs text-gray-500 mb-1">Categoría</p>
        <div class="flex flex-wrap gap-1">
          @for (n of [3, 4, 5]; track n) {
            <button type="button" (click)="toggleEstrella(n)"
              [class.bg-blue-600]="estrellas().includes(n)" [class.text-white]="estrellas().includes(n)"
              class="px-3 py-1 border rounded-full text-sm">{{ n }} ★</button>
          }
        </div>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Zona</label>
        <select [ngModel]="zona()" (ngModelChange)="zona.set($event)" class="w-full border rounded-lg px-2 py-1.5 text-sm">
          <option value="">Todas</option>
          @for (z of zonas(); track z) { <option [value]="z">{{ z }}</option> }
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Ordenar por</label>
        <select [ngModel]="orden()" (ngModelChange)="orden.set($event)" class="w-full border rounded-lg px-2 py-1.5 text-sm">
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="estrellas">Categoría</option>
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Precio mín. por noche</label>
        <input type="number" min="0" [ngModel]="precioMin()" (ngModelChange)="precioMin.set($event)"
          class="w-full border rounded-lg px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Precio máx. por noche</label>
        <input type="number" min="0" [ngModel]="precioMax()" (ngModelChange)="precioMax.set($event)"
          class="w-full border rounded-lg px-2 py-1.5 text-sm" />
      </div>
    </div>

    <!-- Resultados -->
    <div class="space-y-2">
      @for (hotel of filtrados(); track hotel.id) {
        <div (click)="selectable && select.emit(hotel)"
          [class.cursor-pointer]="selectable"
          [class.ring-2]="hotel.id === selectedId" [class.ring-blue-500]="hotel.id === selectedId"
          class="flex items-center gap-3 p-3 border rounded-lg hover:border-blue-300 transition">
          @if (hotel.imageUrl) {
            <img [src]="hotel.imageUrl" [alt]="hotel.name" class="w-16 h-16 rounded-lg object-cover shrink-0" />
          }
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800">{{ hotel.name }}</p>
            <ui-stars [rating]="hotel.stars" />
            <p class="text-xs text-gray-500">{{ hotel.zone }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="font-bold text-blue-900">S/ {{ +hotel.pricePerNight | number: '1.2-2' }}<span class="text-xs text-gray-400">/noche</span></p>
            @if (nights > 0) {
              <p class="text-xs text-gray-500">Total estadía: S/ {{ +hotel.pricePerNight * nights | number: '1.2-2' }}</p>
            }
          </div>
        </div>
      } @empty {
        <ui-empty-state icon="🏨" title="Ningún hotel coincide con esos filtros" />
      }
    </div>
  `,
})
export class HotelListComponent {
  // Entradas: lo que la pantalla que lo usa le pasa
  private readonly hoteles = signal<any[]>([]);
  @Input() set hotels(lista: any[] | null | undefined) { this.hoteles.set(lista ?? []); }
  @Input() selectable = false;
  @Input() selectedId: number | null = null;
  @Input() nights = 0;
  @Output() select = new EventEmitter<any>();

  // Estado de los filtros
  readonly estrellas = signal<number[]>([]);
  readonly zona = signal('');
  readonly precioMin = signal<number | null>(null);
  readonly precioMax = signal<number | null>(null);
  readonly orden = signal<Orden>('precio-asc');

  /** Zonas distintas que traen los hoteles del destino. */
  readonly zonas = computed(() =>
    [...new Set(this.hoteles().map(h => h.zone).filter(Boolean))].sort());

  /** Hoteles que pasan todos los filtros, ya ordenados. */
  readonly filtrados = computed(() => {
    const est = this.estrellas();
    const zona = this.zona();
    const min = this.precioMin();
    const max = this.precioMax();
    const lista = this.hoteles().filter(h => {
      const precio = Number(h.pricePerNight);
      return (est.length === 0 || est.includes(h.stars))
        && (!zona || h.zone === zona)
        && (min == null || precio >= min)
        && (max == null || precio <= max);
    });
    const orden = this.orden();
    return [...lista].sort((a, b) =>
      orden === 'estrellas' ? b.stars - a.stars
      : orden === 'precio-desc' ? Number(b.pricePerNight) - Number(a.pricePerNight)
      : Number(a.pricePerNight) - Number(b.pricePerNight));
  });

  toggleEstrella(n: number) {
    this.estrellas.update(lista => lista.includes(n) ? lista.filter(x => x !== n) : [...lista, n]);
  }
}