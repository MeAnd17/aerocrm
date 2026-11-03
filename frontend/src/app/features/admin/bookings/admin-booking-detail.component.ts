import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';
import { LabelPipe } from '../../../shared/pipes/label.pipe';

/** Mapa de transiciones válidas por estado actual. */
const TRANSICIONES: Record<string, string[]> = {
  PENDIENTE:  ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['EN_CURSO',   'CANCELADO'],
  EN_CURSO:   ['COMPLETADO'],
  COMPLETADO: [],
  CANCELADO:  [],
};

/** Pasajero de la reserva. */
interface Pasajero {
  id: number;
  firstName: string;
  lastName: string;
  documentNumber: string;
  birthDate: string;
  isHolder: boolean;
}

/** Detalle completo de una reserva para el administrador. */
interface ReservaDetalle {
  id: string;
  confirmationCode: string;
  status: string;
  totalPrice: string;
  discountAmount: string;
  pointsEarned: number;
  pointsUsed: number;
  passengers: number;
  notes: string | null;
  createdAt: string;
  statusChangedAt: string | null;
  statusChangedBy: string | null;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  bookingFlights: Array<{
    id: number;
    priceSnapshot: string;
    flight: {
      flightNumber: string;
      airline: string;
      departureDate: string;
      origin: { name: string };
      destination: { name: string };
    };
  }>;
  bookingHotels: Array<{
    id: number;
    checkIn: string;
    checkOut: string;
    nights: number;
    priceSnapshot: string;
    hotel: { name: string; destination: { name: string } };
  }>;
  bookingActivities: Array<{
    id: number;
    quantity: number;
    priceSnapshot: string;
    activity: { name: string };
  }>;
  bookingExtras: Array<{
    id: number;
    type: string;
    price: string;
    details: string | null;
  }>;
  bookingPassengers: Pasajero[];
}

/**
 * Pantalla de detalle de una reserva para el administrador, con formulario
 * de cambio de estado y transiciones válidas prefiltered (US-029).
 */
