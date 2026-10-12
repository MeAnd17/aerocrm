import { Component, OnInit, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-6">
      <!-- Saludo -->
      <div class="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white">
        <h1 class="text-2xl font-bold">Hola, {{ user()?.firstName }} 👋</h1>
        <p class="text-blue-200 mt-1">¿Listo para tu próximo viaje?</p>
      </div>

      <!-- Membresía y puntos -->
      <div class="bg-white rounded-xl shadow-sm border p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-gray-800">Tu membresía</h2>
          <span class="px-3 py-1 rounded-full text-xs font-bold"
            [ngClass]="{
              'bg-gray-100 text-gray-600': home()?.membership?.level === 'EXPLORADOR',
              'bg-blue-100 text-blue-700': home()?.membership?.level === 'VIAJERO',
              'bg-yellow-100 text-yellow-700': home()?.membership?.level === 'FRECUENTE',
              'bg-purple-100 text-purple-700': home()?.membership?.level === 'ELITE'
            }">
            {{ home()?.membership?.level | etiqueta }}
          </span>
        </div>
        <div class="flex items-center gap-6">
          <div>
            <p class="text-2xl font-bold text-blue-900">{{ home()?.membership?.availablePoints ?? 0 }}</p>
            <p class="text-xs text-gray-500">puntos disponibles</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-blue-900">{{ home()?.membership?.completedTrips ?? 0 }}</p>
            <p class="text-xs text-gray-500">viajes completados</p>
          </div>
          @if (home()?.membership?.nextLevel) {
            <div class="flex-1">
              <p class="text-xs text-gray-500 mb-1">
                Faltan {{ home()?.membership?.nextLevel?.tripsNeeded }} viajes para
                <span class="font-semibold">{{ home()?.membership?.nextLevel?.level | etiqueta }}</span>
              </p>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 rounded-full transition-all" [style.width.%]="levelProgress()"></div>
              </div>
            </div>
          }
        </div>
        <a routerLink="/loyalty" class="text-sm text-blue-600 hover:underline mt-3 inline-block">Ver programa completo →</a>
      </div>

      <!-- Próximo viaje -->
      @if (home()?.nextBooking) {
        <div class="bg-white rounded-xl shadow-sm border p-5">
          <h2 class="font-semibold text-gray-800 mb-3">✈️ Tu próximo viaje</h2>
          <div class="flex items-center gap-4">
            @if (home()?.nextBooking?.bookingFlights?.[0]?.flight) {
              <div class="flex-1">
                <p class="font-bold text-lg text-blue-900">
                  {{ home()?.nextBooking?.bookingFlights?.[0]?.flight?.origin?.city }}
                  → {{ home()?.nextBooking?.bookingFlights?.[0]?.flight?.destination?.city }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ home()?.nextBooking?.bookingFlights?.[0]?.flight?.departureDate | date:'dd MMM yyyy' }}
                </p>
              </div>
            }
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              {{ home()?.nextBooking?.status | etiqueta }}
            </span>
          </div>
          <a [routerLink]="['/my-trips', home()?.nextBooking?.id]"
            class="text-sm text-blue-600 hover:underline mt-2 inline-block">Ver detalle →</a>
        </div>
      } @else {
        <div class="bg-blue-50 border border-blue-100 rounded-xl p-5 text-center">
          <p class="text-gray-600 mb-3">No tienes viajes próximos</p>
          <a routerLink="/search" class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            Buscar destinos
          </a>
        </div>
      }

      <!-- Festividades próximas -->
      @if (home()?.upcomingFestivities?.length) {
        <div class="bg-white rounded-xl shadow-sm border p-5">
          <h2 class="font-semibold text-gray-800 mb-3">🎉 Próximas temporadas</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            @for (fest of home()?.upcomingFestivities?.slice(0,4); track fest.id) {
              <a [routerLink]="['/destinations', fest.destination?.id]"
                class="flex items-start gap-3 p-3 rounded-lg border hover:border-blue-300 transition cursor-pointer">
                <span class="text-2xl">🌍</span>
                <div>
                  <p class="font-medium text-sm text-gray-800">{{ fest.name }}</p>
                  <p class="text-xs text-gray-500">{{ fest.destination?.city }}, {{ fest.destination?.country }}</p>
                </div>
              </a>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class HomeComponent implements OnInit {
  home = signal<any>(null);
  user = signal<any>(null);

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.user.set(this.auth.currentUser());
    this.api.get<any>('clients/me/home').subscribe({
      next: (data) => this.home.set(data),
    });
  }

  levelProgress(): number {
    // El avance lo calcula el motor de fidelización del backend (AGENTS.md B7).
    return this.home()?.membership?.nextLevel?.progressPercent ?? 100;
  }
}
