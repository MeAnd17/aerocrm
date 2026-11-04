import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { ApiService } from '../../core/services/api.service';
import { apiErrorMessage } from '../../core/services/api-error';

/** Datos de la agencia devueltos por GET /agency. */
interface AgenciaInfo {
  legalName: string;
  tradeName: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string | null;
}

/** Pasajero incluido en la reserva. */
interface Pasajero {
  id: number;
  firstName: string;
  lastName: string;
  documentNumber: string;
  isHolder: boolean;
}

/** Forma completa de una reserva devuelta por GET /bookings/:id. */
interface ReservaDetalle {
  id: string;
  confirmationCode: string;
  status: string;
  totalPrice: number;
  pointsUsed: number;
  discountAmount: number;
  createdAt: string;
  bookingFlights: {
    id: number;
    priceSnapshot: number;
    flight: {
      airline: string;
      flightNumber: string;
      departureDate: string;
      origin?: { city: string };
      destination?: { city: string };
    };
  }[];
  bookingHotels: {
    id: number;
    checkIn: string;
    checkOut: string;
    nights: number;
    priceSnapshot: number;
    hotel: { name: string };
  }[];
  bookingActivities: {
    id: number;
    quantity: number;
    priceSnapshot: number;
    activity: { name: string };
  }[];
  bookingExtras: {
    id: number;
    type: string;
    price: number;
  }[];
  bookingPassengers: Pasajero[];
}

