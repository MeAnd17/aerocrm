import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PackageBuilderState } from '../package-builder.state';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';

/** Tipos de traslado: excluyentes entre sí. */
const TRASLADO_TYPES = ['TRASLADO_IDA', 'TRASLADO_VUELTA', 'TRASLADO_COMPLETO'] as const;

/** Paso 5 · Extras (opcional). */
@Component({
  selector: 'app-step-extras',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-900/[0.06] shadow-card p-5">
      <h3 class="font-bold text-primary-700 mb-1">
        ➕ Extras <span class="text-slate-400 font-normal text-sm">(opcional)</span>
      </h3>
      <p class="text-xs text-slate-500 mb-4">Precios calculados por el servidor.</p>

      @if (cargando()) {
        <div class="flex items-center justify-center py-8 text-slate-400 text-sm">
          Cargando extras…
        </div>
      } @else {

        <!-- Traslados (opciones excluyentes) -->
        <div class="mb-4">
          <p class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Traslado al aeropuerto</p>
          <p class="text-xs text-slate-400 mb-2">Elige una opción (precio por reserva, independiente de pasajeros).</p>
          <div class="space-y-2">
            @for (extra of traslados(); track extra.type) {
              <div
                (click)="state.selectTransfer(extra)"
                [class.ring-2]="state.isExtraSelected(extra.type)"
                [class.ring-primary-500]="state.isExtraSelected(extra.type)"
                [class.bg-primary-50]="state.isExtraSelected(extra.type)"
                class="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-primary-300 transition select-none">
                <div class="flex flex-wrap items-center gap-2">
                  <!-- indicador radio visual -->
                  <span
                    [class.bg-primary-600]="state.isExtraSelected(extra.type)"
                    [class.border-primary-600]="state.isExtraSelected(extra.type)"
                    [class.border-slate-300]="!state.isExtraSelected(extra.type)"
                    class="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition">
                    @if (state.isExtraSelected(extra.type)) {
                      <span class="w-2 h-2 rounded-full bg-white"></span>
                    }
                  </span>
                  <div>
                    <p class="font-medium text-sm text-slate-800">{{ traslado_icon(extra.type) }} {{ extra.name }}</p>
                    @if (extra.description) {
                      <p class="text-xs text-slate-400 mt-0.5">{{ extra.description }}</p>
                    }
                  </div>
                </div>
                <p class="font-bold text-primary-900 text-sm whitespace-nowrap ml-3">
                  S/. {{ extra.price | number:'1.2-2' }}
                </p>
              </div>
            }
            @if (traslados().length === 0) {
              <p class="text-xs text-slate-400 italic">No hay traslados disponibles.</p>
            }
          </div>
        </div>

        <!-- Seguro de viaje (checkbox, por pasajero) -->
        <div class="mb-4">
          <p class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Seguro de viaje</p>
          @for (extra of seguros(); track extra.type) {
            <div
              (click)="state.toggleExtra(extra)"
              [class.ring-2]="state.isExtraSelected(extra.type)"
              [class.ring-primary-500]="state.isExtraSelected(extra.type)"
              [class.bg-primary-50]="state.isExtraSelected(extra.type)"
              class="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-primary-300 transition select-none">
              <div class="flex flex-wrap items-center gap-2">
                <!-- indicador checkbox visual -->
                <span
                  [class.bg-primary-600]="state.isExtraSelected(extra.type)"
                  [class.border-primary-600]="state.isExtraSelected(extra.type)"
                  [class.border-slate-300]="!state.isExtraSelected(extra.type)"
                  class="w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition">
                  @if (state.isExtraSelected(extra.type)) {
                    <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  }
                </span>
                <div>
                  <p class="font-medium text-sm text-slate-800">🛡️ {{ extra.name }}</p>
                  @if (extra.description) {
                    <p class="text-xs text-slate-400 mt-0.5">{{ extra.description }}</p>
                  }
                  <p class="text-xs text-slate-500 mt-0.5">
                    S/. {{ extra.price | number:'1.2-2' }} × {{ state.passengers() }} pasajero{{ state.passengers() !== 1 ? 's' : '' }}
                    = <span class="font-semibold">S/. {{ (extra.price * state.passengers()) | number:'1.2-2' }}</span>
                  </p>
                </div>
              </div>
              <p class="font-bold text-primary-900 text-sm whitespace-nowrap ml-3">
                S/. {{ (extra.price * state.passengers()) | number:'1.2-2' }}
              </p>
            </div>
          }
          @if (seguros().length === 0) {
            <p class="text-xs text-slate-400 italic">No hay seguro disponible.</p>
          }
        </div>

      }

      <!-- Resumen del paso -->
      @if (state.extraIds().length > 0) {
        <div class="mb-3 p-3 bg-primary-50 rounded-lg border border-primary-100">
          <p class="text-xs text-primary-700 font-medium">
            Extras seleccionados: {{ state.extraIds().length }}
            — Total estimado: S/. {{ state.extrasTotal() | number:'1.2-2' }}
          </p>
        </div>
      }

      <!-- Acciones -->
      <div class="flex flex-wrap gap-3 mt-2">
        <button
          (click)="state.goTo(6)"
          class="flex-1 bg-accent-600 text-white py-2.5 rounded-full font-semibold hover:bg-accent-700 transition text-sm min-w-[12rem]">
          Continuar
        </button>
        <button
          (click)="skipExtras()"
          class="text-sm text-slate-400 px-3 hover:text-slate-600 transition">
          Continuar sin extras
        </button>
        <button
          (click)="state.goTo(4)"
          class="text-sm text-slate-400 px-3 hover:text-slate-600 transition">
          ← Volver
        </button>
      </div>
    </div>
  `,
})
export class StepExtrasComponent implements OnInit {
  readonly state = inject(PackageBuilderState);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly cargando = signal(true);

  /** Todos los extras cargados del servidor. */
  private readonly _extras = signal<any[]>([]);

  readonly traslados = computed(() =>
    this._extras().filter(e => (TRASLADO_TYPES as readonly string[]).includes(e.type)),
  );

  readonly seguros = computed(() =>
    this._extras().filter(e => e.type === 'SEGURO_VIAJE'),
  );

  ngOnInit() {
    this.api.get<any[]>('bookings/extras').subscribe({
      next: (extras) => {
        this._extras.set(extras);
        this.cargando.set(false);
        // Sincronizar el estado con los precios del servidor:
        // si ya había extras seleccionados (restaurados del draft), refrescar sus objetos en memoria.
        this._syncStateExtras(extras);
      },
      error: (err) => {
        this.cargando.set(false);
        this.toast.error(
          apiErrorMessage(err, 'No se pudieron cargar los extras. Puedes continuar sin ellos.'),
        );
      },
    });
  }

  /**
   * Si el draft tenía extras seleccionados, actualiza `state.extras` con los objetos
   * reales del servidor (que traen precio y pricing correctos).
   */
  private _syncStateExtras(serverExtras: any[]) {
    const selectedTypes = this.state.extraIds();
    if (selectedTypes.length === 0) return;
    const resolved = selectedTypes
      .map(type => serverExtras.find(e => e.type === type))
      .filter((e): e is any => !!e);
    this.state.extras.set(resolved);
  }

  skipExtras() {
    this.state.extras.set([]);
    this.state.extraIds.set([]);
    this.state.goTo(6);
  }

  traslado_icon(type: string): string {
    if (type === 'TRASLADO_IDA') return '🚌';
    if (type === 'TRASLADO_VUELTA') return '🚌';
    if (type === 'TRASLADO_COMPLETO') return '🚌';
    return '🚌';
  }
}
