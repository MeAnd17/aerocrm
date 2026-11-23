import { Component, OnInit, computed, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/services/api-error';
import {
  BadgeComponent,
  BadgeTone,
  ButtonComponent,
  CardComponent,
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
} from '../../shared/ui';

type FiltroViajes = 'todos' | 'proximos' | 'completados' | 'cancelados';

const TONO_ESTADO: Record<string, BadgeTone> = {
  PENDIENTE: 'warning',
  CONFIRMADO: 'success',
  EN_CURSO: 'brand',
  COMPLETADO: 'neutral',
  CANCELADO: 'danger',
};

/** Vuelo incluido en una reserva, con los datos de origen y destino. */
interface VueloReserva {
  id: number;
  departureDate: string;
  origin?: { city: string };
  destination?: { city: string };
  airline: string;
  flightNumber: string;
}

/** Relación vuelo-reserva devuelta por la API. */
interface BookingFlight {
  id: number;
  priceSnapshot: number;
  flight: VueloReserva;
}

/** Forma mínima de una reserva tal como la devuelve GET /bookings. */
interface Booking {
  id: string;
  confirmationCode: string;
  status: string;
  totalPrice: number;
  passengers: number;
  createdAt: string;
  bookingFlights: BookingFlight[];
  bookingHotels: { id: number }[];
  bookingActivities: { id: number }[];
}

/** Devuelve la fecha de salida como la menor departureDate entre los vuelos de la reserva. */
function fechaSalida(reserva: Booking): Date {
  if (!reserva.bookingFlights?.length) return new Date(0);
  return reserva.bookingFlights.reduce<Date>((min, bf) => {
    const d = new Date(bf.flight.departureDate);
    return d < min ? d : min;
  }, new Date(reserva.bookingFlights[0].flight.departureDate));
}

/** Devuelve el nombre de la ciudad de destino del vuelo de ida (el de menor departureDate). */
function destinoNombre(reserva: Booking): string {
  if (!reserva.bookingFlights?.length) return '';
  const vueloIda = reserva.bookingFlights.reduce((min, bf) => {
    const d = new Date(bf.flight.departureDate);
    return d < new Date(min.flight.departureDate) ? bf : min;
  }, reserva.bookingFlights[0]);
  return vueloIda.flight.destination?.city ?? '';
}

const ESTADOS_PROXIMOS = new Set(['PENDIENTE', 'CONFIRMADO', 'EN_CURSO']);

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe, BadgeComponent, ButtonComponent, CardComponent, EmptyStateComponent, LoadingStateComponent, PageHeaderComponent],
  template: `
    <div class="space-y-8">
      <ui-page-header eyebrow="Mi cuenta" title="Mis viajes"
        subtitle="Tus reservas confirmadas, los viajes en curso y tu historial.">
        <a routerLink="/explore" uiButton>Armar un nuevo viaje</a>
      </ui-page-header>

      @if (cargando()) {
        <ui-loading text="Cargando viajes..." />
      } @else if (sinViajes()) {
        <ui-card>
          <ui-empty-state icon="🧳" title="Aún no tienes viajes" message="Arma el primero: elige un vuelo y suma hotel, actividades y extras.">
            <a routerLink="/explore" uiButton>Explorar destinos</a>
          </ui-empty-state>
        </ui-card>
      } @else {
        <!-- Resumen -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          @for (c of contadores(); track c.label) {
            <div class="flex items-center gap-4 rounded-2xl border border-slate-900/[0.06] bg-white p-4 shadow-card sm:p-5">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" [ngClass]="c.tono" aria-hidden="true">{{ c.icono }}</span>
              <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">{{ c.label }}</p>
                <p class="text-xl font-bold text-primary-700 tabular-nums">{{ c.valor }}</p>
              </div>
            </div>
          }
        </div>

        <!-- Filtro -->
        <div class="flex gap-2 overflow-x-auto rounded-2xl border border-slate-900/[0.06] bg-white p-2 shadow-card" role="tablist" aria-label="Filtrar viajes">
          @for (t of pestanas; track t.valor) {
            <button type="button" role="tab" [attr.aria-selected]="filtro() === t.valor" (click)="filtro.set(t.valor)"
              class="shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition"
              [class.bg-primary-700]="filtro() === t.valor" [class.text-white]="filtro() === t.valor"
              [class.text-slate-600]="filtro() !== t.valor" [class.hover:bg-slate-100]="filtro() !== t.valor">
              {{ t.label }} ({{ cantidad(t.valor) }})
            </button>
          }
        </div>

        <!-- Próximos -->
        @if (proximos().length && (filtro() === 'todos' || filtro() === 'proximos')) {
          <section>
            <h2 class="mb-4 flex items-center gap-2 text-lg font-bold text-primary-700">
              <span class="h-2 w-2 rounded-full bg-accent-500" aria-hidden="true"></span> Próximos
            </h2>
            <div class="space-y-4">
              @for (reserva of proximos(); track reserva.id) {
                <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: reserva }"></ng-container>
              }
            </div>
          </section>
        }

        <!-- Pasados -->
        @if (pasados().length && (filtro() === 'todos' || filtro() === 'completados')) {
          <section>
            <h2 class="mb-4 text-lg font-bold text-primary-700">Viajes completados</h2>
            <div class="space-y-4">
              @for (reserva of pasados(); track reserva.id) {
                <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: reserva }"></ng-container>
              }
            </div>
          </section>
        }

        <!-- Cancelados -->
        @if (cancelados().length && (filtro() === 'todos' || filtro() === 'cancelados')) {
          <section>
            <h2 class="mb-4 text-lg font-bold text-primary-700">Cancelados</h2>
            <div class="space-y-4">
              @for (reserva of cancelados(); track reserva.id) {
                <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: reserva }"></ng-container>
              }
            </div>
          </section>
        }

        @if (cantidad(filtro()) === 0) {
          <ui-card><ui-empty-state icon="🗂️" title="No hay viajes en esta lista" /></ui-card>
        }
      }
    </div>

    <!-- Plantilla reutilizable de tarjeta -->
    <ng-template #tarjeta let-reserva>
      <article class="rounded-2xl border border-slate-900/[0.06] bg-white p-5 shadow-card transition hover:shadow-raised sm:p-6"
        [class.opacity-75]="reserva.status === 'CANCELADO'">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <ui-badge tone="brand" [caps]="true">{{ reserva.confirmationCode }}</ui-badge>
              <ui-badge [tone]="tonoEstado(reserva.status)">{{ reserva.status | label }}</ui-badge>
            </div>
            <h3 class="mt-3 text-xl font-bold tracking-tight text-primary-700">{{ destinoNombre(reserva) || reserva.confirmationCode }}</h3>
            @if (reserva.bookingFlights?.[0]) {
              <p class="mt-1 text-[11px] font-bold uppercase tracking-wider text-accent-700">
                Salida {{ fechaSalida(reserva) | date:'dd MMM yyyy' }}
              </p>
            }
            <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span class="rounded-full bg-slate-100 px-2.5 py-1">👥 {{ reserva.passengers }} {{ reserva.passengers === 1 ? 'pasajero' : 'pasajeros' }}</span>
              @if (reserva.bookingHotels?.length) { <span class="rounded-full bg-slate-100 px-2.5 py-1">🏨 Hotel incluido</span> }
              @if (reserva.bookingActivities?.length) {
                <span class="rounded-full bg-slate-100 px-2.5 py-1">🧭 {{ reserva.bookingActivities.length }} actividad(es)</span>
              }
            </div>
          </div>
          <div class="flex items-end justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-col sm:border-0 sm:pt-0 sm:text-right">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total pagado</p>
              <p class="text-xl font-extrabold text-primary-700 tabular-nums">S/. {{ reserva.totalPrice | number:'1.2-2' }}</p>
            </div>
            <a [routerLink]="['/my-trips', reserva.id]" uiButton variant="secondary" size="sm">Ver detalle →</a>
          </div>
        </div>
      </article>
    </ng-template>
  `,
})
export class MyTripsComponent implements OnInit {
  /** Exposición de las funciones de utilidad al template. */
  readonly fechaSalida = fechaSalida;
  readonly destinoNombre = destinoNombre;

