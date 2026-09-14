import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { FlightsSocketService } from '../../../core/services/flights-socket.service';
import { FlightStatusLabelPipe, FlightStatusClassPipe } from '../../../shared/pipes/flight-status.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-client-flights',
  standalone: true,
  imports: [CommonModule, FlightStatusLabelPipe, FlightStatusClassPipe],
  template: `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="page-title">Mis Vuelos</h1>
        <p class="page-subtitle">Estado en tiempo real de todos tus vuelos reservados</p>
      </div>
      <div style="display:flex;align-items:center;gap:.5rem;font-size:.75rem" [style.color]="wsConnected ? '#10b981' : '#f59e0b'">
        <span style="width:8px;height:8px;border-radius:50%" [style.background]="wsConnected ? '#10b981' : '#f59e0b'" [class.animate-pulse]="!wsConnected"></span>
        {{ wsConnected ? 'Actualizaciones en vivo' : 'Conectando…' }}
      </div>
    </div>

    <div *ngIf="loading()" class="space-y-3">
      <div *ngFor="let _ of [1,2,3]" class="skeleton" style="height:120px;border-radius:.75rem"></div>
    </div>

    <div *ngIf="!loading()" class="space-y-4">
      <div *ngFor="let r of flights()" class="aero-card p-5"
           [style.border-left]="getStatusBorder(r.flight?.status)">
        <!-- Flight header -->
        <div style="display:flex;align-items:start;justify-content:space-between;gap:1rem;margin-bottom:1rem">
          <div>
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.375rem">
              <span style="font-family:'JetBrains Mono',monospace;font-size:1.125rem;font-weight:700;color:white">
                {{ r.flight?.flightNumber }}
              </span>
              <span class="badge" [ngClass]="r.flight?.status | flightStatusClass" style="font-size:.7rem">
                {{ r.flight?.status | flightStatusLabel }}
              </span>
            </div>
            <p style="font-size:.8rem;color:#5580d0">Ref: <span style="font-family:'JetBrains Mono',monospace;color:#c9a84c">{{ r.bookingReference }}</span></p>
          </div>
          <div style="text-align:right">
            <span class="badge badge-navy" style="font-size:.7rem">{{ r.fareClass.replace('_',' ') }}</span>
            <p style="font-size:.8rem;color:#5580d0;margin-top:.25rem">Seat <span style="color:white;font-family:'JetBrains Mono',monospace">{{ r.seatNumber || 'TBA' }}</span></p>
          </div>
        </div>

        <!-- Route visual -->
        <div style="display:flex;align-items:center;gap:1rem;padding:1rem;background:rgba(5,13,26,0.5);border-radius:.75rem;border:1px solid rgba(22,45,88,0.5)">
          <div style="text-align:center">
            <p style="font-size:1.5rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:white">{{ r.flight?.route?.origin?.iataCode }}</p>
            <p style="font-size:.7rem;color:#5580d0">{{ r.flight?.route?.origin?.city }}</p>
            <p style="font-size:.8rem;font-family:'JetBrains Mono',monospace;color:#c9a84c;margin-top:.25rem">{{ r.flight?.scheduledDeparture | date:'HH:mm' }}</p>
            <p style="font-size:.65rem;color:#2452a0">{{ r.flight?.scheduledDeparture | date:'MMM d' }}</p>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:.5rem">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px;color:#c9a84c" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>
            <div style="width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)"></div>
            <p style="font-size:.7rem;color:#2452a0">{{ r.flight?.route?.distanceKm?.toLocaleString() }} km</p>
          </div>
          <div style="text-align:center">
            <p style="font-size:1.5rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:white">{{ r.flight?.route?.destination?.iataCode }}</p>
            <p style="font-size:.7rem;color:#5580d0">{{ r.flight?.route?.destination?.city }}</p>
            <p style="font-size:.8rem;font-family:'JetBrains Mono',monospace;color:#c9a84c;margin-top:.25rem">{{ r.flight?.scheduledArrival | date:'HH:mm' }}</p>
            <p style="font-size:.65rem;color:#2452a0">{{ r.flight?.scheduledArrival | date:'MMM d' }}</p>
          </div>
        </div>

        <!-- Gate + aircraft -->
        <div style="display:flex;gap:1.5rem;margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(22,45,88,0.4)">
          <div>
            <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em">Gate</p>
            <p style="font-family:'JetBrains Mono',monospace;font-size:1rem;font-weight:700;color:#c9a84c">{{ r.flight?.gate?.code || '—' }}</p>
          </div>
          <div>
            <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em">Terminal</p>
            <p style="font-size:.875rem;color:white;font-weight:600">{{ r.flight?.gate?.terminal || '—' }}</p>
          </div>
          <div>
            <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em">Aircraft</p>
            <p style="font-size:.875rem;color:#8aaae0">{{ r.flight?.aircraft }}</p>
          </div>
        </div>
      </div>

      <div *ngIf="flights().length === 0" style="text-align:center;padding:3rem;color:#2452a0">
        <svg xmlns="http://www.w3.org/2000/svg" style="width:48px;height:48px;margin:0 auto 1rem;color:#162d58" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>
        <p style="font-size:1rem;font-weight:500;color:white;margin-bottom:.5rem">Sin vuelos</p>
        <p style="font-size:.875rem">Tus vuelos reservados aparecerán aquí</p>
      </div>
    </div>
  `,
})
export class ClientFlightsComponent implements OnInit, OnDestroy {
  flights = signal<any[]>([]);
  loading = signal(true);
  private sub?: Subscription;

  constructor(private api: ApiService, private auth: AuthService, private socket: FlightsSocketService) {}
  get wsConnected() { return this.socket.isConnected; }

  ngOnInit() {
    this.api.get<any>('auth/client/profile').subscribe({
      next: p => {
        this.flights.set(p.reservations?.filter((r: any) => r.flight) || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.sub = this.socket.flightStatusUpdated$.subscribe(u => {
      this.flights.update(list => list.map(r => r.flight?.id === u.flightId ? { ...r, flight: { ...r.flight, status: u.status } } : r));
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  getStatusBorder(status: string) {
    const map: Record<string, string> = {
      ON_TIME: '4px solid #10b981', DELAYED: '4px solid #f59e0b', CANCELLED: '4px solid #ef4444',
      BOARDING: '4px solid #8b5cf6', DEPARTED: '4px solid #3b82f6', LANDED: '4px solid #6b7280',
    };
    return map[status] || '4px solid transparent';
  }
}
