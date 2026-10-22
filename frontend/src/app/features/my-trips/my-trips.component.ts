import { Component, OnInit, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-5">
      <h1 class="text-2xl font-bold text-gray-800">Mis viajes</h1>

      <!-- Filtros por estado -->
      <div class="flex gap-2 flex-wrap">
        @for (s of statuses; track s.value) {
          <button (click)="filterStatus.set(s.value); loadBookings()"
            [class.bg-blue-600]="filterStatus() === s.value"
            [class.text-white]="filterStatus() === s.value"
            [class.bg-white]="filterStatus() !== s.value"
            [class.text-gray-600]="filterStatus() !== s.value"
            class="px-4 py-1.5 rounded-full text-sm border font-medium transition">
            {{ s.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="text-center py-10 text-gray-400">Cargando viajes...</div>
      } @else if (bookings().length === 0) {
        <div class="text-center py-16">
          <p class="text-5xl mb-4">🧳</p>
          <p class="text-gray-500">No tienes viajes aún</p>
          <a routerLink="/search" class="mt-4 inline-block bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
            Buscar destinos
          </a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (booking of bookings(); track booking.id) {
            <div class="bg-white rounded-xl border shadow-sm p-5">
              <div class="flex items-start justify-between mb-3">
                <div>
                  <p class="font-bold text-gray-800">{{ booking.confirmationCode }}</p>
                  @if (booking.bookingFlights?.[0]?.flight) {
                    <p class="text-sm text-gray-600 mt-0.5">
                      {{ booking.bookingFlights[0].flight.origin?.city }}
                      → {{ booking.bookingFlights[0].flight.destination?.city }}
                    </p>
                    <p class="text-xs text-gray-400">
                      {{ booking.bookingFlights[0].flight.departureDate | date:'dd MMM yyyy' }}
                    </p>
                  }
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-semibold"
                  [ngClass]="{
                    'bg-yellow-100 text-yellow-700': booking.status === 'PENDIENTE',
                    'bg-green-100 text-green-700': booking.status === 'CONFIRMADO',
                    'bg-blue-100 text-blue-700': booking.status === 'EN_CURSO',
                    'bg-gray-100 text-gray-700': booking.status === 'COMPLETADO',
                    'bg-red-100 text-red-600': booking.status === 'CANCELADO'
                  }">
                  {{ booking.status | label }}
                </span>
              </div>

              <div class="flex items-center justify-between pt-3 border-t">
                <div class="flex gap-4 text-sm text-gray-500">
                  <span>👥 {{ booking.passengers }} pax</span>
                  @if (booking.bookingHotels?.length) { <span>🏨 Hotel incluido</span> }
                  @if (booking.bookingActivities?.length) { <span>🎯 {{ booking.bookingActivities.length }} actividad(es)</span> }
                </div>
                <div class="text-right">
                  <p class="font-bold text-blue-900">S/. {{ booking.totalPrice | number:'1.2-2' }}</p>
                  <a [routerLink]="['/my-trips', booking.id]"
                    class="text-xs text-blue-600 hover:underline">Ver detalle →</a>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MyTripsComponent implements OnInit {
  bookings = signal<any[]>([]);
  loading = signal(true);
  filterStatus = signal('');

  statuses = [
    { value: '', label: 'Todos' },
    { value: 'CONFIRMADO', label: 'Confirmado' },
    { value: 'EN_CURSO', label: 'En curso' },
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() { this.loadBookings(); }

  loadBookings() {
    this.loading.set(true);
    const params: any = { page: 1, limit: 20 };
    if (this.filterStatus()) params.status = this.filterStatus();
    this.api.get<any>('bookings', params).subscribe({
      next: (res) => { this.bookings.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
