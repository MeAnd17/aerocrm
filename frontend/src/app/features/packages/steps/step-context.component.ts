import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PackageBuilderState } from '../package-builder.state';

/** Paso 2 · Qué pasa en el destino durante el viaje. */
@Component({
  selector: 'app-step-context',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-orange-50 border border-orange-100 rounded-xl p-4">
      <h3 class="font-semibold text-gray-800 mb-2">🌍 En {{ state.context()?.destination?.city }} durante tu viaje</h3>
      @if (state.context()?.festivities?.length) {
        @for (fest of state.context()?.festivities; track fest.id) {
          <p class="text-sm text-orange-700">🎭 {{ fest.name }}</p>
        }
      }
      @if (state.context()?.holidays?.length) {
        @for (h of state.context()?.holidays; track h.name) {
          <p class="text-sm text-blue-700">📅 {{ h.name }} ({{ h.date | date:'dd/MM' }})</p>
        }
      }
      @if (state.context()?.weather) {
        <p class="text-sm text-gray-600 mt-1">🌤️ {{ state.context()?.weather?.forecast?.[0]?.description }}, {{ state.context()?.weather?.forecast?.[0]?.temp_min }}°C - {{ state.context()?.weather?.forecast?.[0]?.temp_max }}°C</p>
      }
    </div>
    <button (click)="state.goTo(3)" class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
      Continuar → Elegir hotel
    </button>
  `,
  host: { class: 'block space-y-5' },
})
export class StepContextComponent {
  readonly state = inject(PackageBuilderState);
}
