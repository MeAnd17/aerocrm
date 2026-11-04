import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PackageBuilderState } from '../package-builder.state';

/** Paso 2 · Contexto del destino: festividades, feriados y clima entre las fechas del viaje. */
@Component({
  selector: 'app-step-context',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-4">
      <!-- Encabezado con fechas del viaje -->
      <div>
        <h3 class="font-semibold text-gray-800 text-base">
          🌍 {{ state.context()?.destination?.city }} durante tu viaje
        </h3>
        <p class="text-xs text-gray-500 mt-0.5">
          {{ departureDateDisplay() }}
          @if (returnDateDisplay()) { – {{ returnDateDisplay() }} }
        </p>
      </div>

      <!-- Festividades -->
      <div>
        <p class="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">Festividades</p>
        @if (festividades().length > 0) {
          @for (fest of festividades(); track fest.id) {
            <div class="flex items-start gap-1">
              <span class="text-orange-500 mt-0.5">🎭</span>
              <p class="text-sm text-orange-800">{{ fest.name }}</p>
            </div>
          }
        } @else {
          <p class="text-sm text-gray-500 italic">No hay festividades en tus fechas.</p>
        }
      </div>

      <!-- Feriados nacionales -->
      <div>
        <p class="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Feriados nacionales</p>
        @if (feriados().length > 0) {
          @for (h of feriados(); track h.date) {
            <div class="flex items-center gap-1">
              <span class="text-blue-500">📅</span>
              <p class="text-sm text-blue-800">
                {{ h.name }}
                <span class="text-gray-400">({{ h.date | date:'dd/MM/yyyy':'':'es-PE' }})</span>
                @if (h.isReferential) {
                  <span class="ml-1 text-xs text-gray-400 bg-gray-100 px-1 rounded">Dato referencial</span>
                }
              </p>
            </div>
          }
        } @else {
          <p class="text-sm text-gray-500 italic">No hay feriados en tus fechas.</p>
        }
      </div>

      <!-- Si no hay ni festividades ni feriados -->
      @if (festividades().length === 0 && feriados().length === 0) {
        <p class="text-sm text-gray-500 italic text-center border-t border-orange-100 pt-3">
          No hay feriados ni festividades en tus fechas.
        </p>
      }

      <!-- Clima -->
      <div>
        <p class="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Clima esperado</p>
        @if (clima()) {
          @for (item of climaForecast(); track $index) {
            <div class="flex items-center gap-2">
              <span class="text-yellow-500">🌤️</span>
              <p class="text-sm text-gray-700">
                {{ item.description | titlecase }}
                &nbsp;·&nbsp;
                {{ item.temp_min }}°C – {{ item.temp_max }}°C
              </p>
            </div>
          }
          @if (clima()?.isReferential) {
            <span class="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-1 inline-block">
              Dato referencial (promedio mensual)
            </span>
          }
        } @else {
          <p class="text-sm text-gray-500 italic">No hay datos de clima disponibles.</p>
        }
      </div>
    </div>

    <button
      (click)="state.goTo(3)"
      class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
      Continuar → Elegir hotel
    </button>
  `,
  host: { class: 'block space-y-5' },
})
export class StepContextComponent {
  readonly state = inject(PackageBuilderState);

  readonly festividades = computed(() => this.state.context()?.festivities ?? []);
  readonly feriados = computed(() => this.state.context()?.holidays ?? []);
  readonly clima = computed(() => this.state.context()?.weather ?? null);
  readonly climaForecast = computed(() => this.clima()?.forecast ?? []);

  /** Fecha de salida formateada (la del vuelo de ida). */
  readonly departureDateDisplay = computed(() => {
    const dep = this.state.flight()?.departureDate;
    if (!dep) return '';
    return new Date(dep).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  });

  /** Fecha de regreso formateada (la del vuelo de vuelta). */
  readonly returnDateDisplay = computed(() => {
    const ret = this.state.returnFlight()?.departureDate;
    if (!ret) return '';
    return new Date(ret).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  });
}
