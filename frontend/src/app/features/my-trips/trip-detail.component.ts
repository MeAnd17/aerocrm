import { Component, OnInit, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/services/api-error';
import { HttpErrorResponse } from '@angular/common/http';

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
  pointsEarned: number;
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
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-5">
      <div class="flex items-center gap-3">
        <a routerLink="/my-trips" class="text-gray-400 hover:text-gray-600">← Mis viajes</a>
      </div>

      @if (cargando()) {
        <div class="text-center py-10 text-gray-400">Cargando detalle...</div>
      } @else if (noEncontrada()) {
        <div class="text-center py-16">
          <p class="text-gray-500 text-lg mb-4">Reserva no encontrada</p>
          <a routerLink="/my-trips" class="text-blue-600 hover:underline text-sm">Volver a mis viajes</a>
        </div>
      } @else if (reserva()) {
        <!-- Encabezado -->
        <div class="bg-white rounded-xl border shadow-sm p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-2xl font-bold text-gray-800">{{ reserva()!.confirmationCode }}</p>
              <p class="text-sm text-gray-500 mt-0.5">{{ reserva()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-sm font-semibold"
              [ngClass]="{
                'bg-yellow-100 text-yellow-700': reserva()!.status === 'PENDIENTE',
                'bg-green-100 text-green-700':  reserva()!.status === 'CONFIRMADO',
                'bg-blue-100 text-blue-700':    reserva()!.status === 'EN_CURSO',
                'bg-gray-100 text-gray-700':    reserva()!.status === 'COMPLETADO',
                'bg-red-100 text-red-600':      reserva()!.status === 'CANCELADO'
              }">
              {{ reserva()!.status | label }}
            </span>
          </div>
        </div>

        <!-- Pasajeros -->
        @if (reserva()!.bookingPassengers?.length) {
          <div class="bg-white rounded-xl border shadow-sm p-4">
            <h3 class="font-semibold text-gray-800 mb-3">Pasajeros</h3>
            @for (p of reserva()!.bookingPassengers; track p.id) {
              <div class="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                <div>
                  <span class="font-medium text-gray-800">{{ p.firstName }} {{ p.lastName }}</span>
                  @if (p.isHolder) {
                    <span class="ml-2 text-xs text-blue-600 font-semibold">Titular</span>
                  }
                </div>
                <span class="text-gray-500">Doc: {{ p.documentNumber }}</span>
              </div>
            }
          </div>
        }

        <!-- Vuelos -->
        @for (bf of reserva()!.bookingFlights; track bf.id) {
          <div class="bg-white rounded-xl border shadow-sm p-4">
            <h3 class="font-semibold text-gray-800 mb-2">Vuelo</h3>
            <p class="font-bold">{{ bf.flight.airline }} {{ bf.flight.flightNumber }}</p>
            <p class="text-sm text-gray-600">{{ bf.flight.origin?.city }} → {{ bf.flight.destination?.city }}</p>
            <p class="text-sm text-gray-500">{{ bf.flight.departureDate | date:'dd MMM yyyy, HH:mm' }}</p>
            <p class="text-sm font-semibold text-blue-900 mt-1">S/. {{ bf.priceSnapshot | number:'1.2-2' }}</p>
          </div>
        }

        <!-- Hotel -->
        @for (bh of reserva()!.bookingHotels; track bh.id) {
          <div class="bg-white rounded-xl border shadow-sm p-4">
            <h3 class="font-semibold text-gray-800 mb-2">Hotel</h3>
            <p class="font-bold">{{ bh.hotel.name }}</p>
            <p class="text-sm text-gray-500">
              Entrada: {{ bh.checkIn | date:'dd/MM/yyyy':'UTC' }} ·
              Salida: {{ bh.checkOut | date:'dd/MM/yyyy':'UTC' }} ·
              {{ bh.nights }} noches
            </p>
            <p class="text-sm font-semibold text-blue-900 mt-1">S/. {{ bh.priceSnapshot | number:'1.2-2' }}</p>
          </div>
        }

        <!-- Actividades -->
        @if (reserva()!.bookingActivities?.length) {
          <div class="bg-white rounded-xl border shadow-sm p-4">
            <h3 class="font-semibold text-gray-800 mb-2">Actividades</h3>
            @for (ba of reserva()!.bookingActivities; track ba.id) {
              <div class="flex justify-between py-1.5 border-b last:border-0 text-sm">
                <span>{{ ba.activity.name }} @if (ba.quantity > 1) { (× {{ ba.quantity }}) }</span>
                <span class="font-semibold">S/. {{ ba.priceSnapshot | number:'1.2-2' }}</span>
              </div>
            }
          </div>
        }

        <!-- Extras -->
        @if (reserva()!.bookingExtras?.length) {
          <div class="bg-white rounded-xl border shadow-sm p-4">
            <h3 class="font-semibold text-gray-800 mb-2">Extras</h3>
            @for (be of reserva()!.bookingExtras; track be.id) {
              <div class="flex justify-between py-1.5 border-b last:border-0 text-sm">
                <span>{{ be.type | label }}</span>
                <span class="font-semibold">S/. {{ be.price | number:'1.2-2' }}</span>
              </div>
            }
          </div>
        }

        <!-- Total -->
        <div class="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <div class="flex justify-between items-center">
            <div>
              <p class="font-bold text-blue-900 text-lg">Total pagado</p>
              @if (reserva()!.pointsUsed > 0) {
                <p class="text-sm text-blue-600">
                  Se canjearon {{ reserva()!.pointsUsed }} puntos · descuento S/. {{ reserva()!.discountAmount | number:'1.2-2' }}
                </p>
              }
              @if (reserva()!.pointsEarned > 0) {
                <p class="text-sm text-green-600">+{{ reserva()!.pointsEarned }} puntos ganados</p>
              }
            </div>
            <p class="text-2xl font-bold text-blue-900">S/. {{ reserva()!.totalPrice | number:'1.2-2' }}</p>
          </div>
        </div>

        <!-- Cancelar -->
        @if (reserva()!.status === 'CONFIRMADO' || reserva()!.status === 'PENDIENTE') {
          <button (click)="cancelar()" [disabled]="cancelando()"
            class="w-full border border-red-300 text-red-600 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-50">
            {{ cancelando() ? 'Cancelando...' : 'Cancelar reserva' }}
          </button>
        }
      }
    </div>
  `,
})
export class TripDetailComponent implements OnInit {
  reserva = signal<ReservaDetalle | null>(null);
  cargando = signal(true);
  cancelando = signal(false);
  noEncontrada = signal(false);

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
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
          this.toast.error(apiErrorMessage(err, 'No pudimos cargar el detalle de la reserva'));
        }
      },
    });
  }

  cancelar() {
    const id = this.reserva()?.id;
    if (!id) return;
    this.cancelando.set(true);
    this.api.patch<ReservaDetalle>(`bookings/${id}/cancel`, {}).subscribe({
      next: (actualizada) => {
        this.reserva.set(actualizada);
        this.cancelando.set(false);
      },
      error: (err: unknown) => {
        this.cancelando.set(false);
        this.toast.error(apiErrorMessage(err, 'No pudimos cancelar la reserva'));
      },
    });
  }
}