@Component({
  selector: 'app-trip-print',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe],
  // ViewEncapsulation.None hace que @media print afecte al documento completo.
  encapsulation: ViewEncapsulation.None,
  styles: [`
    @media print {
      nav, .no-print { display: none !important; }
      body { font-size: 12pt; }
    }
  `],
  template: `
    <div class="max-w-2xl mx-auto py-8 px-4">

      <!-- Botonera solo en pantalla -->
      <div class="no-print flex items-center justify-between mb-6">
        <a routerLink="/my-trips/{{ reservaId() }}" class="text-gray-400 hover:text-gray-600 text-sm">
          ← Volver al detalle
        </a>
        <button (click)="imprimir()"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          Imprimir / Guardar PDF
        </button>
      </div>

      @if (cargando()) {
        <div class="text-center py-10 text-gray-400">Cargando...</div>
      } @else if (noEncontrada()) {
        <div class="text-center py-16">
          <p class="text-gray-500 text-lg mb-4">Reserva no encontrada</p>
          <a routerLink="/my-trips" class="text-blue-600 hover:underline text-sm">Volver a mis viajes</a>
        </div>
      } @else if (reserva()) {

        <!-- Encabezado de la agencia -->
        <div class="border-b pb-4 mb-6 flex items-start justify-between">
          <div>
            @if (agencia()?.logoUrl) {
              <img [src]="agencia()!.logoUrl!" alt="Logo" class="h-10 mb-1">
            }
            <p class="text-xl font-bold text-gray-900">{{ agencia()?.tradeName ?? 'Expertia Travel S.A.C.' }}</p>
            <p class="text-xs text-gray-500">RUC {{ agencia()?.ruc }}</p>
            <p class="text-xs text-gray-500">{{ agencia()?.address }}</p>
            <p class="text-xs text-gray-500">{{ agencia()?.phone }} · {{ agencia()?.email }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-400 uppercase tracking-wide">Comprobante de reserva</p>
            <p class="text-lg font-bold text-blue-900">{{ reserva()!.confirmationCode }}</p>
            <span class="inline-block px-2 py-0.5 rounded text-xs font-semibold mt-1"
              [ngClass]="{
                'bg-yellow-100 text-yellow-700': reserva()!.status === 'PENDIENTE',
                'bg-green-100 text-green-700':  reserva()!.status === 'CONFIRMADO',
                'bg-blue-100 text-blue-700':    reserva()!.status === 'EN_CURSO',
                'bg-gray-100 text-gray-700':    reserva()!.status === 'COMPLETADO'
              }">
              {{ reserva()!.status | label }}
            </span>
            <p class="text-xs text-gray-400 mt-1">Emitido: {{ hoy | date:'dd/MM/yyyy' }}</p>
          </div>
        </div>

        <!-- Pasajeros -->
        @if (reserva()!.bookingPassengers?.length) {
          <div class="mb-5">
            <h3 class="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-2">Pasajeros</h3>
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="bg-gray-50">
                  <th class="text-left py-1.5 px-2 font-medium text-gray-600 border border-gray-200">Nombre</th>
                  <th class="text-left py-1.5 px-2 font-medium text-gray-600 border border-gray-200">Documento</th>
                  <th class="text-left py-1.5 px-2 font-medium text-gray-600 border border-gray-200">Rol</th>
                </tr>
              </thead>
              <tbody>
                @for (p of reserva()!.bookingPassengers; track p.id) {
                  <tr>
                    <td class="py-1.5 px-2 border border-gray-200">{{ p.firstName }} {{ p.lastName }}</td>
                    <td class="py-1.5 px-2 border border-gray-200">{{ p.documentNumber }}</td>
                    <td class="py-1.5 px-2 border border-gray-200">{{ p.isHolder ? 'Titular' : 'Acompañante' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Vuelos -->
        @if (reserva()!.bookingFlights?.length) {
          <div class="mb-5">
            <h3 class="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-2">Vuelos</h3>
            @for (bf of reserva()!.bookingFlights; track bf.id; let i = $index) {
              <div class="border border-gray-200 rounded p-3 mb-2">
                <p class="font-semibold text-gray-800 text-sm">
                  {{ i === 0 ? 'Vuelo de ida' : 'Vuelo de regreso' }}
                  — {{ bf.flight.airline }} {{ bf.flight.flightNumber }}
                </p>
                <p class="text-sm text-gray-600">
                  {{ bf.flight.origin?.city }} → {{ bf.flight.destination?.city }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ bf.flight.departureDate | date:'dd MMM yyyy, HH:mm' }}
                </p>
                <p class="text-sm font-semibold text-blue-900 mt-1">
                  S/. {{ bf.priceSnapshot | number:'1.2-2' }}
                </p>
              </div>
            }
          </div>
        }

        <!-- Hotel -->
        @if (reserva()!.bookingHotels?.length) {
          <div class="mb-5">
            <h3 class="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-2">Hotel</h3>
            @for (bh of reserva()!.bookingHotels; track bh.id) {
              <div class="border border-gray-200 rounded p-3 mb-2">
                <p class="font-semibold text-gray-800 text-sm">{{ bh.hotel.name }}</p>
                <p class="text-sm text-gray-500">
                  Entrada: {{ bh.checkIn | date:'dd/MM/yyyy':'UTC' }} ·
                  Salida: {{ bh.checkOut | date:'dd/MM/yyyy':'UTC' }} ·
                  {{ bh.nights }} {{ bh.nights === 1 ? 'noche' : 'noches' }}
                </p>
                <p class="text-sm font-semibold text-blue-900 mt-1">S/. {{ bh.priceSnapshot | number:'1.2-2' }}</p>
              </div>
            }
          </div>
        }

        <!-- Actividades y extras -->
        @if (reserva()!.bookingActivities?.length || reserva()!.bookingExtras?.length) {
          <div class="mb-5">
            <h3 class="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-2">Actividades y extras</h3>
            <table class="w-full text-sm border-collapse">
              <tbody>
                @for (ba of reserva()!.bookingActivities; track ba.id) {
                  <tr>
                    <td class="py-1.5 px-2 border border-gray-200">
                      {{ ba.activity.name }}
                      @if (ba.quantity > 1) { (× {{ ba.quantity }}) }
                    </td>
                    <td class="py-1.5 px-2 border border-gray-200 text-right font-semibold">
                      S/. {{ ba.priceSnapshot | number:'1.2-2' }}
                    </td>
                  </tr>
                }
                @for (be of reserva()!.bookingExtras; track be.id) {
                  <tr>
                    <td class="py-1.5 px-2 border border-gray-200">{{ be.type | label }}</td>
                    <td class="py-1.5 px-2 border border-gray-200 text-right font-semibold">
                      S/. {{ be.price | number:'1.2-2' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Resumen de costos -->
        <div class="border-t pt-4">
          <h3 class="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Resumen de costos</h3>

          @for (bf of reserva()!.bookingFlights; track bf.id; let i = $index) {
            <div class="flex justify-between text-sm py-1">
              <span class="text-gray-600">{{ i === 0 ? 'Vuelo de ida' : 'Vuelo de regreso' }} ({{ bf.flight.airline }} {{ bf.flight.flightNumber }})</span>
              <span>S/. {{ bf.priceSnapshot | number:'1.2-2' }}</span>
            </div>
          }

          @for (bh of reserva()!.bookingHotels; track bh.id) {
            <div class="flex justify-between text-sm py-1">
              <span class="text-gray-600">Hotel: {{ bh.hotel.name }}</span>
              <span>S/. {{ bh.priceSnapshot | number:'1.2-2' }}</span>
            </div>
          }

          @for (ba of reserva()!.bookingActivities; track ba.id) {
            <div class="flex justify-between text-sm py-1">
              <span class="text-gray-600">{{ ba.activity.name }}</span>
              <span>S/. {{ ba.priceSnapshot | number:'1.2-2' }}</span>
            </div>
          }

          @for (be of reserva()!.bookingExtras; track be.id) {
            <div class="flex justify-between text-sm py-1">
              <span class="text-gray-600">{{ be.type | label }}</span>
              <span>S/. {{ be.price | number:'1.2-2' }}</span>
            </div>
          }

          @if (reserva()!.pointsUsed > 0) {
            <div class="flex justify-between text-sm py-1 text-blue-700">
              <span>Descuento por canje de puntos ({{ reserva()!.pointsUsed }} pts)</span>
              <span>− S/. {{ reserva()!.discountAmount | number:'1.2-2' }}</span>
            </div>
          }

          <div class="flex justify-between font-bold text-base pt-3 border-t mt-2">
            <span class="text-gray-900">Total pagado</span>
            <span class="text-blue-900">S/. {{ reserva()!.totalPrice | number:'1.2-2' }}</span>
          </div>
        </div>

      }
    </div>
  `,
})
export class TripPrintComponent implements OnInit {
  /** ID de la reserva leído del parámetro de ruta. */
  reservaId = signal<string | null>(null);
  reserva = signal<ReservaDetalle | null>(null);
  agencia = signal<AgenciaInfo | null>(null);
  cargando = signal(true);
  noEncontrada = signal(false);

  /** Fecha de emisión del comprobante (hoy). */
  hoy = new Date();

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.reservaId.set(id);

    // Carga la reserva y los datos de la agencia en paralelo.
    this.api.get<AgenciaInfo>('agency').subscribe({
      next: (data) => this.agencia.set(data),
      error: () => { /* La agencia no es bloqueante: se muestra el nombre fijo si falla. */ },
    });

    this.api.get<ReservaDetalle>(`bookings/${id}`).subscribe({
      next: (data) => {
        this.reserva.set(data);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.noEncontrada.set(true);
        } else {
          // Si hay error no-404 se muestra "no encontrada" igual para no dejar pantalla en blanco.
          this.noEncontrada.set(true);
          void apiErrorMessage(err, '');
        }
      },
    });
  }

  /** Dispara el diálogo de impresión/PDF del navegador. */
  imprimir() {
    window.print();
  }
}
