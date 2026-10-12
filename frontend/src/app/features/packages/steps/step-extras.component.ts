import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PackageBuilderState } from '../package-builder.state';

/** Paso 5 · Extras (opcional). */
@Component({
  selector: 'app-step-extras',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-xl border shadow-sm p-5">
      <h3 class="font-semibold text-gray-800 mb-3">➕ Extras <span class="text-gray-400 font-normal text-sm">(opcional)</span></h3>
      <div class="space-y-2 mb-3">
        @for (extra of extraOptions; track extra.type) {
          <div (click)="state.toggleExtra(extra)"
            [class.ring-2]="state.isExtraSelected(extra.type)"
            [class.ring-blue-500]="state.isExtraSelected(extra.type)"
            class="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition">
            <p class="font-medium text-sm">{{ extra.label }}</p>
            <p class="font-bold text-blue-900 text-sm">S/. {{ extra.price }}</p>
          </div>
        }
      </div>
      <button (click)="state.goTo(6)" class="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition text-sm">
        Ver resumen
      </button>
    </div>
  `,
})
export class StepExtrasComponent {
  readonly state = inject(PackageBuilderState);

  // Pendiente (deuda heredada, ver docs/HEREDADO.md): precios escritos en la pantalla.
  // El catálogo con precio ya existe en la base (ExtraOption, TS-014); falta el servicio que lo exponga.
  readonly extraOptions = [
    { type: 'TRASLADO_COMPLETO', label: '🚌 Traslados ida y vuelta', price: 80 },
    { type: 'SEGURO_VIAJE', label: '🛡️ Seguro de viaje', price: 45 },
  ];
}
