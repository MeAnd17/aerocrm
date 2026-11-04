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
      <h3 class="font-semibold text-gray-800 mb-1">🎯 Actividades <span class="text-gray-400 font-normal text-sm">(opcional)</span></h3>
      <p class="text-xs text-gray-500 mb-3">
        Selecciona las actividades y elige cuántas personas participan (máx. {{ state.passengers() }}).
      </p>

      <app-activity-list
        [activities]="state.context()?.activities ?? []"
        [selectedIds]="selectedActivityIds()"
        [activitySelections]="state.activitySelections()"
        [maxQuantity]="state.passengers()"
        (activityToggle)="state.toggleActivity($event)"
        (quantityChange)="state.setActivityQuantity($event)"
      />

      <div class="flex gap-3 mt-4">
        <button
          (click)="state.goTo(5)"
          class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition text-sm">
          Continuar
        </button>
        <button
          (click)="skipActivities()"
          class="text-sm text-gray-400 px-3 hover:text-gray-600 transition">
          Continuar sin actividades
        </button>
      </div>
    </div>
  `,
})
export class StepActivitiesComponent {
  readonly state = inject(PackageBuilderState);
  readonly selectedActivityIds = computed(() => this.state.activitySelections().map(s => s.activityId));

  skipActivities() {
    this.state.activities.set([]);
    this.state.activitySelections.set([]);
    this.state.goTo(5);
  }
}
