import { Component, inject } from '@angular/core';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { PackageBuilderState } from '../package-builder.state';

/** Paso 4 · Actividades (opcional). */
@Component({
  selector: 'app-step-activities',
  standalone: true,
  imports: [CommonModule, LabelPipe],
  template: `
    <div class="bg-white rounded-xl border shadow-sm p-5">
      <h3 class="font-semibold text-gray-800 mb-3">🎯 Actividades <span class="text-gray-400 font-normal text-sm">(opcional)</span></h3>
      <div class="space-y-2 mb-3">
        @for (act of state.context()?.activities; track act.id) {
          <div (click)="state.toggleActivity(act)"
            [class.ring-2]="state.isActivitySelected(act.id)"
            [class.ring-blue-500]="state.isActivitySelected(act.id)"
            class="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition">
            <div>
              <p class="font-medium text-sm">{{ act.name }}</p>
              <p class="text-xs text-gray-500">{{ act.type | label }} · {{ act.durationHours }}h</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-blue-900 text-sm">S/. {{ act.price }}</p>
              <p class="text-xs text-gray-400">por persona</p>
            </div>
          </div>
        }
      </div>
      <div class="flex gap-3">
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
}
