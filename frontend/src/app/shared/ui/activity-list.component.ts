import { Component, EventEmitter, Input, OnChanges, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LabelPipe } from '../pipes/label.pipe';
import { EmptyStateComponent } from './empty-state.component';

/**
 * Lista filtrable de actividades (US-008).
 * Se usa en el detalle del destino y en el paso de actividades del armador.
 *
 *   <app-activity-list [activities]="list"
 *     [selectedIds]="ids" (activityToggle)="state.toggleActivity($event)" />
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
        <span class="text-xs text-gray-500 font-medium">Tipo:</span>
        @for (tipo of activityTypes; track tipo) {
          <button type="button"
            (click)="toggleType(tipo)"
            [class.bg-blue-600]="typeFilters().includes(tipo)"
            [class.text-white]="typeFilters().includes(tipo)"
            [class.border-blue-600]="typeFilters().includes(tipo)"
            class="px-2 py-0.5 border rounded-full text-xs font-medium transition">
            {{ tipo | etiqueta }}
          </button>
        }
      </div>

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
    </div>

    <!-- Resultados -->
    @if (filteredActivities().length === 0) {
      <ui-empty-state icon="🎯" title="No hay actividades de ese tipo en este destino" />
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        @for (act of filteredActivities(); track act.id) {
          <div (click)="activityToggle.emit(act)"
            [class.ring-2]="selectedIds.includes(act.id)"
            [class.ring-blue-500]="selectedIds.includes(act.id)"
            [class.cursor-pointer]="activityToggle.observed"
            class="p-3 border rounded-xl hover:border-blue-300 transition">
            <p class="font-medium text-sm text-gray-800">{{ act.name }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ act.type | etiqueta }} · {{ act.durationHours }}h</p>
            <p class="text-sm font-bold text-blue-900 mt-1">S/. {{ act.price }} <span class="text-xs text-gray-400 font-normal">por persona</span></p>
          </div>
        }
      </div>
    }
  `,
})
export class ActivityListComponent implements OnChanges {
  @Input() activities: any[] = [];
  @Input() selectedIds: number[] = [];
  @Output() activityToggle = new EventEmitter<any>();

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
}
