import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PackageBuilderState } from '../package-builder.state';
import { ActivityListComponent } from '../../../shared/ui/activity-list.component';

/** Paso 4 · Actividades (opcional). */
@Component({
  selector: 'app-step-activities',
  standalone: true,
  imports: [CommonModule, ActivityListComponent],
  template: `
    <div class="bg-white rounded-xl border shadow-sm p-5">
      <h3 class="font-semibold text-gray-800 mb-3">🎯 Actividades <span class="text-gray-400 font-normal text-sm">(opcional)</span></h3>

      <app-activity-list
        [activities]="state.context()?.activities ?? []"
        [selectedIds]="selectedActivityIds()"
        (activityToggle)="state.toggleActivity($event)"
      />

      <div class="flex gap-3 mt-3">
        <button (click)="state.goTo(5)" class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition text-sm">
          Continuar
        </button>
        <button (click)="state.activities.set([]); state.goTo(5)" class="text-sm text-gray-400 px-3">Omitir</button>
      </div>
    </div>
  `,
})
export class StepActivitiesComponent {
  readonly state = inject(PackageBuilderState);
  readonly selectedActivityIds = computed(() => this.state.activities().map(a => a.id));
}
