import { Component, OnInit, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/services/api-error';
import { HttpErrorResponse } from '@angular/common/http';
import { RatingStarsComponent } from '../../shared/ui/rating-stars.component';

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

interface Resena {
  id: number;
  rating: number;
  comment: string | null;
  updatedAt: string;
}

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe, FormsModule, RatingStarsComponent],
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

        <!-- Calificación (US-025) — solo para viajes COMPLETADO -->
        @if (reserva()!.status === 'COMPLETADO') {
          <div class="bg-white rounded-xl border shadow-sm p-5">
            <h3 class="font-semibold text-gray-800 mb-3">⭐ Calificación</h3>

            @if (cargandoResena()) {
              <p class="text-sm text-gray-400">Cargando calificación...</p>
            } @else if (resena() && !editandoResena()) {
              <!-- Reseña existente -->
              <div class="space-y-2">
                <ui-stars [rating]="resena()!.rating" />
                @if (resena()!.comment) {
                  <p class="text-sm text-gray-700">{{ resena()!.comment }}</p>
                }
                <p class="text-xs text-gray-400">{{ resena()!.updatedAt | date:'dd/MM/yyyy':'':'es-PE' }}</p>
                <div class="flex gap-2 mt-2">
                  <button (click)="iniciarEdicion()"
                    class="text-sm text-blue-600 hover:underline">Editar</button>
                  <button (click)="solicitarEliminacion()"
                    class="text-sm text-red-500 hover:underline">Eliminar</button>
                </div>
              </div>

              <!-- Confirmar eliminación (inline, sin window.confirm) -->
              @if (confirmandoEliminar()) {
                <div class="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 space-y-2">
                  <p class="text-sm font-semibold text-red-700">¿Eliminar tu calificación de este viaje?</p>
                  <div class="flex gap-2">
                    <button (click)="confirmarEliminar()" [disabled]="guardandoResena()"
                      class="flex-1 bg-red-600 text-white text-sm py-1.5 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                      {{ guardandoResena() ? 'Eliminando...' : 'Sí, eliminar' }}
                    </button>
                    <button (click)="cancelarEliminar()" [disabled]="guardandoResena()"
                      class="flex-1 border border-gray-300 text-gray-600 text-sm py-1.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-50">
                      Cancelar
                    </button>
                  </div>
                </div>
              }
            } @else {
              <!-- Formulario de calificación (nueva o edición) -->
              <div class="space-y-3">
                <div>
                  <p class="text-sm text-gray-600 mb-1">Calificación</p>
                  <ui-stars [rating]="nuevaCalif()" [editable]="true" (ratingChange)="nuevaCalif.set($event)" />
                </div>
                <div>
                  <label class="text-sm text-gray-600 block mb-1">Comentario (opcional)</label>
                  <textarea [(ngModel)]="nuevoComentario" rows="3" maxlength="500"
                    placeholder="Cuéntanos cómo fue tu experiencia..."
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                </div>
                <div class="flex gap-2">
                  <button (click)="guardarResena()" [disabled]="guardandoResena() || nuevaCalif() === 0"
                    class="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                    {{ guardandoResena() ? 'Guardando...' : (editandoResena() ? 'Actualizar' : 'Enviar calificación') }}
                  </button>
                  @if (editandoResena()) {
                    <button (click)="cancelarEdicion()"
                      class="flex-1 border border-gray-300 text-gray-600 text-sm py-2 rounded-lg hover:bg-gray-50 transition">
                      Cancelar
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Imprimir / Guardar PDF -->
        @if (reserva()!.status === 'CONFIRMADO' || reserva()!.status === 'EN_CURSO' || reserva()!.status === 'COMPLETADO') {
          <button (click)="irAImprimir()"
            class="w-full border border-blue-300 text-blue-700 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-50 transition">
            Imprimir / Guardar PDF
          </button>
        }

        <!-- Cancelar (US-018: desde PENDIENTE o CONFIRMADO) -->
        @if (reserva()!.status === 'PENDIENTE' || reserva()!.status === 'CONFIRMADO') {
          @if (!confirmandoCancelacion()) {
            <button (click)="solicitarCancelacion()" [disabled]="cancelando()"
              class="w-full border border-red-300 text-red-600 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-50">
              Cancelar reserva
            </button>
          } @else {
            <div class="rounded-xl border border-red-300 bg-red-50 p-4 space-y-3">
              <p class="text-sm font-semibold text-red-700">
                ¿Cancelar tu viaje a {{ destinoCancelacion() }}? Esta acción no se puede deshacer
              </p>
              <div class="flex gap-3">
                <button (click)="confirmarCancelacion()" [disabled]="cancelando()"
                  class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                  {{ cancelando() ? 'Cancelando...' : 'Sí, cancelar' }}
                </button>
                <button (click)="descartarCancelacion()" [disabled]="cancelando()"
                  class="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
                  No, volver
                </button>
              </div>
            </div>
          }
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
  /** Indica que el usuario pidió cancelar y espera confirmación (dos pasos). */
  confirmandoCancelacion = signal(false);
  /** Destino del vuelo de ida, usado en el mensaje de confirmación. */
  destinoCancelacion = signal('este destino');

  /** Reseña existente del cliente para esta reserva. */
  resena = signal<Resena | null>(null);
  cargandoResena = signal(false);
  guardandoResena = signal(false);
  editandoResena = signal(false);
  confirmandoEliminar = signal(false);

  /** Estado del formulario de reseña. */
  nuevaCalif = signal(0);
  nuevoComentario = '';

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private toast: ToastService,
    private router: Router,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get<ReservaDetalle>(`bookings/${id}`).subscribe({
      next: (data) => {
        this.reserva.set(data);
        this.cargando.set(false);
        if (data.status === 'COMPLETADO') {
          this.cargarResena(data.id);
        }
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

  private cargarResena(bookingId: string) {
    this.cargandoResena.set(true);
    this.api.get<Resena | null>(`reviews/booking/${bookingId}`).subscribe({
      next: (r) => {
        this.resena.set(r);
        this.cargandoResena.set(false);
      },
      error: () => this.cargandoResena.set(false),
    });
  }

  guardarResena() {
    if (this.nuevaCalif() === 0) return;
    const bookingId = this.reserva()?.id;
    if (!bookingId) return;

    this.guardandoResena.set(true);

    if (this.editandoResena() && this.resena()) {
      // PATCH
      this.api.patch<Resena>(`reviews/${this.resena()!.id}`, {
        rating: this.nuevaCalif(),
        comment: this.nuevoComentario || undefined,
      }).subscribe({
        next: (r) => {
          this.resena.set(r);
          this.editandoResena.set(false);
          this.guardandoResena.set(false);
          this.toast.success('Calificación actualizada');
        },
        error: (err: unknown) => {
          this.guardandoResena.set(false);
          this.toast.error(apiErrorMessage(err, 'No pudimos actualizar la calificación'));
        },
      });
    } else {
      // POST
      this.api.post<Resena>('reviews', {
        bookingId,
        rating: this.nuevaCalif(),
        comment: this.nuevoComentario || undefined,
      }).subscribe({
        next: (r) => {
          this.resena.set(r);
          this.guardandoResena.set(false);
          this.nuevaCalif.set(0);
          this.nuevoComentario = '';
          this.toast.success('Gracias por tu calificación');
        },
        error: (err: unknown) => {
          this.guardandoResena.set(false);
          this.toast.error(apiErrorMessage(err, 'No pudimos guardar la calificación'));
        },
      });
    }
  }

  iniciarEdicion() {
    const r = this.resena();
    if (!r) return;
    this.nuevaCalif.set(r.rating);
    this.nuevoComentario = r.comment ?? '';
    this.editandoResena.set(true);
    this.confirmandoEliminar.set(false);
  }

  cancelarEdicion() {
    this.editandoResena.set(false);
    this.nuevaCalif.set(0);
    this.nuevoComentario = '';
  }

  solicitarEliminacion() {
    this.confirmandoEliminar.set(true);
  }

  cancelarEliminar() {
    this.confirmandoEliminar.set(false);
  }

  confirmarEliminar() {
    const r = this.resena();
    if (!r) return;
    this.guardandoResena.set(true);
    this.api.delete<void>(`reviews/${r.id}`).subscribe({
      next: () => {
        this.resena.set(null);
        this.confirmandoEliminar.set(false);
        this.guardandoResena.set(false);
        this.nuevaCalif.set(0);
        this.nuevoComentario = '';
        this.toast.success('Calificación eliminada');
      },
      error: (err: unknown) => {
        this.guardandoResena.set(false);
        this.toast.error(apiErrorMessage(err, 'No pudimos eliminar la calificación'));
      },
    });
  }

  /** Navega a la vista imprimible de esta reserva. */
  irAImprimir() {
    const id = this.reserva()?.id;
    if (!id) return;
    void this.router.navigate(['/my-trips', id, 'print']);
  }

  /** Primer paso: muestra el diálogo de confirmación inline. */
  solicitarCancelacion() {
    const vueloIda = this.reserva()?.bookingFlights?.[0]?.flight;
    const destino = vueloIda?.destination?.city ?? vueloIda?.origin?.city ?? 'este destino';
    this.destinoCancelacion.set(destino);
    this.confirmandoCancelacion.set(true);
  }

  /** Segundo paso: el usuario confirmó — ejecutar la cancelación. */
  confirmarCancelacion() {
    const id = this.reserva()?.id;
    if (!id) return;

    this.cancelando.set(true);
    this.api.patch<ReservaDetalle>(`bookings/${id}/cancel`, {}).subscribe({
      next: (actualizada) => {
        this.reserva.set(actualizada);
        this.cancelando.set(false);
        this.confirmandoCancelacion.set(false);
        this.toast.success('Tu viaje fue cancelado');
      },
      error: (err: unknown) => {
        this.cancelando.set(false);
        this.confirmandoCancelacion.set(false);
        this.toast.error(apiErrorMessage(err, 'No pudimos cancelar la reserva'));
      },
    });
  }

  /** El usuario descartó la cancelación — ocultar el diálogo. */
  descartarCancelacion() {
    this.confirmandoCancelacion.set(false);
  }
}
