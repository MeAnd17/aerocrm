import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LabelPipe } from '../../pipes/label.pipe';
import { EmptyStateComponent } from '../../ui';

/**
 * Lista de actividades con filtros (US-008). Se usa en el detalle del destino y en el paso 4 del armador.
 *   <app-activity-list [activities]="lista" [selectable]="true" [selectedIds]="ids" (select)="alternar($event)" />
 */
@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LabelPipe, EmptyStateComponent],
  template: `
    <!-- Filtros -->
    <div class="space-y-3 mb-4">
      <div>
        <p class="text-xs text-gray-500 mb-1">Tipo de actividad</p>
        <div class="flex flex-wrap gap-1">
          @for (t of tiposDisponibles(); track t) {
            <button type="button" (click)="toggleTipo(t)"
              [class.bg-blue-600]="tipos().includes(t)" [class.text-white]="tipos().includes(t)"
              class="px-3 py-1 border rounded-full text-sm">{{ t | etiqueta }}</button>
          }
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Precio mín. por persona</label>
          <input type="number" min="0" [ngModel]="precioMin()" (ngModelChange)="precioMin.set($event)"
            class="w-full border rounded-lg px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Precio máx. por persona</label>
          <input type="number" min="0" [ngModel]="precioMax()" (ngModelChange)="precioMax.set($event)"
            class="w-full border rounded-lg px-2 py-1.5 text-sm" />
        </div>
      </div>
    </div>

    <!-- Resultados -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      @for (act of filtradas(); track act.id) {
        <div (click)="selectable && select.emit(act)"
          [class.cursor-pointer]="selectable"
          [class.ring-2]="selectedIds.includes(act.id)" [class.ring-blue-500]="selectedIds.includes(act.id)"
          class="flex items-start justify-between gap-3 p-3 border rounded-lg hover:border-blue-300 transition">
          <div class="min-w-0">
            <p class="font-medium text-sm text-gray-800">{{ act.name }}</p>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ act.type | etiqueta }}@if (act.durationHours) { · {{ act.durationHours }} h }
            </p>
          </div>
          <div class="text-right shrink-0">
            <p class="font-bold text-blue-900 text-sm">S/ {{ +act.price | number: '1.2-2' }}</p>
            <p class="text-xs text-gray-400">por persona</p>
          </div>
        </div>
      } @empty {
        <div class="sm:col-span-2">
          <ui-empty-state icon="🎯" title="No hay actividades de ese tipo en este destino" />
        </div>
      }
    </div>
  `,
})
export class ActivityListComponent {
  // Entradas: lo que la pantalla que lo usa le pasa
  private readonly actividades = signal<any[]>([]);
  @Input() set activities(lista: any[] | null | undefined) { this.actividades.set(lista ?? []); }
  @Input() selectable = false;
  @Input() selectedIds: number[] = [];
  @Output() select = new EventEmitter<any>();

  // Estado de los filtros
  readonly tipos = signal<string[]>([]);
  readonly precioMin = signal<number | null>(null);
  readonly precioMax = signal<number | null>(null);

  /** Tipos que realmente tiene el destino, para no ofrecer filtros que siempre dan vacío. */
  readonly tiposDisponibles = computed(() =>
    [...new Set(this.actividades().map(a => a.type).filter(Boolean))].sort());

  /** Actividades que pasan todos los filtros, de menor a mayor precio. */
  readonly filtradas = computed(() => {
    const tipos = this.tipos();
    const min = this.precioMin();
    const max = this.precioMax();
    return this.actividades()
      .filter(a => {
        const precio = Number(a.price);
        return (tipos.length === 0 || tipos.includes(a.type))
          && (min == null || precio >= min)
          && (max == null || precio <= max);
      })
      .sort((a, b) => Number(a.price) - Number(b.price));
  });

  toggleTipo(t: string) {
    this.tipos.update(lista => lista.includes(t) ? lista.filter(x => x !== t) : [...lista, t]);
  }
}
