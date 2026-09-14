import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-reservas-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, RelativeTimePipe],
  template: `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="page-title">Reservas</h1>
        <p class="page-subtitle">Gestión de reservas y servicios adicionales</p>
      </div>
      <a *ngIf="auth.hasPermission('reservas:create')" routerLink="/reservas/new" class="btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
        Nueva Reserva
      </a>
    </div>

    <!-- Filters -->
    <div class="aero-card p-4 mb-5 flex flex-wrap gap-3 items-center">
      <select [(ngModel)]="statusFilter" (ngModelChange)="load()" class="aero-input py-2 text-sm w-44">
        <option value="">Todos los estados</option>
        <option value="CONFIRMED">Confirmada</option>
        <option value="PENDING">Pendiente</option>
        <option value="CHECKED_IN">Con check-in</option>
        <option value="CANCELLED">Cancelada</option>
        <option value="NO_SHOW">No presentado</option>
      </select>
      <select [(ngModel)]="fareFilter" (ngModelChange)="load()" class="aero-input py-2 text-sm w-44">
        <option value="">Todas las clases</option>
        <option value="ECONOMY">Economy</option>
        <option value="PREMIUM_ECONOMY">Premium Economy</option>
        <option value="BUSINESS">Business</option>
        <option value="FIRST_CLASS">First Clase</option>
      </select>
      <span class="text-xs text-navy-400 ml-auto">{{ total() }} reservas</span>
    </div>

    <!-- Table -->
    <div class="aero-card overflow-hidden">
      <div *ngIf="loading()" class="p-6 space-y-3">
        <div *ngFor="let _ de [1,2,3,4,5]" class="skeleton h-14 rounded-lg"></div>
      </div>
      <div *ngIf="!loading()">
        <table class="aero-table">
          <thead>
            <tr>
              <th>Referencia</th>
              <th>Pasajero</th>
              <th>Vuelo</th>
              <th>Clase</th>
              <th>Asiento</th>
              <th>Servicios</th>
              <th>Total</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r de reservas()">
              <td class="font-mono text-gold-400 font-semibold text-xs">{{ r.bookingReferencia }}</td>
              <td>
                <a [routerLink]="['/passengers', r.passenger?.id]" class="hover:text-gold-400 transition-colors">
                  <p class="text-sm text-white font-medium">{{ r.passenger?.firstName }} {{ r.passenger?.lastName }}</p>
                  <p class="text-xs text-navy-400">{{ r.passenger?.email }}</p>
                </a>
              </td>
              <td>
                <p class="font-mono text-sm font-semibold text-white">{{ r.flight?.flightNumber }}</p>
                <p class="text-xs text-navy-400 font-mono">{{ r.flight?.route?.origin?.iataCode }} → {{ r.flight?.route?.destination?.iataCode }}</p>
              </td>
              <td><span class="badge badge-navy text-xs">{{ r.fareClase.replace('_',' ') }}</span></td>
              <td class="font-mono text-xs text-navy-300">{{ r.seatNumber || '—' }}</td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span *ngFor="let a de r.ancillaries?.slice(0,2)" class="badge badge-gold text-xs">
                    {{ a.type.split('_')[0] }}
                  </span>
                  <span *ngIf="r.ancillaries?.length > 2" class="badge badge-gray text-xs">+{{ r.ancillaries.length - 2 }}</span>
                  <span *ngIf="!r.ancillaries?.length" class="text-xs text-navy-600">—</span>
                </div>
              </td>
              <td class="font-mono text-emerald-400 font-semibold">$ {{ (+r.totalPrice).toFixed(2) }}</td>
              <td>
                <span class="badge text-xs"
                  [class.badge-green]="r.status === 'CONFIRMED' || r.status === 'CHECKED_IN'"
                  [class.badge-yellow]="r.status === 'PENDING'"
                  [class.badge-red]="r.status === 'CANCELLED'"
                  [class.badge-gray]="r.status === 'NO_SHOW'">
                  {{ r.status.replace('_',' ') }}
                </span>
              </td>
              <td class="text-right">
                <a [routerLink]="['/reservas', r.id]" class="btn-icon" title="View details">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76Z"/></svg>
                </a>
              </td>
            </tr>
            <tr *ngIf="reservas().length === 0">
              <td colspan="9" class="text-center text-navy-400 py-10">
                <p class="font-medium">No reservas found</p>
                <a routerLink="/reservas/new" class="btn-primary mt-3 text-sm inline-flex">Crear Primera Reserva</a>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Pagination -->
        <div *ngIf="totalPáginas() > 1" class="flex items-center justify-between px-4 py-3 border-t border-navy-700">
          <span class="text-xs text-navy-400">Página {{ page() }} de {{ totalPáginas() }}</span>
          <div class="flex gap-2">
            <button (click)="changePágina(-1)" [disabled]="page()===1" class="btn-ghost text-sm py-1 px-3">&larr; Ant</button>
            <button (click)="changePágina(1)" [disabled]="page()===totalPáginas()" class="btn-ghost text-sm py-1 px-3">Sig &rarr;</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReservasListComponent implements OnInit {
  reservas = signal<any[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  totalPáginas = signal(1);
  statusFilter = '';
  fareFilter = '';

  constructor(private api: ApiService, private toast: ToastService, public auth: AuthService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: any = { page: this.page(), limit: 15 };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.fareFilter) params.fareClase = this.fareFilter;
    this.api.get<any>('reservas', params).subscribe({
      next: res => { this.reservas.set(res.data); this.total.set(res.total); this.totalPáginas.set(res.totalPáginas); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  changePágina(dir: number) { this.page.update(p => p + dir); this.load(); }
}
