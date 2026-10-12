import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PackageBuilderState } from '../package-builder.state';

/** Paso 1 · Vuelo (ya elegido en el buscador). */
@Component({
  selector: 'app-step-flight',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl border shadow-sm p-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-blue-600 font-semibold text-sm">✈️ Vuelo seleccionado</span>
      </div>
      <p class="font-bold">{{ state.flight()?.airline }} {{ state.flight()?.flightNumber }}</p>
      <p class="text-sm text-gray-500">{{ state.flight()?.origin?.city }} → {{ state.flight()?.destination?.city }}</p>
      <p class="text-sm font-bold text-blue-900 mt-1">S/. {{ state.flightTotal() | number:'1.2-2' }}</p>
    </div>
  `,
})
export class StepFlightComponent {
  readonly state = inject(PackageBuilderState);
}
