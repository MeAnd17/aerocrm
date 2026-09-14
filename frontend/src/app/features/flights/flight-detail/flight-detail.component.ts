import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/servicios/api.service';
import { ToastService } from '../../../core/servicios/toast.service';
import { AuthService } from '../../../core/servicios/auth.service';
import { FlightsSocketService } from '../../../core/servicios/flights-socket.service';
import { FlightStatusLabelPipe, FlightStatusClasePipe } from '../../../shared/pipes/flight-status.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-flight-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FlightStatusLabelPipe, FlightStatusClasePipe],
  template: `
    <div *ngIf="loading()" class="space-y-4">
      <div class="skeleton h-40 rounded-2xl"></div>
      <div class="grid grid-cols-3 gap-4"><div *ngFor="let _ of [1,2,3]" class="skeleton h-32 rounded-xl"></div></div>
    </div>

    <div *ngIf="!loading() && flight()">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex items-center gap-4">
          <a routerLink="/flights" class="btn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/></svg>
          </a>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-3xl font-bold font-mono text-white">{{ flight()?.flightNumber }}</h1>
              <span class="badge" [ngClase]="flight()?.status | flightStatusClase">{{ flight()?.status | flightStatusLabel }}</span>
            </div>
            <p class="text-navy-300 mt-1">
              {{ flight()?.route?.origin?.city }} ({{ flight()?.route?.origin?.iataCode }})
              &rarr;
              {{ flight()?.route?.destination?.city }} ({{ flight()?.route?.destination?.iataCode }})
            </p>
          </div>
        </div>
        <a *ngIf="auth.hasPermission('flights:update')" [routerLink]="['/flights', flight()?.id, 'edit']" class="btn-secondary">Editar Vuelo</a>
      </div>

      <!-- Stats cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="aero-card p-4">
          <p class="text-xs text-navy-400 mb-1">Salida programada</p>
          <p class="font-mono font-bold text-white text-lg">{{ flight()?.scheduledDeparture | date:'HH:mm' }}</p>
          <p class="text-xs text-navy-500">{{ flight()?.scheduledDeparture | date:'EEE, MMM d' }}</p>
        </div>
        <div class="aero-card p-4">
          <p class="text-xs text-navy-400 mb-1">Llegada programada</p>
          <p class="font-mono font-bold text-white text-lg">{{ flight()?.scheduledArrival | date:'HH:mm' }}</p>
          <p class="text-xs text-navy-500">{{ flight()?.scheduledArrival | date:'EEE, MMM d' }}</p>
        </div>
        <div class="aero-card p-4">
          <p class="text-xs text-navy-400 mb-1">Puerta</p>
          <p class="font-mono font-bold text-gold-400 text-2xl">{{ flight()?.gate?.code ?? '—' }}</p>
          <p class="text-xs text-navy-500">Terminal {{ flight()?.gate?.terminal ?? '—' }}</p>
        </div>
        <div class="aero-card p-4">
          <p class="text-xs text-navy-400 mb-1">Ocupación</p>
          <p class="font-mono font-bold text-white text-lg">{{ flight()?._count?.reservations || 0 }} / {{ flight()?.totalAsientos }}</p>
          <div class="mt-2 h-1.5 bg-navy-700 rounded-full overflow-hidden">
            <div class="h-full bg-gold-500 rounded-full transition-all" [style.width.%]="getOcupaciónPercent()"></div>
          </div>
        </div>
      </div>

      <!-- Aeronave + route info -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div class="aero-card p-5">
          <h2 class="section-title">Aeronave</h2>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>
            </div>
            <p class="font-semibold text-white">{{ flight()?.aircraft }}</p>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center bg-navy-900/50 rounded-lg p-2">
              <p class="text-xs text-navy-400">Economy</p>
              <p class="font-bold text-white">{{ flight()?.economyAsientos }}</p>
            </div>
            <div class="text-center bg-navy-900/50 rounded-lg p-2">
              <p class="text-xs text-navy-400">Business</p>
              <p class="font-bold text-gold-400">{{ flight()?.businessAsientos }}</p>
            </div>
            <div class="text-center bg-navy-900/50 rounded-lg p-2">
              <p class="text-xs text-navy-400">First</p>
              <p class="font-bold text-purple-400">{{ flight()?.firstClaseAsientos }}</p>
            </div>
          </div>
        </div>
        <div class="aero-card p-5">
          <h2 class="section-title">Route</h2>
          <div class="flex items-center justify-between">
            <div class="text-center">
              <p class="text-3xl font-mono font-bold text-white">{{ flight()?.route?.origin?.iataCode }}</p>
              <p class="text-sm text-navy-300">{{ flight()?.route?.origin?.city }}</p>
              <p class="text-xs text-navy-500">{{ flight()?.route?.origin?.country }}</p>
            </div>
            <div class="flex-1 flex items-center px-4">
              <div class="flex-1 border-t border-dashed border-navy-600"></div>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gold-400 mx-2" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>
              <div class="flex-1 border-t border-dashed border-navy-600"></div>
            </div>
            <div class="text-center">
              <p class="text-3xl font-mono font-bold text-white">{{ flight()?.route?.destination?.iataCode }}</p>
              <p class="text-sm text-navy-300">{{ flight()?.route?.destination?.city }}</p>
              <p class="text-xs text-navy-500">{{ flight()?.route?.destination?.country }}</p>
            </div>
          </div>
          <p class="text-center text-xs text-navy-500 mt-3">{{ flight()?.route?.distanceKm?.toLocaleString() }} km</p>
        </div>
      </div>

      <!-- Lista de Pasajeros -->
      <div class="aero-card overflow-hidden">
        <div class="p-5 border-b border-navy-700 flex items-center justify-between">
          <h2 class="section-title mb-0">Lista de Pasajeros</h2>
          <span class="text-xs text-navy-400">{{ flight()?.reservations?.length || 0 }} pasajeros</span>
        </div>
        <table class="aero-table">
          <thead><tr><th>Passenger</th><th>Clase</th><th>Asiento</th><th>Status</th><th>Servicios</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of flight()?.reservations">
              <td>
                <a [routerLink]="['/pasajeros', r.passenger?.id]" class="flex items-center gap-2 hover:text-gold-400 transition-colors">
                  <div class="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center text-xs font-semibold">
                    {{ r.passenger?.firstName?.[0] }}{{ r.passenger?.lastName?.[0] }}
                  </div>
                  <span class="text-sm text-white">{{ r.passenger?.firstName }} {{ r.passenger?.lastName }}</span>
                </a>
              </td>
              <td><span class="badge badge-navy text-xs">{{ r.fareClase.replace('_',' ') }}</span></td>
              <td class="font-mono text-xs text-gold-400">{{ r.seatNumber || '—' }}</td>
              <td>
                <span class="badge text-xs"
                  [class.badge-green]="r.status === 'CONFIRMED' || r.status === 'CHECKED_IN'"
                  [class.badge-yellow]="r.status === 'PENDING'"
                  [class.badge-red]="r.status === 'CANCELLED'">
                  {{ r.status.replace('_',' ') }}
                </span>
              </td>
              <td class="text-xs text-navy-400">{{ r.ancillaries?.length || 0 }} servicios</td>
            </tr>
            <tr *ngIf="!flight()?.reservations?.length">
              <td colspan="5" class="text-center text-navy-400 py-8">No pasajeros booked</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class FlightDetailComponent implements OnInit, OnDestroy {
  flight = signal<any>(null);
  loading = signal(true);
  private sub?: Subscription;

  constructor(
    private api: ApiService,
    private toast: ToastService,
    public auth: AuthService,
    private socket: FlightsSocketService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get<any>(`flights/${id}`).subscribe({
      next: f => { this.flight.set(f); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.sub = this.socket.flightStatusUpdated$.subscribe(u => {
      if (this.flight()?.id === u.flightId) this.flight.update(f => ({ ...f, status: u.status }));
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  getOcupaciónPercent() {
    const f = this.flight();
    if (!f?.totalAsientos) return 0;
    return Math.min(100, ((f._count?.reservations || 0) / f.totalAsientos) * 100);
  }
}
