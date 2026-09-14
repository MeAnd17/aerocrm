import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { VuelosSocketService } from '../../core/services/flights-socket.service';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { VueloStatusLabelPipe, VueloStatusClassPipe } from '../../shared/pipes/flight-status.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RelativeTimePipe, VueloStatusLabelPipe, VueloStatusClassPipe],
  template: `
    <!-- Hero Header -->
    <div class="relative rounded-2xl overflow-hidden mb-6 h-44">
      <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&q=80&auto=format&fit=crop"
           alt="Airport terminal" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-900/80 to-transparent"></div>
      <div class="absolute inset-0 flex items-center px-8">
        <div>
          <p class="text-gold-400 text-sm font-medium mb-1">{{ greeting }}</p>
          <h1 class="text-3xl font-bold text-white">{{ user?.firstName }} {{ user?.lastName }}</h1>
          <p class="text-navy-300 text-sm mt-1">{{ currentTime }} &mdash; Centro de Operaciones</p>
        </div>
      </div>
      <div class="absolute top-4 right-4 flex flex-col items-end gap-1">
        <span class="badge badge-gold text-xs">{{ user?.roles?.[0] }}</span>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Vuelos Hoy -->
      <div class="aero-card p-5">
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400" viewBox="0 0 256 256" fill="currentColor">
              <path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/>
            </svg>
          </div>
          <span *ngIf="stats()?.flightsByStatus?.['DELAYED']" class="badge badge-yellow text-xs">{{ stats()?.flightsByStatus?.['DELAYED'] }} delayed</span>
        </div>
        <div class="stat-value">{{ stats()?.flightsToday ?? '—' }}</div>
        <div class="stat-label">Vuelos Hoy</div>
        <div class="mt-3 flex flex-wrap gap-1">
          <span *ngIf="stats()?.flightsByStatus?.['ON_TIME']" class="badge badge-green text-xs">{{ stats()?.flightsByStatus?.['ON_TIME'] }} on time</span>
          <span *ngIf="stats()?.flightsByStatus?.['BOARDING']" class="badge badge-purple text-xs">{{ stats()?.flightsByStatus?.['BOARDING'] }} boarding</span>
          <span *ngIf="stats()?.flightsByStatus?.['CANCELLED']" class="badge badge-red text-xs">{{ stats()?.flightsByStatus?.['CANCELLED'] }} cancelled</span>
        </div>
      </div>

      <!-- Pasajeros Activos -->
      <div class="aero-card p-5">
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gold-400" viewBox="0 0 256 256" fill="currentColor">
              <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.43a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.51A8,8,0,0,1,250.14,206.7Z"/>
            </svg>
          </div>
        </div>
        <div class="stat-value">{{ stats()?.activePasajeros ?? '—' }}</div>
        <div class="stat-label">Pasajeros Activos</div>
        <div class="mt-3">
          <span class="text-xs text-navy-400">{{ stats()?.checkInsToday ?? 0 }} check-ins hoy</span>
        </div>
      </div>

      <!-- Tickets Abiertos -->
      <div class="aero-card p-5" [class.border-red-500]="(stats()?.urgentTickets ?? 0) > 0" [class.border]="(stats()?.urgentTickets ?? 0) > 0">
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-purple-400" viewBox="0 0 256 256" fill="currentColor">
              <path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a88.21,88.21,0,0,1-45.06-12.38,8,8,0,0,0-6.51-.9L40,216l13.28-36.51a8,8,0,0,0-.9-6.51A88,88,0,1,1,128,216Z"/>
            </svg>
          </div>
          <span *ngIf="(stats()?.urgentTickets ?? 0) > 0" class="badge badge-red text-xs animate-pulse">{{ stats()?.urgentTickets }} urgent</span>
        </div>
        <div class="stat-value" [class.text-red-400]="(stats()?.urgentTickets ?? 0) > 0">{{ stats()?.openTickets ?? '—' }}</div>
        <div class="stat-label">Tickets Abiertos</div>
        <div class="mt-3">
          <a routerLink="/support" class="text-xs text-gold-400 hover:text-gold-300 transition-colors">View all tickets &rarr;</a>
        </div>
      </div>

      <!-- Ingresos Ancilares -->
      <div class="aero-card p-5">
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-400" viewBox="0 0 256 256" fill="currentColor">
              <path d="M152,120H136V56h8a32,32,0,0,1,32,32,8,8,0,0,0,16,0,48.05,48.05,0,0,0-48-48h-8V24a8,8,0,0,0-16,0V40h-8a48,48,0,0,0,0,96h8v64H104a32,32,0,0,1-32-32,8,8,0,0,0-16,0,48.05,48.05,0,0,0,48,48h16v16a8,8,0,0,0,16,0V216h16a48,48,0,0,0,0-96Zm-40,0a32,32,0,0,1,0-64h8v64Zm40,80H136V136h16a32,32,0,0,1,0,64Z"/>
            </svg>
          </div>
        </div>
        <div class="stat-value text-emerald-400">{{ '$' + formatRevenue(stats()?.ancillaryRevenue ?? 0) }}</div>
        <div class="stat-label">Ingresos Ancilares</div>
        <div class="mt-3">
          <span class="text-xs" [class.text-emerald-400]="(stats()?.avgSentiment ?? 0) >= 0" [class.text-red-400]="(stats()?.avgSentiment ?? 0) < 0">
            Sentimiento promedio: {{ stats()?.avgSentiment?.toFixed(2) ?? '—' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Charts + Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

      <!-- Upcoming flights panel -->
      <div class="lg:col-span-2 aero-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">Próximos Vuelos</h2>
          <a routerLink="/flights" class="text-xs text-gold-400 hover:text-gold-300 transition-colors">Ver todos &rarr;</a>
        </div>
        <div *ngIf="loadingVuelos()" class="space-y-3">
          <div *ngFor="let _ of [1,2,3,4]" class="skeleton h-10 rounded-lg"></div>
        </div>
        <div *ngIf="!loadingVuelos()">
          <table class="aero-table">
            <thead>
              <tr>
                <th>Vuelo</th>
                <th>Route</th>
                <th>Departure</th>
                <th>Gate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let flight of upcomingVuelos()" class="departure-row" [class]="'status-' + flight.status.toLowerCase()">
                <td class="font-mono font-semibold text-white">{{ flight.flightNumber }}</td>
                <td class="text-navy-300">
                  <span class="font-mono text-xs">{{ flight.route?.origin?.iataCode }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 inline mx-1 text-navy-500" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>
                  <span class="font-mono text-xs">{{ flight.route?.destination?.iataCode }}</span>
                </td>
                <td class="font-mono text-xs text-navy-300">{{ flight.scheduledDeparture | date:'HH:mm' }}</td>
                <td class="font-mono text-xs text-gold-400">{{ flight.gate?.code ?? '—' }}</td>
                <td><span class="badge text-xs" [ngClass]="flight.status | flightStatusClass">{{ flight.status | flightStatusLabel }}</span></td>
              </tr>
              <tr *ngIf="upcomingVuelos().length === 0">
                <td colspan="5" class="text-center text-navy-400 py-6">Sin vuelos próximos</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="aero-card p-5 flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">Actividad en Tiempo Real</h2>
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></span>
        </div>
        <div class="flex-1 overflow-y-auto space-y-3 max-h-72">
          <div *ngIf="loadingActivity()" class="space-y-3">
            <div *ngFor="let _ of [1,2,3,4,5]" class="skeleton h-12 rounded-lg"></div>
          </div>
          <div
            *ngFor="let activity of recentActivity()"
            class="flex items-start gap-3 p-2.5 rounded-lg hover:bg-navy-700/50 transition-colors"
            [class.animate-enter]="activity.isNew"
          >
            <div class="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                 [ngClass]="getActivityIconBg(activity.type)">
              <span [innerHTML]="getActivityIcon(activity.type)" class="w-4 h-4"></span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-white leading-snug">{{ activity.message }}</p>
              <p class="text-xs text-navy-500 mt-0.5">{{ activity.timestamp | relativeTime }}</p>
            </div>
          </div>
          <div *ngIf="!loadingActivity() && recentActivity().length === 0" class="text-center text-navy-400 text-sm py-6">
            Sin actividad reciente
          </div>
        </div>
      </div>
    </div>

    <!-- Ancillary breakdown -->
    <div class="aero-card p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="section-title mb-0">Ingresos Ancilares Breakdown</h2>
        <a routerLink="/reservations" class="text-xs text-gold-400 hover:text-gold-300 transition-colors">Ver reservas &rarr;</a>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div *ngFor="let item of ancillaryBreakdown()" class="bg-navy-900/60 rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <span [innerHTML]="getAncillaryIcon(item.type)" class="text-gold-400 w-4 h-4 flex-shrink-0"></span>
            <span class="text-xs font-medium text-navy-300 truncate">{{ formatAncillaryType(item.type) }}</span>
          </div>
          <p class="text-lg font-bold text-white">$ {{ item.revenue.toLocaleString() }}</p>
          <p class="text-xs text-navy-500">{{ item.count }} unidades vendidas</p>
          <div class="mt-2 h-1 bg-navy-700 rounded-full overflow-hidden">
            <div class="h-full bg-gold-500 rounded-full transition-all duration-700"
                 [style.width.%]="getAncillaryPercent(item.revenue)"></div>
          </div>
        </div>
        <div *ngIf="ancillaryBreakdown().length === 0 && !loadingStats()" class="col-span-4 text-center text-navy-400 text-sm py-4">
          Sin datos disponibles
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = signal<any>(null);
  upcomingVuelos = signal<any[]>([]);
  recentActivity = signal<any[]>([]);
  ancillaryBreakdown = signal<any[]>([]);
  loadingStats = signal(true);
  loadingVuelos = signal(true);
  loadingActivity = signal(true);
  currentTime = '';
  private timerInterval: any;
  private sub?: Subscription;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private socket: VuelosSocketService,
  ) {}

  get user() { return this.auth.currentUser(); }
  get greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  ngOnInit() {
    this.updateTime();
    this.timerInterval = setInterval(() => this.updateTime(), 1000);
    this.loadData();

    // Listen for real-time activity
    this.sub = this.socket.flightStatusUpdated$.subscribe(update => {
      const newActivity = {
        type: 'flight_status',
        message: `Vuelo ${update.flightNumber} is now ${update.status.replace('_', ' ')}`,
        timestamp: update.updatedAt,
        isNew: true,
      };
      this.recentActivity.update(arr => [newActivity, ...arr.slice(0, 19)]);
      // Refresh stats
      this.api.get<any>('dashboard/stats').subscribe(s => this.stats.set(s));
    });
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
    this.sub?.unsubscribe();
  }

  loadData() {
    this.api.get<any>('dashboard/stats').subscribe({
      next: s => { this.stats.set(s); this.loadingStats.set(false); },
      error: () => this.loadingStats.set(false),
    });
    this.api.get<any[]>('dashboard/upcoming-flights').subscribe({
      next: f => { this.upcomingVuelos.set(f); this.loadingVuelos.set(false); },
      error: () => this.loadingVuelos.set(false),
    });
    this.api.get<any[]>('dashboard/recent-activity').subscribe({
      next: a => { this.recentActivity.set(a); this.loadingActivity.set(false); },
      error: () => this.loadingActivity.set(false),
    });
    this.api.get<any[]>('dashboard/ancillary-breakdown').subscribe(b => this.ancillaryBreakdown.set(b));
  }

  updateTime() {
    this.currentTime = new Date().toLocaleString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  formatRevenue(v: number) {
    if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
    return v.toFixed(0);
  }

  formatAncillaryType(t: string) {
    return t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  getAncillaryPercent(revenue: number): number {
    const max = Math.max(...this.ancillaryBreakdown().map(b => b.revenue), 1);
    return Math.round((revenue / max) * 100);
  }

  getActivityIconBg(type: string) {
    const map: Record<string, string> = {
      flight_status: 'bg-blue-500/10 text-blue-400',
      new_ticket: 'bg-purple-500/10 text-purple-400',
      reservation: 'bg-gold-500/10 text-gold-400',
    };
    return map[type] || 'bg-navy-700 text-navy-300';
  }

  getActivityIcon(type: string) {
    const icons: Record<string, string> = {
      flight_status: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-400" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>`,
      new_ticket: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-purple-400" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Z"/></svg>`,
      reservation: `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gold-400" viewBox="0 0 256 256" fill="currentColor"><path d="M227.19,104.48A16,16,0,0,0,240,88.81V64a16,16,0,0,0-16-16H32A16,16,0,0,0,16,64V88.81a16,16,0,0,0,12.81,15.67,24,24,0,0,1,0,47A16,16,0,0,0,16,167.19V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V167.19a16,16,0,0,0-12.81-15.67,24,24,0,0,1,0-47Z"/></svg>`,
    };
    return icons[type] || icons['new_ticket'];
  }

  getAncillaryIcon(type: string) {
    const icons: Record<string, string> = {
      EXTRA_BAGGAGE: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M208,72H176V56a24,24,0,0,0-24-24H104A24,24,0,0,0,80,56V72H48A24,24,0,0,0,24,96V200a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V96A24,24,0,0,0,208,72ZM96,56a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8V72H96ZM96,176a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Zm80,0a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Z"/></svg>`,
      PREFERRED_SEAT: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M208,136H80V48A16,16,0,0,0,48,48V208a8,8,0,0,0,16,0V184H208a16,16,0,0,0,0-32Z"/></svg>`,
      LOUNGE_ACCESS: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M240,208H224V96a16,16,0,0,0-16-16H144V48a16,16,0,0,0-16-16H48A16,16,0,0,0,32,48V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM48,48h80V208H48ZM144,208V96h64V208Z"/></svg>`,
      default: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M227.19,104.48A16,16,0,0,0,240,88.81V64a16,16,0,0,0-16-16H32A16,16,0,0,0,16,64V88.81a16,16,0,0,0,12.81,15.67,24,24,0,0,1,0,47A16,16,0,0,0,16,167.19V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V167.19a16,16,0,0,0-12.81-15.67,24,24,0,0,1,0-47Z"/></svg>`,
    };
    return icons[type] || icons['default'];
  }
}
