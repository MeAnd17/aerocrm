import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div *ngIf="loading()" class="space-y-4">
      <div class="skeleton h-48 rounded-2xl"></div>
      <div class="skeleton h-64 rounded-xl"></div>
    </div>

    <div *ngIf="!loading() && reservation()">
      <!-- Volver -->
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/reservations" class="btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/></svg>
        </a>
        <div>
          <h1 class="page-title">Detalle de Reserva</h1>
          <p class="page-subtitle font-mono text-gold-400">{{ reservation()?.bookingReference }}</p>
        </div>
      </div>

      <!-- Boarding Pass Card -->
      <div class="relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-navy-800 via-navy-700 to-navy-800 border border-gold-500/20 p-6">
        <!-- Gold decorative line -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gold-gradient"></div>
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-gold-400" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>
              <span class="text-gold-400 font-bold tracking-widest text-sm">PASE DE ABORDAJE</span>
            </div>
            <div class="flex items-center gap-6">
              <div class="text-center">
                <p class="text-4xl font-bold font-mono text-white">{{ reservation()?.flight?.route?.origin?.iataCode }}</p>
                <p class="text-xs text-navy-400 mt-1">{{ reservation()?.flight?.route?.origin?.city }}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gold-400" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>
              <div class="text-center">
                <p class="text-4xl font-bold font-mono text-white">{{ reservation()?.flight?.route?.destination?.iataCode }}</p>
                <p class="text-xs text-navy-400 mt-1">{{ reservation()?.flight?.route?.destination?.city }}</p>
              </div>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs text-navy-400 mb-1">Flight</p>
            <p class="font-mono font-bold text-white text-xl">{{ reservation()?.flight?.flightNumber }}</p>
            <p class="text-xs text-navy-400 mt-3 mb-1">Departure</p>
            <p class="font-mono text-white">{{ reservation()?.flight?.scheduledDeparture | date:'HH:mm, MMM d' }}</p>
            <p class="text-xs text-navy-400 mt-3 mb-1">Puerta</p>
            <p class="font-mono font-bold text-gold-400 text-lg">{{ reservation()?.flight?.gate?.code || '—' }}</p>
          </div>
        </div>
        <div class="border-t border-navy-600/50 mt-4 pt-4 flex items-center gap-8">
          <div>
            <p class="text-xs text-navy-400 mb-1">Pasajero</p>
            <p class="text-white font-semibold">{{ reservation()?.passenger?.firstName }} {{ reservation()?.passenger?.lastName }}</p>
          </div>
          <div>
            <p class="text-xs text-navy-400 mb-1">Clase</p>
            <p class="text-white font-semibold">{{ reservation()?.fareClase?.replace('_',' ') }}</p>
          </div>
          <div>
            <p class="text-xs text-navy-400 mb-1">Asiento</p>
            <p class="font-mono font-bold text-gold-400 text-lg">{{ reservation()?.seatNumber || 'TBA' }}</p>
          </div>
          <div class="ml-auto">
            <span class="badge text-sm px-4 py-1.5"
              [class.badge-green]="reservation()?.status === 'CONFIRMED' || reservation()?.status === 'CHECKED_IN'"
              [class.badge-yellow]="reservation()?.status === 'PENDING'"
              [class.badge-red]="reservation()?.status === 'CANCELLED'">
              {{ reservation()?.status?.replace('_',' ') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Ancillaries + Acciones -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 aero-card overflow-hidden">
          <div class="p-5 border-b border-navy-700 flex items-center justify-between">
            <h2 class="section-title mb-0">Servicios Adicionales</h2>
            <span class="text-xs text-navy-400">{{ activeAncillaries().length }} servicios activos</span>
          </div>
          <div *ngIf="reservation()?.ancillaries?.length === 0" class="p-8 text-center text-navy-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mx-auto mb-2 text-navy-600" viewBox="0 0 256 256" fill="currentColor"><path d="M227.19,104.48A16,16,0,0,0,240,88.81V64a16,16,0,0,0-16-16H32A16,16,0,0,0,16,64V88.81a16,16,0,0,0,12.81,15.67,24,24,0,0,1,0,47A16,16,0,0,0,16,167.19V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V167.19a16,16,0,0,0-12.81-15.67,24,24,0,0,1,0-47Z"/></svg>
            <p class="text-sm">Sin servicios adicionales</p>
          </div>
          <div class="divide-y divide-navy-700">
            <div *ngFor="let a of reservation()?.ancillaries" class="flex items-center justify-between p-4"
                 [class.opacity-50]="a.status === 'CANCELLED'">
              <div>
                <p class="text-sm font-medium text-white">{{ a.description }}</p>
                <p class="text-xs text-navy-400 mt-0.5">{{ a.type.replace('_',' ') }} &bull; Qty: {{ a.quantity }}</p>
              </div>
              <div class="flex items-center gap-3">
                <span class="badge text-xs" [class.badge-green]="a.status === 'ACTIVE'" [class.badge-red]="a.status === 'CANCELLED'" [class.badge-gray]="a.status === 'USED'">{{ a.status }}</span>
                <p class="font-mono text-emerald-400 font-semibold">$ {{ (+a.totalPrice).toFixed(2) }}</p>
                <button *ngIf="a.status === 'ACTIVE' && auth.hasPermission('reservations:update')"
                        (click)="cancelAncillary(a.id)"
                        class="btn-icon text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Cancelar servicio">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>
                </button>
              </div>
            </div>
          </div>
          <div class="p-4 border-t border-navy-700 flex items-center justify-between">
            <span class="text-sm text-navy-400">Precio Total</span>
            <span class="text-xl font-bold text-gold-400">$ {{ (+reservation()?.totalPrice || 0).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Acciones -->
        <div class="space-y-3">
          <div class="aero-card p-4">
            <h3 class="text-sm font-semibold text-white mb-3">Acciones</h3>
            <div class="space-y-2">
              <button *ngIf="canCheckIn()" (click)="checkIn()" class="btn-primary w-full justify-center" [disabled]="actionLoading()">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Z"/></svg>
                Check In Pasajero
              </button>
              <button *ngIf="reservation()?.status === 'CONFIRMED' && auth.hasPermission('reservations:update')"
                      (click)="cancelReservation()" class="btn-danger w-full justify-center text-sm" [disabled]="actionLoading()">
                Cancelar Reserva
              </button>
              <a [routerLink]="['/passengers', reservation()?.passenger?.id]" class="btn-ghost w-full justify-center text-sm">
                View Pasajero Profile
              </a>
              <a [routerLink]="['/flights', reservation()?.flight?.id]" class="btn-ghost w-full justify-center text-sm">
                Ver Detalle del Vuelo
              </a>
            </div>
          </div>

          <div class="aero-card p-4">
            <h3 class="text-sm font-semibold text-white mb-3">Pasajero</h3>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center font-bold text-gold-400">
                {{ reservation()?.passenger?.firstName?.[0] }}{{ reservation()?.passenger?.lastName?.[0] }}
              </div>
              <div>
                <p class="text-sm font-medium text-white">{{ reservation()?.passenger?.firstName }} {{ reservation()?.passenger?.lastName }}</p>
                <p class="text-xs text-navy-400">{{ reservation()?.passenger?.tier }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReservationDetailComponent implements OnInit {
  reservation = signal<any>(null);
  loading = signal(true);
  actionLoading = signal(false);

  constructor(private api: ApiService, private toast: ToastService, public auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get<any>(`reservations/${id}`).subscribe({
      next: r => { this.reservation.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  activeAncillaries() { return this.reservation()?.ancillaries?.filter((a: any) => a.status === 'ACTIVE') ?? []; }

  canCheckIn() {
    const r = this.reservation();
    if (!r || r.status !== 'CONFIRMED' || !this.auth.hasPermission('reservations:update')) return false;
    const dep = new Date(r.flight?.scheduledDeparture);
    const now = new Date();
    const diff = dep.getTime() - now.getTime();
    return diff <= 24 * 3600000 && diff > 0; // within 24h before departure
  }

  checkIn() {
    const id = this.reservation()?.id;
    this.actionLoading.set(true);
    this.api.patch(`reservations/${id}/status`, { status: 'CHECKED_IN' }).subscribe({
      next: () => { this.toast.success('Pasajero checked in successfully'); this.reservation.update(r => ({ ...r, status: 'CHECKED_IN' })); this.actionLoading.set(false); },
      error: err => { this.toast.error(err?.error?.message || 'Error al hacer check-in'); this.actionLoading.set(false); },
    });
  }

  cancelReservation() {
    if (!confirm('¿Cancelar esta reserva? Esta acción no se puede deshacer.')) return;
    this.actionLoading.set(true);
    this.api.patch(`reservations/${this.reservation()?.id}/status`, { status: 'CANCELLED' }).subscribe({
      next: () => { this.toast.success('Reserva cancelada'); this.reservation.update(r => ({ ...r, status: 'CANCELLED' })); this.actionLoading.set(false); },
      error: err => { this.toast.error(err?.error?.message || 'Error al cancelar'); this.actionLoading.set(false); },
    });
  }

  cancelAncillary(ancId: number) {
    const id = this.reservation()?.id;
    this.api.delete(`reservations/${id}/ancillaries/${ancId}`).subscribe({
      next: () => { this.toast.success('Service cancelled'); this.reservation.update(r => ({ ...r, ancillaries: r.ancillaries.map((a: any) => a.id === ancId ? { ...a, status: 'CANCELLED' } : a) })); },
      error: err => this.toast.error(err?.error?.message || 'Error al cancelar service'),
    });
  }
}
