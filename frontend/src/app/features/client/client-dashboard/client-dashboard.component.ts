import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { FlightsSocketService } from '../../../core/services/flights-socket.service';
import { FlightStatusLabelPipe, FlightStatusClassPipe } from '../../../shared/pipes/flight-status.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FlightStatusLabelPipe, FlightStatusClassPipe, RelativeTimePipe],
  template: `
    <!-- Welcome banner -->
    <div class="relative rounded-2xl overflow-hidden mb-6" style="min-height:180px">
      <img src="https://images.unsplash.com/photo-1569154941061-e231b4aa8f1a?w=1200&q=80&auto=format&fit=crop"
           alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.4" />
      <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,13,26,.95) 0%,rgba(5,13,26,.6) 60%,transparent 100%)"></div>
      <div style="position:relative;padding:2rem;display:flex;flex-direction:column;justify-content:center;height:100%">
        <p style="font-size:.75rem;color:#c9a84c;letter-spacing:.15em;text-transform:uppercase;font-weight:600;margin-bottom:.5rem">Bienvenido/a</p>
        <h1 style="font-size:1.75rem;font-weight:700;color:white;letter-spacing:-.02em">
          {{ user?.firstName }} {{ user?.lastName }}
        </h1>
        <div class="flex flex-wrap gap-4 mt-3">
          <div *ngIf="profile()?.passenger?.tier" style="display:inline-flex;align-items:center;gap:.4rem;padding:.2rem .75rem;border-radius:999px;font-size:.75rem;font-weight:600"
               [style.background]="tierBg" [style.color]="tierColor">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:12px;height:12px" viewBox="0 0 256 256" fill="currentColor"><path d="M234.29,69.53l-128-64a8,8,0,0,0-12.58,6.47V208a8,8,0,0,0,11.58,7.16L234.29,86.47A8,8,0,0,0,234.29,69.53Z"/></svg>
            {{ profile()?.passenger?.tier }} Member
          </div>
          <div *ngIf="profile()?.passenger?.frequentFlyerNumber" style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#c9a84c">
            {{ profile()?.passenger?.frequentFlyerNumber }}
          </div>
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div *ngFor="let stat of stats()" class="aero-card p-4">
        <p style="font-size:.7rem;color:#5580d0;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:.5rem">{{ stat.label }}</p>
        <p style="font-size:1.75rem;font-weight:700;color:white;font-family:'JetBrains Mono',monospace">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Upcoming flights + tickets -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

      <!-- Upcoming reservations -->
      <div class="aero-card overflow-hidden">
        <div style="padding:1.25rem 1.25rem .75rem;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(22,45,88,0.6)">
          <h2 style="font-size:1rem;font-weight:600;color:white">Próximos Vuelos</h2>
          <a routerLink="/client/reservations" style="font-size:.75rem;color:#c9a84c;text-decoration:none">Ver todos &rarr;</a>
        </div>
        <div *ngIf="loading()" style="padding:1.5rem">
          <div *ngFor="let _ of [1,2,3]" class="skeleton" style="height:64px;border-radius:.5rem;margin-bottom:.75rem"></div>
        </div>
        <div *ngIf="!loading()">
          <div *ngFor="let r of upcomingReservations()" style="padding:1rem 1.25rem;border-bottom:1px solid rgba(22,45,88,0.4);display:flex;align-items:center;gap:1rem">
            <!-- Route -->
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.25rem">
                <span style="font-family:'JetBrains Mono',monospace;font-size:.875rem;font-weight:700;color:white">{{ r.flight?.flightNumber }}</span>
                <span class="badge badge-navy" style="font-size:.65rem">{{ r.fareClass.replace('_',' ') }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:.375rem;font-size:.8rem;color:#8aaae0">
                <span style="font-family:'JetBrains Mono',monospace;font-weight:600">{{ r.flight?.route?.origin?.iataCode }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" style="width:12px;height:12px;color:#2452a0" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>
                <span style="font-family:'JetBrains Mono',monospace;font-weight:600">{{ r.flight?.route?.destination?.iataCode }}</span>
              </div>
              <p style="font-size:.7rem;color:#2452a0;margin-top:.25rem">{{ r.flight?.scheduledDeparture | date:'EEE, MMM d · HH:mm' }}</p>
            </div>
            <!-- Status -->
            <div style="text-align:right">
              <span class="badge" [ngClass]="r.flight?.status | flightStatusClass" style="font-size:.65rem">
                {{ r.flight?.status | flightStatusLabel }}
              </span>
              <p style="font-size:.7rem;color:#5580d0;margin-top:.25rem">Seat {{ r.seatNumber || 'TBA' }}</p>
            </div>
          </div>
          <div *ngIf="upcomingReservations().length === 0" style="padding:2rem;text-align:center;color:#2452a0">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:32px;height:32px;margin:0 auto 8px;color:#162d58" viewBox="0 0 256 256" fill="currentColor"><path d="M227.19,104.48A16,16,0,0,0,240,88.81V64a16,16,0,0,0-16-16H32A16,16,0,0,0,16,64V88.81a16,16,0,0,0,12.81,15.67,24,24,0,0,1,0,47A16,16,0,0,0,16,167.19V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V167.19a16,16,0,0,0-12.81-15.67,24,24,0,0,1,0-47Z"/></svg>
            <p style="font-size:.875rem">Sin vuelos próximos</p>
          </div>
        </div>
      </div>

      <!-- Recent tickets -->
      <div class="aero-card overflow-hidden">
        <div style="padding:1.25rem 1.25rem .75rem;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(22,45,88,0.6)">
          <h2 style="font-size:1rem;font-weight:600;color:white">Mis Solicitudes</h2>
          <a routerLink="/client/support" style="font-size:.75rem;color:#c9a84c;text-decoration:none">Ver todos &rarr;</a>
        </div>
        <div *ngIf="profile()?.tickets?.length === 0 && !loading()" style="padding:2rem;text-align:center;color:#2452a0">
          <svg xmlns="http://www.w3.org/2000/svg" style="width:32px;height:32px;margin:0 auto 8px;color:#162d58" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Z"/></svg>
          <p style="font-size:.875rem">Sin solicitudes aún</p>
          <a routerLink="/client/support" style="display:inline-block;margin-top:.75rem;font-size:.8rem;color:#c9a84c;text-decoration:underline;text-underline-offset:3px">Abrir una solicitud</a>
        </div>
        <div *ngFor="let t of profile()?.tickets?.slice(0,5)" style="padding:1rem 1.25rem;border-bottom:1px solid rgba(22,45,88,0.4)">
          <div style="display:flex;align-items:start;justify-content:space-between;gap:.75rem">
            <div style="flex:1;min-width:0">
              <p style="font-size:.875rem;font-weight:500;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ t.subject }}</p>
              <p style="font-size:.7rem;color:#5580d0;margin-top:.25rem">{{ t.ticketNumber }} &bull; {{ t.createdAt | relativeTime }}</p>
            </div>
            <div style="display:flex;gap:.375rem;flex-shrink:0">
              <span class="badge text-xs"
                [class.badge-blue]="t.status === 'OPEN'"
                [class.badge-purple]="t.status === 'IN_PROGRESS'"
                [class.badge-green]="t.status === 'RESOLVED'"
                [class.badge-gray]="t.status === 'CLOSED'">
                {{ t.status.replace('_',' ') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ClientDashboardComponent implements OnInit {
  profile = signal<any>(null);
  loading = signal(true);
  private sub?: Subscription;

  constructor(private api: ApiService, private auth: AuthService, private socket: FlightsSocketService) {}

  get user() { return this.auth.currentUser(); }

  ngOnInit() {
    this.socket.connect();
    this.api.get<any>('auth/client/profile').subscribe({
      next: p => { this.profile.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.sub = this.socket.flightStatusUpdated$.subscribe(update => {
      this.profile.update(p => {
        if (!p) return p;
        return {
          ...p,
          reservations: p.reservations.map((r: any) =>
            r.flight?.id === update.flightId ? { ...r, flight: { ...r.flight, status: update.status } } : r
          ),
        };
      });
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  get upcomingReservations() {
    return signal(
      (this.profile()?.reservations || []).filter((r: any) =>
        ['CONFIRMED', 'CHECKED_IN'].includes(r.status) &&
        new Date(r.flight?.scheduledArrival) > new Date()
      ).slice(0, 4)
    );
  }

  get stats() {
    const p = this.profile();
    return signal([
      { label: 'Total Vuelos', value: p?.passenger ? (p.reservations?.length || 0) : '—' },
      { label: 'Reservas Activas', value: p?.reservations?.filter((r: any) => ['CONFIRMED', 'CHECKED_IN'].includes(r.status)).length ?? '—' },
      { label: 'Tickets Abiertos', value: p?.tickets?.filter((t: any) => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length ?? '—' },
      { label: 'Nivel de Viajero', value: p?.passenger?.tier || 'STANDARD' },
    ]);
  }

  get tierBg() {
    const map: Record<string, string> = { PLATINUM: 'rgba(139,92,246,0.2)', GOLD: 'rgba(201,168,76,0.2)', SILVER: 'rgba(148,163,184,0.15)', STANDARD: 'rgba(71,85,105,0.15)' };
    return map[this.profile()?.passenger?.tier] || map['STANDARD'];
  }

  get tierColor() {
    const map: Record<string, string> = { PLATINUM: '#a78bfa', GOLD: '#c9a84c', SILVER: '#94a3b8', STANDARD: '#64748b' };
    return map[this.profile()?.passenger?.tier] || map['STANDARD'];
  }
}