  private todasLasReservas = signal<Booking[]>([]);
  cargando = signal(true);

  proximos = computed(() =>
    this.todasLasReservas()
      .filter(r => ESTADOS_PROXIMOS.has(r.status))
      .sort((a, b) => fechaSalida(a).getTime() - fechaSalida(b).getTime()),
  );

  pasados = computed(() =>
    this.todasLasReservas()
      .filter(r => r.status === 'COMPLETADO')
      .sort((a, b) => fechaSalida(a).getTime() - fechaSalida(b).getTime()),
  );

  cancelados = computed(() =>
    this.todasLasReservas()
      .filter(r => r.status === 'CANCELADO')
      .sort((a, b) => fechaSalida(a).getTime() - fechaSalida(b).getTime()),
  );

  sinViajes = computed(() =>
    !this.cargando() && this.todasLasReservas().length === 0,
  );

  /** Pestaña elegida; solo filtra lo que ya se cargó. */
  readonly filtro = signal<FiltroViajes>('todos');
  readonly pestanas: { valor: FiltroViajes; label: string }[] = [
    { valor: 'todos', label: 'Todos' },
    { valor: 'proximos', label: 'Próximos' },
    { valor: 'completados', label: 'Completados' },
    { valor: 'cancelados', label: 'Cancelados' },
  ];

  readonly contadores = computed(() => [
    { label: 'Próximos', valor: this.proximos().length, icono: '🗓️', tono: 'bg-accent-50' },
    { label: 'Completados', valor: this.pasados().length, icono: '🏔️', tono: 'bg-success-50' },
    { label: 'Cancelados', valor: this.cancelados().length, icono: '🗂️', tono: 'bg-slate-100' },
  ]);

  cantidad(f: FiltroViajes): number {
    if (f === 'proximos') return this.proximos().length;
    if (f === 'completados') return this.pasados().length;
    if (f === 'cancelados') return this.cancelados().length;
    return this.todasLasReservas().length;
  }

  tonoEstado(estado: string): BadgeTone {
    return TONO_ESTADO[estado] ?? 'neutral';
  }

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.get<{ data: Booking[] }>('bookings', { limit: 100 }).subscribe({
      next: (res) => {
        this.todasLasReservas.set(res.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.toast.error(apiErrorMessage(err, 'No pudimos cargar tus viajes'));
      },
    });
  }
}
