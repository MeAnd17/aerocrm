import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { VueloStatusLabelPipe, VueloStatusClassPipe } from '../../../shared/pipes/flight-status.pipe';

@Component({
  selector: 'app-client-reservations',
  standalone: true,
  imports: [CommonModule, VueloStatusLabelPipe, VueloStatusClassPipe],
  template: `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="page-title">Mis Reservas</h1>
        <p class="page-subtitle">Todos tus vuelos reservados y servicios adicionales</p>
      </div>
    </div>

    <div *ngIf="loading()" class="space-y-3">
      <div *ngFor="let _ of [1,2,3]" class="skeleton" style="height:100px;border-radius:.75rem"></div>
    </div>

    <div *ngIf="!loading()" class="space-y-4">
      <div *ngFor="let r of reservations()" class="aero-card overflow-hidden">
        <!-- Boarding pass header -->
        <div style="background:linear-gradient(90deg,rgba(201,168,76,0.08),rgba(22,45,88,0.3));border-bottom:1px solid rgba(201,168,76,0.15);padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem">
          <div style="display:flex;align-items:center;gap:1rem">
            <div>
              <p style="font-size:.65rem;color:#5580d0;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Código de Reserva</p>
              <p style="font-family:'JetBrains Mono',monospace;font-size:1.1rem;font-weight:700;color:#c9a84c">{{ r.bookingReference }}</p>
            </div>
            <div style="width:1px;height:36px;background:rgba(22,45,88,0.6)"></div>
            <div>
              <p style="font-size:.65rem;color:#5580d0;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Vuelo</p>
              <p style="font-family:'JetBrains Mono',monospace;font-size:1rem;font-weight:700;color:white">{{ r.flight?.flightNumber }}</p>
            </div>
            <div>
              <p style="font-size:.65rem;color:#5580d0;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Ruta</p>
              <p style="font-family:'JetBrains Mono',monospace;font-size:.9rem;color:white">
                {{ r.flight?.route?.origin?.iataCode }} → {{ r.flight?.route?.destination?.iataCode }}
              </p>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:.75rem">
            <span class="badge" [ngClass]="r.flight?.status | flightStatusClass" style="font-size:.7rem">
              {{ r.flight?.status | flightStatusLabel }}
            </span>
            <span class="badge badge-navy" style="font-size:.7rem">{{ r.fareClass.replace('_',' ') }}</span>
            <span class="badge text-xs"
              [class.badge-green]="r.status === 'CONFIRMED' || r.status === 'CHECKED_IN'"
              [class.badge-yellow]="r.status === 'PENDING'"
              [class.badge-red]="r.status === 'CANCELLED'">
              {{ r.status.replace('_',' ') }}
            </span>
          </div>
        </div>

        <!-- Details -->
        <div style="padding:1rem 1.25rem;display:flex;flex-wrap:wrap;gap:2rem">
          <div>
            <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em">Fecha</p>
            <p style="font-size:.875rem;color:white;margin-top:.125rem">{{ r.flight?.scheduledSalida | date:'EEE, MMM d, y' }}</p>
          </div>
          <div>
            <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em">Salida</p>
            <p style="font-family:'JetBrains Mono',monospace;font-size:.875rem;color:white;margin-top:.125rem">{{ r.flight?.scheduledSalida | date:'HH:mm' }}</p>
          </div>
          <div>
            <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em">Asiento</p>
            <p style="font-family:'JetBrains Mono',monospace;font-size:.875rem;font-weight:700;color:#c9a84c;margin-top:.125rem">{{ r.seatNumber || 'TBA' }}</p>
          </div>
          <div>
            <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em">Puerta</p>
            <p style="font-family:'JetBrains Mono',monospace;font-size:.875rem;font-weight:700;color:#c9a84c;margin-top:.125rem">{{ r.flight?.gate?.code || '—' }}</p>
          </div>
          <div>
            <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em">Total Pagado</p>
            <p style="font-size:.875rem;font-weight:600;color:#10b981;margin-top:.125rem">$ {{ (+r.totalPrice).toFixed(2) }}</p>
          </div>
        </div>

        <!-- Ancillaries -->
        <div *ngIf="getActiveAncillaries(r).length" style="padding:.75rem 1.25rem 1rem;border-top:1px solid rgba(22,45,88,0.4)">
          <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:.5rem">Servicios Adicionales</p>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem">
            <span *ngFor="let a of getActiveAncillaries(r)"
                  class="badge badge-gold" style="font-size:.7rem">
              {{ a.description }}
            </span>
          </div>
        </div>
      </div>

      <div *ngIf="reservations().length === 0" style="text-align:center;padding:3rem;color:#2452a0">
        <svg xmlns="http://www.w3.org/2000/svg" style="width:48px;height:48px;margin:0 auto 1rem;color:#162d58" viewBox="0 0 256 256" fill="currentColor">
          <path d="M227.19,104.48A16,16,0,0,0,240,88.81V64a16,16,0,0,0-16-16H32A16,16,0,0,0,16,64V88.81a16,16,0,0,0,12.81,15.67,24,24,0,0,1,0,47A16,16,0,0,0,16,167.19V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V167.19a16,16,0,0,0-12.81-15.67,24,24,0,0,1,0-47Z"/>
        </svg>
        <p style="font-size:1rem;font-weight:500;color:white;margin-bottom:.5rem">Sin reservas</p>
        <p style="font-size:.875rem">Tus reservas aparecerán aquí una vez confirmadas</p>
      </div>
    </div>
  `,
})
export class ClientReservationsComponent implements OnInit {
  reservations = signal<any[]>([]);
  loading = signal(true);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any>('auth/client/profile').subscribe({
      next: p => { this.reservations.set(p.reservations || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getActiveAncillaries(r: any) {
    return (r.ancillaries || []).filter((a: any) => a.status === 'ACTIVE');
  }
}
