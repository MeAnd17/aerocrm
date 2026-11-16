import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { PackageBuilderState } from '../package-builder.state';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import { apiErrorMessage } from '../../../core/services/api-error';

/** Paso 1 · Vuelo de ida (ya elegido) y vuelo de regreso. */
@Component({
  selector: 'app-step-flight',
  standalone: true,
  imports: [CommonModule, FormsModule, LabelPipe],
  template: `
    <!-- Vuelo de ida -->
    <div class="bg-white rounded-2xl border border-slate-900/[0.06] shadow-card p-4 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-primary-600 font-semibold text-sm">✈️ Vuelo de ida</span>
        <button
          (click)="cambiarVuelo()"
          class="text-xs text-primary-600 underline hover:text-primary-800">
          Cambiar
        </button>
      </div>
      <p class="font-bold">{{ state.flight()?.airline }} {{ state.flight()?.flightNumber }}</p>
      <p class="text-sm text-slate-500">
        {{ state.flight()?.origin?.city }} → {{ state.flight()?.destination?.city }}
      </p>
      <p class="text-sm text-slate-500">
        Salida: {{ state.flight()?.departureDate | date:'dd/MM/yyyy HH:mm':'':'es-PE' }}
        &nbsp;·&nbsp;
        Llegada: {{ state.flight()?.arrivalDate | date:'dd/MM/yyyy HH:mm':'':'es-PE' }}
      </p>
      <p class="text-sm text-slate-500">
        Clase: {{ state.flight()?.classType | label }}
        &nbsp;·&nbsp;
        {{ state.flight()?.stops === 0 ? 'Directo' : (state.flight()?.stops + ' escala(s)') }}
      </p>
      <p class="text-sm font-bold text-primary-900">
        S/. {{ state.flightTotal() | number:'1.2-2' }}
        <span class="font-normal text-slate-400">({{ state.passengers() }} pasajero(s))</span>
      </p>
    </div>

    <!-- Vuelo de regreso -->
    <div class="bg-white rounded-2xl border border-slate-900/[0.06] shadow-card p-4 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-green-700 font-semibold text-sm">🔁 Vuelo de regreso</span>
        @if (state.returnFlight()) {
          <button
            (click)="limpiarRegreso()"
            class="text-xs text-red-500 underline hover:text-red-700">
            Quitar
          </button>
        }
      </div>

      @if (state.returnFlight()) {
        <!-- Vuelo de regreso ya elegido -->
        <p class="font-bold">
          {{ state.returnFlight()?.airline }} {{ state.returnFlight()?.flightNumber }}
        </p>
        <p class="text-sm text-slate-500">
          {{ state.returnFlight()?.origin?.city }} → {{ state.returnFlight()?.destination?.city }}
        </p>
        <p class="text-sm text-slate-500">
          Salida: {{ state.returnFlight()?.departureDate | date:'dd/MM/yyyy HH:mm':'':'es-PE' }}
          &nbsp;·&nbsp;
          Llegada: {{ state.returnFlight()?.arrivalDate | date:'dd/MM/yyyy HH:mm':'':'es-PE' }}
        </p>
        <p class="text-sm text-slate-500">
          Clase: {{ state.returnFlight()?.classType | label }}
          &nbsp;·&nbsp;
          {{ state.returnFlight()?.stops === 0 ? 'Directo' : (state.returnFlight()?.stops + ' escala(s)') }}
        </p>
        <p class="text-sm font-bold text-green-800">
          S/. {{ returnFlightTotal() | number:'1.2-2' }}
          <span class="font-normal text-slate-400">({{ state.passengers() }} pasajero(s))</span>
        </p>
      } @else {
        <!-- Buscador de regreso -->
        <div class="flex flex-wrap items-center gap-2">
          <label class="text-sm text-slate-600 whitespace-nowrap">Fecha de regreso:</label>
          <input
            type="date"
            [(ngModel)]="fechaRegreso"
            [min]="fechaMinRegreso()"
            class="border rounded-lg px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <button
            (click)="buscarRegreso()"
            [disabled]="buscando()"
            class="bg-accent-600 text-white text-sm font-semibold px-3 py-1.5 rounded-full hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
            @if (buscando()) { Buscando... } @else { Buscar }
          </button>
        </div>

        @if (vuelos().length > 0) {
          <p class="text-xs text-slate-500">
            {{ vuelos().length }} vuelo(s) encontrado(s). Selecciona uno:
          </p>
          <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
            @for (v of vuelos(); track v.id) {
              <div
                class="border rounded-lg p-3 cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
                (click)="elegirRegreso(v)">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-sm">{{ v.airline }} {{ v.flightNumber }}</span>
                  <span class="text-sm font-bold text-green-800">S/. {{ v.totalPrice | number:'1.2-2' }}</span>
                </div>
                <p class="text-xs text-slate-500">
                  {{ v.origin?.city }} → {{ v.destination?.city }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ v.departureDate | date:'dd/MM/yyyy HH:mm':'':'es-PE' }}
                  &nbsp;·&nbsp;
                  {{ v.classType | label }}
                  &nbsp;·&nbsp;
                  {{ v.stops === 0 ? 'Directo' : (v.stops + ' escala(s)') }}
                </p>
                @if (v.daysFromRequested !== 0) {
                  <p class="text-xs text-orange-500 mt-0.5">
                    {{ v.daysFromRequested > 0 ? '+' : '' }}{{ v.daysFromRequested }} día(s) respecto a la fecha pedida
                  </p>
                }
              </div>
            }
          </div>
        } @else if (buscado() && !buscando()) {
          <p class="text-sm text-slate-500 italic">
            No encontramos vuelos de regreso cerca de esa fecha. Prueba con otra fecha.
          </p>
        }
      }
    </div>

    <!-- Botón continuar: solo disponible con ambos vuelos -->
    <button
      (click)="continuar()"
      [disabled]="!state.flight() || !state.returnFlight()"
      class="w-full bg-accent-600 text-white py-3 rounded-full font-semibold hover:bg-accent-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
      Continuar → Ver contexto del destino
    </button>
  `,
  host: { class: 'block space-y-4' },
})
export class StepFlightComponent implements OnInit {
  readonly state = inject(PackageBuilderState);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Vuelos de regreso encontrados en la búsqueda. */
  readonly vuelos = signal<any[]>([]);
  readonly buscando = signal(false);
  readonly buscado = signal(false);

