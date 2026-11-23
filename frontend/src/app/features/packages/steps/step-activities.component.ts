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
    <div class="bg-white rounded-2xl border border-slate-900/[0.06] shadow-card p-5">
      <h3 class="font-bold text-primary-700 mb-1">🎯 Actividades <span class="text-slate-400 font-normal text-sm">(opcional)</span></h3>
      <p class="text-xs text-slate-500 mb-3">
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

      <div class="flex flex-wrap gap-3 mt-4">
        <button
          (click)="state.goTo(5)"
          class="flex-1 bg-accent-600 text-white py-2.5 rounded-full font-semibold hover:bg-accent-700 transition text-sm min-w-[12rem]">
          Continuar
        </button>
        <button
          (click)="skipActivities()"
          class="text-sm text-slate-400 px-3 hover:text-slate-600 transition">
          Continuar sin actividades
        </button>
        <button
          (click)="state.goTo(3)"
          class="text-sm text-slate-400 px-3 hover:text-slate-600 transition">
          ← Volver
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
