import { Component, OnInit, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-5">
      <div class="flex items-center gap-3">
        <a routerLink="/my-trips" class="text-gray-400 hover:text-gray-600">← Mis viajes</a>
      </div>

      @if (booking()) {
        <div class="bg-white rounded-xl border shadow-sm p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-2xl font-bold text-gray-800">{{ booking().confirmationCode }}</p>
              <p class="text-sm text-gray-500 mt-0.5">{{ booking().createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-sm font-semibold"
              [ngClass]="{
                'bg-green-100 text-green-700': booking().status === 'CONFIRMADO',
                'bg-blue-100 text-blue-700': booking().status === 'EN_CURSO',
                'bg-gray-100 text-gray-700': booking().status === 'COMPLETADO',
                'bg-red-100 text-red-600': booking().status === 'CANCELADO'
              }">
              {{ booking().status | etiqueta }}
            </span>
          </div>
        </div>

        <!-- Vuelo -->
        @for (bf of booking().bookingFlights; track bf.id) {
          <div class="bg-white rounded-xl border shadow-sm p-4">
            <h3 class="font-semibold text-gray-800 mb-2">✈️ Vuelo</h3>
            <p class="font-bold">{{ bf.flight.airline }} {{ bf.flight.flightNumber }}</p>
            <p class="text-sm text-gray-600">{{ bf.flight.origin?.city }} → {{ bf.flight.destination?.city }}</p>
            <p class="text-sm text-gray-500">{{ bf.flight.departureDate | date:'dd MMM yyyy, HH:mm' }}</p>
            <p class="text-sm font-semibold text-blue-900 mt-1">S/. {{ bf.priceSnapshot | number:'1.2-2' }}</p>
          </div>
        }

        <!-- Hotel -->
        @for (bh of booking().bookingHotels; track bh.id) {
          <div class="bg-white rounded-xl border shadow-sm p-4">
            <h3 class="font-semibold text-gray-800 mb-2">🏨 Hotel</h3>
            <p class="font-bold">{{ bh.hotel.name }}</p>
            <p class="text-sm text-gray-500">Entrada: {{ bh.checkIn | date:'dd/MM/yyyy':'UTC' }} · Salida: {{ bh.checkOut | date:'dd/MM/yyyy':'UTC' }} · {{ bh.nights }} noches</p>
            <p class="text-sm font-semibold text-blue-900 mt-1">S/. {{ bh.priceSnapshot | number:'1.2-2' }}</p>
          </div>
        }

        <!-- Actividades -->
        @if (booking().bookingActivities?.length) {
          <div class="bg-white rounded-xl border shadow-sm p-4">
            <h3 class="font-semibold text-gray-800 mb-2">🎯 Actividades</h3>
            @for (ba of booking().bookingActivities; track ba.id) {
              <div class="flex justify-between py-1.5 border-b last:border-0 text-sm">
                <span>{{ ba.activity.name }} @if (ba.quantity > 1) { (× {{ ba.quantity }}) }</span>
                <span class="font-semibold">S/. {{ ba.priceSnapshot | number:'1.2-2' }}</span>
              </div>
            }
          </div>
        }

        <!-- Extras -->
        @if (booking().bookingExtras?.length) {
          <div class="bg-white rounded-xl border shadow-sm p-4">
            <h3 class="font-semibold text-gray-800 mb-2">➕ Extras</h3>
            @for (be of booking().bookingExtras; track be.id) {
              <div class="flex justify-between py-1.5 border-b last:border-0 text-sm">
                <span>{{ be.type | etiqueta }}</span>
                <span class="font-semibold">S/. {{ be.price | number:'1.2-2' }}</span>
              </div>
            }
          </div>
        }

        <!-- Precio total -->
        <div class="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <div class="flex justify-between items-center">
            <div>
              <p class="font-bold text-blue-900 text-lg">Total pagado</p>
              @if (booking().pointsUsed > 0) {
                <p class="text-sm text-blue-600">Se canjearon {{ booking().pointsUsed }} puntos · descuento S/. {{ booking().discountAmount | number:'1.2-2' }}</p>
              }
              @if (booking().pointsEarned > 0) {
                <p class="text-sm text-green-600">+{{ booking().pointsEarned }} puntos ganados</p>
              }
            </div>
            <p class="text-2xl font-bold text-blue-900">S/. {{ booking().totalPrice | number:'1.2-2' }}</p>
          </div>
        </div>

        <!-- Cancelar -->
        @if (booking().status === 'CONFIRMADO' || booking().status === 'PENDIENTE') {
          <button (click)="cancelBooking()" [disabled]="cancelling()"
            class="w-full border border-red-300 text-red-600 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-50">
            {{ cancelling() ? 'Cancelando...' : 'Cancelar reserva' }}
          </button>
        }
      }
    </div>
  `,
})
export class TripDetailComponent implements OnInit {
  booking = signal<any>(null);
  cancelling = signal(false);

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get<any>(`bookings/${id}`).subscribe(data => this.booking.set(data));
  }

  cancelBooking() {
    this.cancelling.set(true);
    this.api.patch<any>(`bookings/${this.booking().id}/cancel`, {}).subscribe({
      next: (updated) => { this.booking.set(updated); this.cancelling.set(false); },
      error: () => this.cancelling.set(false),
    });
  }
}