  /** Fecha que muestra el input (yyyy-mm-dd). Se inicializa en ngOnInit. */
  fechaRegreso = '';

  /** Precio total del vuelo de regreso (sin guardar en estado). */
  readonly returnFlightTotal = computed(
    () => Number(this.state.returnFlight()?.pricePerPerson ?? 0) * this.state.passengers(),
  );

  /** La fecha mínima de regreso es el día siguiente a la llegada del vuelo de ida. */
  readonly fechaMinRegreso = computed(() => {
    const arrival = this.state.flight()?.arrivalDate;
    if (!arrival) return '';
    const d = new Date(arrival);
    d.setDate(d.getDate() + 1);
    return localDate(d);
  });

  ngOnInit() {
    // Proponer 7 días después de la salida del vuelo de ida como fecha inicial de regreso
    if (!this.fechaRegreso) {
      const dep = this.state.departureDate() || this.state.flight()?.departureDate;
      if (dep) {
        const d = new Date(dep);
        d.setDate(d.getDate() + 7);
        this.fechaRegreso = localDate(d);
      }
    }
  }

  buscarRegreso() {
    const originIata = this.state.flight()?.destination?.iataCode;
    const destId = this.state.flightId() !== null
      ? this.state.flight()?.origin?.id ?? null
      : null;

    if (!originIata || !destId) {
      this.toast.warning('No se pudo determinar el origen del vuelo de regreso.');
      return;
    }

    this.buscando.set(true);
    this.buscado.set(false);
    this.vuelos.set([]);

    // El endpoint busca vuelos HACIA destId (origen del viaje), DESDE originIata (destino del viaje)
    this.api.get<any[]>(`destinations/${destId}/flights`, {
      origin: originIata,
      departureDate: this.fechaRegreso,
      passengers: this.state.passengers(),
      flexDays: 3,
    }).subscribe({
      next: (flights) => {
        // Solo vuelos cuya fecha de salida es posterior a la llegada del vuelo de ida
        const arrivalMs = this.state.flight()?.arrivalDate
          ? new Date(this.state.flight().arrivalDate).getTime()
          : 0;
        const filtrados = flights.filter(f => new Date(f.departureDate).getTime() > arrivalMs);
        this.vuelos.set(filtrados);
        this.buscando.set(false);
        this.buscado.set(true);
      },
      error: (err) => {
        this.buscando.set(false);
        this.buscado.set(true);
        this.toast.error(apiErrorMessage(err, 'Error al buscar vuelos de regreso.'));
      },
    });
  }

  elegirRegreso(v: any) {
    this.state.returnFlight.set(v);
    this.state.returnFlightId.set(v.id);
    this.vuelos.set([]);
  }

  limpiarRegreso() {
    this.state.returnFlight.set(null);
    this.state.returnFlightId.set(null);
  }

  cambiarVuelo() {
    // Regresa al buscador conservando el draft (ya está en localStorage por el effect en estado)
    this.router.navigate([this.auth.isAuthenticated() ? '/search' : '/explore']);
  }

  continuar() {
    if (!this.state.flight() || !this.state.returnFlight()) return;
    this.state.goTo(2);
  }
}

/** Fecha local en formato AAAA-MM-DD para <input type="date">. */
function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