@Component({
  selector: 'app-admin-booking-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-6">
      <!-- Cabecera -->
      <div class="flex items-center gap-3">
        <a routerLink="/admin/bookings" class="text-sm text-blue-600 hover:text-blue-800 transition">← Volver</a>
        <h1 class="text-xl font-bold text-gray-800">Detalle de reserva</h1>
      </div>

      @if (cargando()) {
        <p class="text-sm text-gray-500">Cargando reserva...</p>
      }

      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {{ error() }}
        </div>
      }

      @if (reserva()) {
        <!-- Resumen general -->
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
          <div class="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p class="text-lg font-semibold font-mono text-gray-800">{{ reserva()!.confirmationCode }}</p>
              <p class="text-sm text-gray-500">
                {{ reserva()!.user.firstName }} {{ reserva()!.user.lastName }} · {{ reserva()!.user.email }}
              </p>
            </div>
            <span
              class="px-3 py-1 rounded-full text-sm font-semibold"
              [class]="estadoClase(reserva()!.status)"
            >
              {{ reserva()!.status | label }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Total pagado</p>
              <p class="font-semibold text-gray-800">S/ {{ reserva()!.totalPrice }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Descuento</p>
              <p class="font-semibold text-gray-800">S/ {{ reserva()!.discountAmount }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Puntos ganados</p>
              <p class="font-semibold text-gray-800">{{ reserva()!.pointsEarned }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Puntos canjeados</p>
              <p class="font-semibold text-gray-800">{{ reserva()!.pointsUsed }}</p>
            </div>
          </div>

          @if (reserva()!.statusChangedBy) {
            <p class="text-xs text-gray-400">
              Último cambio: {{ reserva()!.statusChangedAt | date:'dd/MM/yyyy HH:mm':'':'es-PE' }}
              por {{ reserva()!.statusChangedBy }}
            </p>
          }

          @if (reserva()!.notes) {
            <p class="text-sm text-gray-600 border-t pt-3">
              <span class="font-medium">Notas:</span> {{ reserva()!.notes }}
            </p>
          }
        </div>

        <!-- Vuelos -->
        @if (reserva()!.bookingFlights.length > 0) {
          <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b">
              <h2 class="text-base font-semibold text-gray-700">Vuelos</h2>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Vuelo</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Ruta</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Salida</th>
                  <th class="text-right px-4 py-3 font-semibold text-gray-600">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                @for (bf of reserva()!.bookingFlights; track bf.id) {
                  <tr>
                    <td class="px-4 py-3 font-mono text-gray-700">
                      {{ bf.flight.flightNumber }} · {{ bf.flight.airline }}
                    </td>
                    <td class="px-4 py-3 text-gray-600">
                      {{ bf.flight.origin.name }} → {{ bf.flight.destination.name }}
                    </td>
                    <td class="px-4 py-3 text-gray-600">
                      {{ bf.flight.departureDate | date:'dd/MM/yyyy HH:mm':'':'es-PE' }}
                    </td>
                    <td class="px-4 py-3 text-right text-gray-700">S/ {{ bf.priceSnapshot }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Hotel -->
        @if (reserva()!.bookingHotels.length > 0) {
          <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b">
              <h2 class="text-base font-semibold text-gray-700">Hotel</h2>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Hotel</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Entrada</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Salida</th>
                  <th class="text-right px-4 py-3 font-semibold text-gray-600">Noches</th>
                  <th class="text-right px-4 py-3 font-semibold text-gray-600">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                @for (bh of reserva()!.bookingHotels; track bh.id) {
                  <tr>
                    <td class="px-4 py-3 text-gray-700">{{ bh.hotel.name }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ bh.checkIn | date:'dd/MM/yyyy':'':'es-PE' }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ bh.checkOut | date:'dd/MM/yyyy':'':'es-PE' }}</td>
                    <td class="px-4 py-3 text-right text-gray-700">{{ bh.nights }}</td>
                    <td class="px-4 py-3 text-right text-gray-700">S/ {{ bh.priceSnapshot }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Actividades -->
        @if (reserva()!.bookingActivities.length > 0) {
          <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b">
              <h2 class="text-base font-semibold text-gray-700">Actividades</h2>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Actividad</th>
                  <th class="text-right px-4 py-3 font-semibold text-gray-600">Cantidad</th>
                  <th class="text-right px-4 py-3 font-semibold text-gray-600">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                @for (ba of reserva()!.bookingActivities; track ba.id) {
                  <tr>
                    <td class="px-4 py-3 text-gray-700">{{ ba.activity.name }}</td>
                    <td class="px-4 py-3 text-right text-gray-700">{{ ba.quantity }}</td>
                    <td class="px-4 py-3 text-right text-gray-700">S/ {{ ba.priceSnapshot }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Extras -->
        @if (reserva()!.bookingExtras.length > 0) {
          <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b">
              <h2 class="text-base font-semibold text-gray-700">Extras</h2>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Detalles</th>
                  <th class="text-right px-4 py-3 font-semibold text-gray-600">Precio</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                @for (be of reserva()!.bookingExtras; track be.id) {
                  <tr>
                    <td class="px-4 py-3 text-gray-700">{{ be.type | label }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ be.details ?? '—' }}</td>
                    <td class="px-4 py-3 text-right text-gray-700">S/ {{ be.price }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Pasajeros -->
        <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b">
            <h2 class="text-base font-semibold text-gray-700">
              Pasajeros ({{ reserva()!.bookingPassengers.length }})
            </h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Documento</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Nacimiento</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Titular</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              @for (p of reserva()!.bookingPassengers; track p.id) {
                <tr>
                  <td class="px-4 py-3 text-gray-700">{{ p.firstName }} {{ p.lastName }}</td>
                  <td class="px-4 py-3 text-gray-600 font-mono">{{ p.documentNumber }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ p.birthDate | date:'dd/MM/yyyy':'':'es-PE' }}</td>
                  <td class="px-4 py-3">
                    @if (p.isHolder) {
                      <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Sí</span>
                    } @else {
                      <span class="text-gray-400 text-xs">No</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Cambio de estado -->
        @if (transicionesValidas().length > 0) {
          <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <h2 class="text-base font-semibold text-gray-700">Cambiar estado</h2>

            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nuevo estado</label>
                <select
                  [(ngModel)]="nuevoEstado"
                  class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar estado</option>
                  @for (t of transicionesValidas(); track t) {
                    <option [value]="t">{{ t | label }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Motivo (opcional)
                </label>
                <textarea
                  [(ngModel)]="motivoCambio"
                  rows="2"
                  placeholder="Explicación del cambio manual"
                  class="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>

              <button
                (click)="cambiarEstado()"
                [disabled]="!nuevoEstado || cambiando()"
                class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ cambiando() ? 'Procesando...' : 'Cambiar estado' }}
              </button>
            </div>
          </div>
        } @else {
          <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p class="text-sm text-gray-500">Esta reserva está en estado final y no permite más cambios.</p>
          </div>
        }
      }
    </div>
  `,
})
export class AdminBookingDetailComponent implements OnInit {
  reserva = signal<ReservaDetalle | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  cambiando = signal(false);

  nuevoEstado = '';
  motivoCambio = '';

  /** Transiciones posibles desde el estado actual de la reserva. */
  transicionesValidas = computed<string[]>(() => {
    const r = this.reserva();
    if (!r) return [];
    return TRANSICIONES[r.status] ?? [];
  });

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.cargar(id);
  }

  /** Carga el detalle completo de la reserva desde la API. */
  private cargar(id: string) {
    this.cargando.set(true);
    this.error.set(null);
    this.api.get<ReservaDetalle>(`admin/bookings/${id}`).subscribe({
      next: (data) => {
        this.reserva.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'No se pudo cargar la reserva.'));
        this.cargando.set(false);
      },
    });
  }

  /** Envía el cambio de estado al backend y recarga la reserva si fue exitoso. */
  cambiarEstado() {
    const r = this.reserva();
    if (!r || !this.nuevoEstado) return;

    this.cambiando.set(true);
    this.api
      .patch<ReservaDetalle>(`admin/bookings/${r.id}/status`, {
        status: this.nuevoEstado,
        reason: this.motivoCambio.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success(`Estado cambiado a ${this.nuevoEstado}.`);
          this.nuevoEstado = '';
          this.motivoCambio = '';
          this.cambiando.set(false);
          this.cargar(r.id);
        },
        error: (err) => {
          this.toast.error(apiErrorMessage(err, 'No se pudo cambiar el estado.'));
          this.cambiando.set(false);
        },
      });
  }

  /** Devuelve las clases de color para la etiqueta de estado de reserva. */
  estadoClase(estado: string): string {
    const mapa: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-700',
      CONFIRMADO: 'bg-blue-100 text-blue-700',
      EN_CURSO: 'bg-indigo-100 text-indigo-700',
      COMPLETADO: 'bg-green-100 text-green-700',
      CANCELADO: 'bg-red-100 text-red-600',
    };
    return mapa[estado] ?? 'bg-gray-100 text-gray-600';
  }
}
