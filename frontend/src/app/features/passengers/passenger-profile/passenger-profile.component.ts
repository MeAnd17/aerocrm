import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { FlightStatusLabelPipe, FlightStatusClassPipe } from '../../../shared/pipes/flight-status.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-passenger-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FlightStatusLabelPipe, FlightStatusClassPipe, RelativeTimePipe, TitleCasePipe],
  template: `
    <div *ngIf="loading()" class="space-y-4">
      <div class="skeleton h-40 rounded-2xl"></div>
      <div class="skeleton h-64 rounded-xl"></div>
    </div>

    <div *ngIf="!loading() && passenger()">
      <!-- Profile Header -->
      <div class="relative rounded-2xl overflow-hidden mb-6 h-48">
        <img src="https://images.unsplash.com/photo-1569154941061-e231b4aa8f1a?w=1200&q=80&auto=format&fit=crop"
             alt="Aircraft cabin" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-r from-navy-950/95 to-navy-900/60"></div>
        <div class="absolute inset-0 flex items-center px-8 gap-6">
          <!-- Avatar -->
          <div class="w-20 h-20 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold flex-shrink-0"
               [ngClass]="getTierAvatarClass(passenger()?.tier)">
            {{ passenger()?.firstName?.[0] }}{{ passenger()?.lastName?.[0] }}
          </div>
          <!-- Info -->
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-1">
              <h1 class="text-2xl font-bold text-white">{{ passenger()?.firstName }} {{ passenger()?.lastName }}</h1>
              <span class="badge text-xs" [ngClass]="getTierBadgeClass(passenger()?.tier)">
                {{ passenger()?.tier }}
              </span>
            </div>
            <p class="text-navy-300 text-sm">{{ passenger()?.email }}</p>
            <div class="flex flex-wrap gap-4 mt-2 text-xs text-navy-400">
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 inline mr-1" viewBox="0 0 256 256" fill="currentColor"><path d="M128,16a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,16Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,192Z"/></svg>
                {{ passenger()?.nationality }}
              </span>
              <span *ngIf="passenger()?.frequentFlyerNumber" class="font-mono text-gold-400">
                {{ passenger()?.frequentFlyerNumber }}
              </span>
              <span>Miembro desde {{ passenger()?.createdAt | date:'MMM yyyy' }}</span>
            </div>
          </div>
          <!-- Stats bar -->
          <div class="hidden lg:flex gap-6 text-center">
            <div>
              <p class="text-xl font-bold text-white">{{ passenger()?.stats?.totalFlights }}</p>
              <p class="text-xs text-navy-400">Flights</p>
            </div>
            <div class="border-l border-navy-700 pl-6">
              <p class="text-xl font-bold text-gold-400">{{ (passenger()?.stats?.totalMiles || 0).toLocaleString() }}</p>
              <p class="text-xs text-navy-400">Miles</p>
            </div>
            <div class="border-l border-navy-700 pl-6">
              <p class="text-xl font-bold text-emerald-400">$ {{ (passenger()?.stats?.totalSpend || 0).toLocaleString() }}</p>
              <p class="text-xs text-navy-400">Gasto total</p>
            </div>
          </div>
        </div>
        <!-- Editar button -->
        <div class="absolute top-4 right-4 flex gap-2">
          <a [routerLink]="['/passengers', passenger()?.id, 'edit']" class="btn-secondary text-sm py-1.5 px-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 256 256" fill="currentColor"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H216a8,8,0,0,0,0-16H115.32l112-112A16,16,0,0,0,227.31,73.37ZM92.69,208H48V163.31l88-88L180.69,120Z"/></svg>
            Editar
          </a>
          <a routerLink="/passengers" class="btn-ghost text-sm py-1.5 px-3">Volver</a>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-5 bg-navy-800 rounded-xl p-1 overflow-x-auto">
        <button *ngFor="let tab of tabs" (click)="activeTab.set(tab.id)"
                class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0"
                [class.bg-navy-700]="activeTab() === tab.id"
                [class.text-white]="activeTab() === tab.id"
                [class.text-navy-400]="activeTab() !== tab.id">
          <span [innerHTML]="tab.icon" class="w-4 h-4"></span>
          {{ tab.label }}
          <span *ngIf="tab.count" class="badge badge-gold text-xs ml-1">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Tab: Información Personal -->
      <div *ngIf="activeTab() === 'info'" class="aero-card p-6">
        <h2 class="section-title">Información Personalrmation</h2>
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let field of personalFields">
            <p class="text-xs text-navy-400 font-medium uppercase tracking-wider mb-1">{{ field.label }}</p>
            <p class="text-white text-sm">{{ field.value || '—' }}</p>
          </div>
        </div>
        <div class="divider"></div>
        <h2 class="section-title">Preferencias de Viaje</h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5" [class.text-emerald-400]="passenger()?.preferenceWindow" [class.text-navy-600]="!passenger()?.preferenceWindow">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>
            </span>
            <span class="text-sm text-navy-300">Asiento ventana</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-5 h-5" [class.text-emerald-400]="passenger()?.preferenceAisle" [class.text-navy-600]="!passenger()?.preferenceAisle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>
            </span>
            <span class="text-sm text-navy-300">Asiento pasillo</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-5 h-5" [class.text-emerald-400]="passenger()?.preferenceSpecialAssistance" [class.text-navy-600]="!passenger()?.preferenceSpecialAssistance">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>
            </span>
            <span class="text-sm text-navy-300">Asistencia especial</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gold-400 text-sm font-medium">{{ passenger()?.preferenceMeal | titlecase }}</span>
            <span class="text-xs text-navy-400">comida</span>
          </div>
        </div>
        <div *ngIf="passenger()?.notes" class="mt-4">
          <p class="text-xs text-navy-400 font-medium uppercase tracking-wider mb-2">Notas Internas</p>
          <p class="text-sm text-navy-300 bg-navy-900/50 rounded-lg px-4 py-3 border border-navy-700">{{ passenger()?.notes }}</p>
        </div>
      </div>

      <!-- Tab: Documentos -->
      <div *ngIf="activeTab() === 'documents'" class="aero-card p-6">
        <h2 class="section-title">Travel Documentos</h2>
        <div class="bg-navy-900/50 border border-navy-700 rounded-xl p-5">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400" viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-32-80a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,136Zm0,32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z"/></svg>
              </div>
              <div>
                <p class="font-semibold text-white">Passport</p>
                <p class="font-mono text-gold-400 text-sm">{{ passenger()?.passportNumber }}</p>
              </div>
            </div>
            <span class="badge text-xs" [ngClass]="getPassportStatusClass()">{{ getPassportStatusLabel() }}</span>
          </div>
          <div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-navy-700">
            <div>
              <p class="text-xs text-navy-400 mb-1">Nacionalidad</p>
              <p class="text-white font-medium">{{ passenger()?.nationality }}</p>
            </div>
            <div>
              <p class="text-xs text-navy-400 mb-1">Fecha de nacimiento</p>
              <p class="text-white font-medium">{{ passenger()?.dateOfBirth | date:'mediumDate' }}</p>
            </div>
            <div>
              <p class="text-xs text-navy-400 mb-1">Vence</p>
              <p class="font-medium" [ngClass]="isPassportExpiringSoon() ? 'text-amber-400' : 'text-white'">
                {{ passenger()?.passportExpiry | date:'mediumDate' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Historial de Vuelos -->
      <div *ngIf="activeTab() === 'history'" class="aero-card overflow-hidden">
        <div class="p-5 border-b border-navy-700">
          <h2 class="section-title mb-0">Historial de Vuelos</h2>
        </div>
        <table class="aero-table">
          <thead>
            <tr>
              <th>Flight</th>
              <th>Route</th>
              <th>Class</th>
              <th>Date</th>
              <th class="text-right">Millas ganadas</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let h of passenger()?.flightHistory">
              <td class="font-mono font-semibold text-white">{{ h.flight?.flightNumber }}</td>
              <td class="text-sm text-navy-300">
                <span class="font-mono text-xs">{{ h.flight?.route?.origin?.iataCode }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 inline mx-1 text-navy-500" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>
                <span class="font-mono text-xs">{{ h.flight?.route?.destination?.iataCode }}</span>
              </td>
              <td><span class="badge text-xs badge-navy">{{ h.fareClass.replace('_',' ') }}</span></td>
              <td class="text-xs text-navy-400">{{ h.completedAt | date:'mediumDate' }}</td>
              <td class="text-right font-mono text-gold-400 font-semibold">+{{ h.milesEarned.toLocaleString() }}</td>
            </tr>
            <tr *ngIf="!passenger()?.flightHistory?.length">
              <td colspan="5" class="text-center text-navy-400 py-8">Sin historial de vuelos</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab: Active Reservas -->
      <div *ngIf="activeTab() === 'reservations'" class="aero-card overflow-hidden">
        <div class="p-5 border-b border-navy-700">
          <div class="flex items-center justify-between">
            <h2 class="section-title mb-0">Reservas</h2>
            <a routerLink="/reservations/new" [queryParams]="{passengerId: passenger()?.id}" class="btn-secondary text-xs py-1.5 px-3">Nueva Reserva</a>
          </div>
        </div>
        <table class="aero-table">
          <thead>
            <tr><th>Reference</th><th>Flight</th><th>Class</th><th>Seat</th><th>Status</th><th>Price</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of passenger()?.reservations">
              <td class="font-mono text-gold-400 font-semibold text-xs">{{ r.bookingReference }}</td>
              <td class="font-mono text-xs text-white">
                {{ r.flight?.flightNumber }}
                <span class="text-navy-400 ml-1">{{ r.flight?.route?.origin?.iataCode }} → {{ r.flight?.route?.destination?.iataCode }}</span>
              </td>
              <td><span class="badge text-xs badge-navy">{{ r.fareClass.replace('_',' ') }}</span></td>
              <td class="font-mono text-xs text-navy-300">{{ r.seatNumber || '—' }}</td>
              <td>
                <span class="badge text-xs"
                  [class.badge-green]="r.status === 'CONFIRMED' || r.status === 'CHECKED_IN'"
                  [class.badge-yellow]="r.status === 'PENDING'"
                  [class.badge-red]="r.status === 'CANCELLED'"
                  [class.badge-gray]="r.status === 'NO_SHOW'">
                  {{ r.status.replace('_',' ') }}
                </span>
              </td>
              <td class="font-mono text-emerald-400">$ {{ (+r.totalPrice).toFixed(2) }}</td>
            </tr>
            <tr *ngIf="!passenger()?.reservations?.length">
              <td colspan="6" class="text-center text-navy-400 py-8">Sin reservas</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab: Soporte -->
      <div *ngIf="activeTab() === 'support'" class="aero-card overflow-hidden">
        <div class="p-5 border-b border-navy-700">
          <h2 class="section-title mb-0">Soporte Tickets</h2>
        </div>
        <div class="divide-y divide-navy-700">
          <div *ngFor="let t of passenger()?.supportTickets" class="p-4 hover:bg-navy-800/40 transition-colors">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-medium text-white">{{ t.subject }}</p>
                <p class="text-xs text-navy-400 mt-0.5">{{ t.ticketNumber }} &bull; {{ t.createdAt | relativeTime }}</p>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span class="badge text-xs"
                  [class.badge-red]="t.priority === 'URGENT'"
                  [class.badge-orange]="t.priority === 'HIGH'"
                  [class.badge-yellow]="t.priority === 'MEDIUM'"
                  [class.badge-gray]="t.priority === 'LOW'">
                  {{ t.priority }}
                </span>
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
          <div *ngIf="!passenger()?.supportTickets?.length" class="p-8 text-center text-navy-400 text-sm">
            Sin tickets de soporte
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PassengerProfileComponent implements OnInit {
  passenger = signal<any>(null);
  loading = signal(true);
  activeTab = signal('info');

  tabs = [
    { id: 'info', label: 'Información Personal', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8Z"/></svg>`, count: null },
    { id: 'documents', label: 'Documentos', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34Z"/></svg>`, count: null },
    { id: 'history', label: 'Historial de Vuelos', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>`, count: null },
    { id: 'reservations', label: 'Reservas', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M227.19,104.48A16,16,0,0,0,240,88.81V64a16,16,0,0,0-16-16H32A16,16,0,0,0,16,64V88.81a16,16,0,0,0,12.81,15.67,24,24,0,0,1,0,47A16,16,0,0,0,16,167.19V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V167.19a16,16,0,0,0-12.81-15.67,24,24,0,0,1,0-47Z"/></svg>`, count: null },
    { id: 'support', label: 'Soporte', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Z"/></svg>`, count: null },
  ];

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get<any>(`passengers/${id}/profile-360`).subscribe({
      next: p => {
        this.passenger.set(p);
        this.loading.set(false);
        // Update tab counts
        this.tabs[2].count = p.flightHistory?.length || null;
        this.tabs[3].count = p.reservations?.length || null;
        this.tabs[4].count = p.stats?.openTickets || null;
      },
      error: () => this.loading.set(false),
    });
  }

  get personalFields() {
    const p = this.passenger();
    if (!p) return [];
    return [
      { label: 'Full Name', value: `${p.firstName} ${p.lastName}` },
      { label: 'Email', value: p.email },
      { label: 'Phone', value: p.phone },
      { label: 'Nacionalidad', value: p.nationality },
      { label: 'Fecha de nacimiento', value: p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null },
      { label: 'Meal Preference', value: p.preferenceMeal ? p.preferenceMeal.charAt(0).toUpperCase() + p.preferenceMeal.slice(1) : null },
    ];
  }

  getTierBadgeClass(tier: string) {
    const map: Record<string, string> = { STANDARD: 'badge-gray', SILVER: 'badge-navy', GOLD: 'badge-gold', PLATINUM: 'badge-purple' };
    return map[tier] || 'badge-gray';
  }

  getTierAvatarClass(tier: string) {
    const map: Record<string, string> = {
      STANDARD: 'bg-navy-700 text-navy-300 border-2 border-navy-600',
      SILVER: 'bg-slate-600/30 text-slate-300 border-2 border-slate-500',
      GOLD: 'bg-gold-500/20 text-gold-400 border-2 border-gold-500',
      PLATINUM: 'bg-purple-500/20 text-purple-400 border-2 border-purple-500',
    };
    return map[tier] || 'bg-navy-700 text-navy-300 border-2 border-navy-600';
  }

  getPassportStatusClass() {
    const expiry = new Date(this.passenger()?.passportExpiry);
    const now = new Date();
    const sixMonths = new Date(); sixMonths.setMonth(sixMonths.getMonth() + 6);
    if (expiry < now) return 'badge-red';
    if (expiry < sixMonths) return 'badge-yellow';
    return 'badge-green';
  }

  getPassportStatusLabel() {
    const expiry = new Date(this.passenger()?.passportExpiry);
    const now = new Date();
    const sixMonths = new Date(); sixMonths.setMonth(sixMonths.getMonth() + 6);
    if (expiry < now) return 'Vencido';
    if (expiry < sixMonths) return 'Por vencer';
    return 'Vigente';
  }

  isPassportExpiringSoon() {
    const expiry = new Date(this.passenger()?.passportExpiry);
    const oneYear = new Date(); oneYear.setFullYear(oneYear.getFullYear() + 1);
    return expiry < oneYear;
  }
}
