import { Component, OnInit, computed, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/services/api-error';

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
  imports: [CommonModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-800">Mis viajes</h1>

      @if (cargando()) {
        <div class="text-center py-10 text-gray-400">Cargando viajes...</div>
      } @else if (sinViajes()) {
        <div class="text-center py-16">
          <p class="text-5xl mb-4">🧳</p>
          <p class="text-gray-500 mb-4">Aún no tienes viajes. ¡Arma el primero!</p>
          <a routerLink="/explore"
            class="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
            Explorar destinos
          </a>
        </div>
      } @else {
        <!-- Próximos -->
        @if (proximos().length) {
          <section>
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Próximos</h2>
            <div class="space-y-4">
              @for (reserva of proximos(); track reserva.id) {
                <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: reserva }"></ng-container>
              }
            </div>
          </section>
        }

        <!-- Pasados -->
        @if (pasados().length) {
          <section>
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pasados</h2>
            <div class="space-y-4">
              @for (reserva of pasados(); track reserva.id) {
                <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: reserva }"></ng-container>
              }
            </div>
          </section>
        }

        <!-- Cancelados -->
        @if (cancelados().length) {
          <section>
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Cancelados</h2>
            <div class="space-y-4">
              @for (reserva of cancelados(); track reserva.id) {
                <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: reserva }"></ng-container>
              }
            </div>
          </section>
        }
      }
    </div>

    <!-- Plantilla reutilizable de tarjeta -->
    <ng-template #tarjeta let-reserva>
      <div class="bg-white rounded-xl border shadow-sm p-5">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="font-bold text-gray-800">{{ destinoNombre(reserva) || reserva.confirmationCode }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ reserva.confirmationCode }}</p>
            @if (reserva.bookingFlights?.[0]) {
              <p class="text-sm text-gray-500 mt-0.5">
                {{ fechaSalida(reserva) | date:'dd MMM yyyy' }}
              </p>
            }
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-semibold"
            [ngClass]="{
              'bg-yellow-100 text-yellow-700': reserva.status === 'PENDIENTE',
              'bg-green-100 text-green-700':  reserva.status === 'CONFIRMADO',
              'bg-blue-100 text-blue-700':    reserva.status === 'EN_CURSO',
              'bg-gray-100 text-gray-700':    reserva.status === 'COMPLETADO',
              'bg-red-100 text-red-600':      reserva.status === 'CANCELADO'
            }">
            {{ reserva.status | label }}
          </span>
        </div>

        <div class="flex items-center justify-between pt-3 border-t">
          <div class="flex gap-4 text-sm text-gray-500">
            <span>{{ reserva.passengers }} pax</span>
            @if (reserva.bookingHotels?.length) { <span>Hotel incluido</span> }
            @if (reserva.bookingActivities?.length) {
              <span>{{ reserva.bookingActivities.length }} actividad(es)</span>
            }
          </div>
          <div class="text-right">
            <p class="font-bold text-blue-900">S/. {{ reserva.totalPrice | number:'1.2-2' }}</p>
            <a [routerLink]="['/my-trips', reserva.id]"
              class="text-xs text-blue-600 hover:underline">Ver detalle →</a>
          </div>
        </div>
      </div>
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
