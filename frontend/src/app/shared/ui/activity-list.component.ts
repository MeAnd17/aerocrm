import { Component, EventEmitter, Input, OnChanges, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LabelPipe } from '../pipes/label.pipe';
import { EmptyStateComponent } from './empty-state.component';

/**
 * Lista filtrable de actividades (US-008, US-014).
 * Se usa en el detalle del destino y en el paso de actividades del armador.
 *
 *   <app-activity-list [activities]="list"
 *     [selectedIds]="ids"
 *     [activitySelections]="selections"
 *     [maxQuantity]="passengers"
 *     (activityToggle)="state.toggleActivity($event)"
 *     (quantityChange)="state.setActivityQuantity($event)" />
 *
 * Cuando maxQuantity > 0, se muestra un selector de cantidad en cada
 * actividad seleccionada (US-014: 1 … passengers).
 */
@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LabelPipe, EmptyStateComponent],
  template: `
    <!-- Filtros -->
    <div class="mb-4 space-y-3">
      <!-- Tipos (selección múltiple) -->
      <div class="flex flex-wrap gap-2 items-center">
        <span class="text-xs text-slate-500 font-medium">Tipo:</span>
        @for (tipo of activityTypes; track tipo) {
          <button type="button"
            (click)="toggleType(tipo)"
            [class.bg-primary-600]="typeFilters().includes(tipo)"
            [class.text-white]="typeFilters().includes(tipo)"
            [class.border-primary-600]="typeFilters().includes(tipo)"
            class="px-2 py-0.5 border rounded-full text-xs font-medium transition">
            {{ tipo | label }}
          </button>
        }
      </div>

      <!-- Precio -->
      <div class="flex items-center gap-1">
        <label class="text-xs text-slate-500">Precio:</label>
        <input type="number" min="0" placeholder="Mín"
          [ngModel]="minPrice()" (ngModelChange)="minPrice.set($event ?? null)"
          class="w-20 text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <span class="text-xs text-slate-400">–</span>
        <input type="number" min="0" placeholder="Máx"
          [ngModel]="maxPrice()" (ngModelChange)="maxPrice.set($event ?? null)"
          class="w-20 text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
    </div>

    <!-- Resultados -->
    @if (filteredActivities().length === 0) {
      <ui-empty-state icon="🎯" title="No hay actividades de ese tipo en este destino" />
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        @for (act of filteredActivities(); track act.id) {
          <div
            [class.ring-2]="selectedIds.includes(act.id)"
            [class.ring-primary-500]="selectedIds.includes(act.id)"
            class="p-3 border rounded-xl hover:border-primary-300 transition">

            <!-- Cabecera: click para toggle -->
            <div (click)="activityToggle.emit(act)" class="cursor-pointer">
              <p class="font-medium text-sm text-slate-800">{{ act.name }}</p>
              <p class="text-xs text-slate-500 mt-0.5">{{ act.type | label }} · {{ act.durationHours }}h</p>
              <p class="text-sm font-bold text-primary-900 mt-1">
                S/. {{ act.price }}
                <span class="text-xs text-slate-400 font-normal">por persona</span>
              </p>
            </div>

            <!-- Selector de cantidad (solo cuando está seleccionada y hay más de 1 pasajero) -->
            @if (selectedIds.includes(act.id) && maxQuantity > 1) {
              <div class="mt-2 flex items-center gap-2" (click)="$event.stopPropagation()">
                <span class="text-xs text-slate-500">Personas:</span>
                <div class="flex items-center gap-1">
                  <button type="button"
                    (click)="adjustQuantity(act.id, -1)"
                    [disabled]="getQuantity(act.id) <= 1"
                    class="w-6 h-6 rounded-full border text-slate-600 flex items-center justify-center text-sm font-bold
                           disabled:opacity-30 hover:enabled:bg-slate-100 transition">−</button>
                  <span class="w-6 text-center text-sm font-semibold text-slate-800">{{ getQuantity(act.id) }}</span>
                  <button type="button"
                    (click)="adjustQuantity(act.id, +1)"
                    [disabled]="getQuantity(act.id) >= maxQuantity"
                    class="w-6 h-6 rounded-full border text-slate-600 flex items-center justify-center text-sm font-bold
                           disabled:opacity-30 hover:enabled:bg-slate-100 transition">+</button>
                </div>
                <span class="text-xs text-slate-400">/ {{ maxQuantity }}</span>
              </div>
            }

          </div>
        }
      </div>
    }
  `,
})
export class ActivityListComponent implements OnChanges {
  @Input() activities: any[] = [];
  @Input() selectedIds: number[] = [];
  /** Selecciones con cantidad (del estado del armador). */
  @Input() activitySelections: { activityId: number; quantity: number }[] = [];
  /** Máximo de personas seleccionables (= pasajeros del viaje). 0 = sin selector. */
  @Input() maxQuantity = 0;
  @Output() activityToggle = new EventEmitter<any>();
  /** Emitido cuando cambia la cantidad de personas para una actividad ya seleccionada. */
  @Output() quantityChange = new EventEmitter<{ activityId: number; quantity: number }>();

  readonly typeFilters = signal<string[]>([]);
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);

  /** Lista interna reactiva (se actualiza en ngOnChanges). */
  private readonly _activities = signal<any[]>([]);

  readonly activityTypes = ['AVENTURA', 'CULTURAL', 'GASTRONOMICO', 'FAMILIAR', 'RELAX', 'DEPORTIVO'];

  readonly filteredActivities = computed(() => {
    let list = this._activities();
    const types = this.typeFilters();
    if (types.length > 0) list = list.filter(a => types.includes(a.type));
    const min = this.minPrice();
    if (min !== null) list = list.filter(a => a.price >= min);
    const max = this.maxPrice();
    if (max !== null) list = list.filter(a => a.price <= max);
    return list;
  });

  ngOnChanges() {
    this._activities.set(this.activities ?? []);
  }

  toggleType(tipo: string) {
    const curr = this.typeFilters();
    this.typeFilters.set(curr.includes(tipo) ? curr.filter(t => t !== tipo) : [...curr, tipo]);
  }

  /** Devuelve la cantidad elegida para una actividad, o 1 si no hay selección. */
  getQuantity(activityId: number): number {
    return this.activitySelections.find(s => s.activityId === activityId)?.quantity ?? 1;
  }

  adjustQuantity(activityId: number, delta: number) {
    const current = this.getQuantity(activityId);
    const next = Math.max(1, Math.min(this.maxQuantity, current + delta));
    if (next !== current) {
      this.quantityChange.emit({ activityId, quantity: next });
    }
  }
}
