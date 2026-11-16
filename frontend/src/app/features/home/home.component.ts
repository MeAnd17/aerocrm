import { Component, OnInit, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PackageDraftService } from '../packages/package-draft.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/services/api-error';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-6">
      <!-- Saludo -->
      <div class="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 sm:p-10 text-white shadow-raised">
        <h1 class="text-[28px] leading-9 sm:text-4xl sm:leading-[44px] font-bold tracking-tight">Hola, {{ user()?.firstName }} 👋</h1>
        <p class="text-primary-200 mt-1">¿Listo para tu próximo viaje?</p>
      </div>

      <!-- Membresía y puntos -->
      <div class="bg-white rounded-2xl shadow-card border border-slate-900/[0.06] p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold tracking-tight text-primary-700">Tu membresía</h2>
          <span class="px-3 py-1 rounded-full text-xs font-bold"
            [ngClass]="{
              'bg-slate-100 text-slate-600': home()?.membership?.level === 'EXPLORADOR',
              'bg-primary-100 text-primary-700': home()?.membership?.level === 'VIAJERO',
              'bg-yellow-100 text-yellow-700': home()?.membership?.level === 'FRECUENTE',
              'bg-purple-100 text-purple-700': home()?.membership?.level === 'ELITE'
            }">
            {{ home()?.membership?.level | label }}
          </span>
        </div>
        <div class="flex items-center gap-6">
          <div>
            <p class="text-2xl font-bold text-primary-900">{{ home()?.membership?.availablePoints ?? 0 | number }}</p>
            <p class="text-xs text-slate-500">disponibles para canjear</p>
            <p class="text-[11px] text-slate-400">{{ home()?.membership?.totalPoints ?? 0 | number }} acumulados (histórico)</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-primary-900">{{ home()?.membership?.completedTrips ?? 0 }}</p>
            <p class="text-xs text-slate-500">viajes completados</p>
          </div>
          @if (home()?.membership?.nextLevel) {
            <div class="flex-1">
              <p class="text-xs text-slate-500 mb-1">
                Faltan {{ home()?.membership?.nextLevel?.tripsNeeded }} viajes para
                <span class="font-semibold">{{ home()?.membership?.nextLevel?.level | label }}</span>
              </p>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-primary-500 rounded-full transition-all" [style.width.%]="levelProgress()"></div>
              </div>
            </div>
          }
        </div>
        <a routerLink="/loyalty" class="text-sm text-primary-600 hover:underline mt-3 inline-block">Ver programa completo →</a>
      </div>

      <!-- Próximo viaje -->
      @if (home()?.nextBooking) {
        <div class="bg-white rounded-2xl shadow-card border border-slate-900/[0.06] p-5">
          <h2 class="text-lg font-bold tracking-tight text-primary-700 mb-3">✈️ Tu próximo viaje</h2>
          <div class="flex items-center gap-4">
            @if (home()?.nextBooking?.bookingFlights?.[0]?.flight) {
              <div class="flex-1">
                <p class="font-bold text-lg text-primary-900">
                  {{ home()?.nextBooking?.bookingFlights?.[0]?.flight?.origin?.city }}
                  → {{ home()?.nextBooking?.bookingFlights?.[0]?.flight?.destination?.city }}
                </p>
                <p class="text-sm text-slate-500">
                  {{ home()?.nextBooking?.bookingFlights?.[0]?.flight?.departureDate | date:'dd MMM yyyy':'UTC':'es-PE' }}
                </p>
                @if (home()?.nextBooking?.bookingHotels?.[0]?.hotel) {
                  <p class="text-xs text-slate-500 mt-0.5">
                    🏨 {{ home()?.nextBooking?.bookingHotels?.[0]?.hotel?.name }}
                  </p>
                }
              </div>
            }
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              {{ home()?.nextBooking?.status | label }}
            </span>
          </div>
          <a [routerLink]="['/my-trips', home()?.nextBooking?.id]"
            class="text-sm text-primary-600 hover:underline mt-2 inline-block">Ver detalle →</a>
        </div>
      } @else {
        <div class="bg-primary-50 border border-primary-100 rounded-xl p-5 text-center">
          <p class="text-slate-600 mb-3">No tienes viajes próximos</p>
          <a routerLink="/search" class="bg-accent-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-accent-700 transition">
            Buscar destinos
          </a>
        </div>
      }

      <!-- Festividades próximas -->
      @if (home()?.upcomingFestivities?.length) {
        <div class="bg-white rounded-2xl shadow-card border border-slate-900/[0.06] p-5">
          <h2 class="text-lg font-bold tracking-tight text-primary-700 mb-3">🎉 Próximas temporadas</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            @for (fest of home()?.upcomingFestivities?.slice(0,4); track fest.id) {
              <a [routerLink]="['/destinations', fest.destination?.id]"
                class="flex items-start gap-3 p-3 rounded-lg border hover:border-primary-300 transition cursor-pointer">
                <span class="text-2xl">🌍</span>
                <div>
                  <p class="font-medium text-sm text-slate-800">{{ fest.name }}</p>
                  <p class="text-xs text-slate-500">{{ fest.destination?.city }}, {{ fest.destination?.country }}</p>
                  @if (fest.priceFrom) {
                    <p class="text-xs font-semibold text-primary-700 mt-0.5">desde S/&nbsp;{{ fest.priceFrom | number:'1.0-0' }}</p>
                  }
                </div>
              </a>
            }
          </div>
        </div>
      }

      <!-- Elegidos para ti -->
      @if (recommendations().length > 0) {
        <div class="bg-white rounded-2xl shadow-card border border-slate-900/[0.06] p-5">
          <h2 class="text-lg font-bold tracking-tight text-primary-700 mb-3">✨ Elegidos para ti</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (rec of recommendations(); track rec.destination.id) {
              <div class="border rounded-xl p-4 space-y-2">
                <div>
                  <p class="font-semibold text-slate-800">{{ rec.destination.city }}</p>
                  <p class="text-xs text-slate-500">{{ rec.destination.country }}</p>
                  <span class="text-xs mt-1 inline-block px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                    {{ rec.destination.type | label }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 italic">{{ rec.reason }}</p>
                @if (rec.isReturn) {
                  <span class="text-xs text-amber-600 font-medium">↩ Vuelve a visitarlo</span>
                }
                <button (click)="armarViaje(rec.destination.id)"
                  [disabled]="armando() === rec.destination.id"
                  class="w-full bg-accent-600 text-white text-sm py-2 rounded-full hover:bg-accent-700 transition disabled:opacity-50">
                  {{ armando() === rec.destination.id ? 'Preparando...' : 'Armar mi viaje' }}
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Sin compras y sin preferencias -->
      @if (!home()?.nextBooking && home()?.membership?.completedTrips === 0 && recommendations().length === 0) {
        <div class="bg-amber-50 border border-amber-100 rounded-xl p-5 text-center">
          <p class="text-slate-700 font-medium mb-2">Cuéntanos más de ti</p>
          <p class="text-sm text-slate-500 mb-3">Con tus preferencias podemos mostrarte los mejores destinos para ti.</p>
          <a routerLink="/profile" class="bg-amber-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition">
            Completar mi perfil
          </a>
        </div>
      }
    </div>
  `,
})
export class HomeComponent implements OnInit {
  home = signal<any>(null);
  user = signal<any>(null);
  recommendations = signal<any[]>([]);
  armando = signal<number | null>(null);

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private draftService: PackageDraftService,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.user.set(this.auth.currentUser());
    this.api.get<any>('clients/me/home').subscribe({
      next: (data) => {
        this.home.set(data);
        this.cargarRecomendaciones();
      },
    });
  }

  levelProgress(): number {
    return this.home()?.membership?.nextLevel?.progressPercent ?? 100;
  }

  private cargarRecomendaciones() {
    const signals = this.draftService.getSearchSignals();
    this.api.post<any[]>('recommendations', { searchSignals: signals }).subscribe({
      next: (data) => this.recommendations.set(data?.slice(0, 6) ?? []),
      error: () => {}, // silencioso: las recomendaciones son complementarias
    });
  }

  /** Botón "Armar mi viaje": pide un quick-package y navega al armador. */
  armarViaje(destinationId: number) {
    this.armando.set(destinationId);
    this.api.post<any>('recommendations/quick-package', { destinationId }).subscribe({
      next: (draft) => {
        this.draftService.save({
          ownerId: this.user()?.id ?? null,
          step: 1,
          destinationId: draft.destinationId,
          flightId: draft.flightId,
          returnFlightId: null,
          departureDate: draft.departureDate,
          passengers: 1,
          hotelId: draft.hotelId ?? null,
          checkIn: draft.departureDate,
          checkOut: draft.departureDate,
          activitySelections: (draft.activityIds ?? []).map((id: number) => ({ activityId: id, quantity: 1 })),
          extraIds: [],
          pointsToRedeem: 0,
        });
        this.armando.set(null);
        void this.router.navigate(['/packages/new']);
      },
      error: (err: unknown) => {
        this.armando.set(null);
        this.toast.error(apiErrorMessage(err, 'No pudimos preparar tu viaje'));
      },
    });
  }
}
