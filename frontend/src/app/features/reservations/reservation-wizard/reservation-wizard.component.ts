import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

const FARE_PRICES: Record<string, number> = {
  ECONOMY: 320, PREMIUM_ECONOMY: 650, BUSINESS: 1850, FIRST_CLASS: 4200,
};

const ANCILLARY_CATALOG = [
  { type: 'EXTRA_BAGGAGE', label: 'Equipaje Extra', desc: 'Maleta adicional de 23kg', price: 45, máxQty: 5, icon: 'bag' },
  { type: 'PREFERRED_SEAT', label: 'Asiento Preferencial', desc: 'Elige tu asiento con anticipación', price: 25, máxQty: 1, icon: 'seat' },
  { type: 'LOUNGE_ACCESS', label: 'Lounge Access', desc: 'Salón VIP del aeropuerto para hasta 4 personas', price: 85, máxQty: 4, icon: 'lounge' },
  { type: 'TRAVEL_INSURANCE', label: 'Seguro de Viaje', desc: 'Cobertura integral de viaje', price: 35, máxQty: 1, icon: 'insurance' },
  { type: 'GOURMET_PACKAGE', label: 'Gourmet Package', desc: 'Premium in-flight dining', price: 55, máxQty: 1, icon: 'food' },
  { type: 'PRIORITY_BOARDING', label: 'Priority Boarding', desc: 'Board before general passengers', price: 15, máxQty: 1, icon: 'priority' },
  { type: 'CAR_RENTAL', label: 'Car Rental', desc: 'Vehículo en destino', price: 120, máxQty: 1, icon: 'car' },
  { type: 'HOTEL_PACKAGE', label: 'Hotel Package', desc: 'Alojamiento por noche', price: 200, máxQty: 7, icon: 'hotel' },
];

@Component({
  selector: 'app-reservation-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="máx-w-3xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/reservations" class="btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/></svg>
        </a>
        <div>
          <h1 class="page-title">New Reservation</h1>
          <p class="page-subtitle">Book a flight and add ancillary services</p>
        </div>
      </div>

      <!-- Step indicator -->
      <div class="flex items-center mb-8">
        <ng-container *ngFor="let s of steps; let i = index">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all"
                 [class.bg-gold-500]="step() > i"
                 [class.border-gold-500]="step() >= i"
                 [class.bg-navy-700]="step() < i"
                 [class.border-navy-600]="step() < i"
                 [class.text-navy-950]="step() > i"
                 [class.text-gold-400]="step() === i"
                 [class.text-navy-500]="step() < i">
              <svg *ngIf="step() > i" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z"/></svg>
              <span *ngIf="step() <= i">{{ i + 1 }}</span>
            </div>
            <span class="text-sm font-medium" [class.text-gold-400]="step() === i" [class.text-white]="step() > i" [class.text-navy-500]="step() < i">{{ s }}</span>
          </div>
          <div *ngIf="i < steps.length - 1" class="flex-1 h-0.5 mx-3 transition-all" [class.bg-gold-500]="step() > i" [class.bg-navy-700]="step() <= i"></div>
        </ng-container>
      </div>

      <!-- Step 1: Seleccionar Vuelo -->
      <div *ngIf="step() === 0" class="aero-card p-6 animate-enter">
        <h2 class="section-title">Seleccionar Vuelo</h2>
        <div class="form-group mb-4">
          <label class="aero-label">Clase de tarifa *</label>
          <div class="grid grid-cols-2 gap-3">
            <button *ngFor="let fc of fareClasses" (click)="selectedFare.set(fc.value)"
                    class="p-3 rounded-xl border-2 text-left transition-all"
                    [class.border-gold-500]="selectedFare() === fc.value"
                    [class.border-navy-600]="selectedFare() !== fc.value"
                    [style.background]="selectedFare() === fc.value ? 'rgba(201,168,76,0.1)' : ''">
              <p class="font-semibold text-sm text-white">{{ fc.label }}</p>
              <p class="text-gold-400 font-bold text-lg">$ {{ fc.price.toLocaleString() }}</p>
              <p class="text-xs text-navy-400">precio base por persona</p>
            </button>
          </div>
        </div>
        <div *ngIf="loadingFlights()" class="space-y-2">
          <div *ngFor="let _ of [1,2,3]" class="skeleton h-16 rounded-lg"></div>
        </div>
        <div *ngIf="!loadingFlights()">
          <label class="aero-label">Vuelos disponibles *</label>
          <div class="space-y-2 máx-h-72 overflow-y-auto pr-1">
            <button *ngFor="let f of availableFlights()" (click)="selectFlight(f)"
                    class="w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between"
                    [class.border-gold-500]="selectedFlight()?.id === f.id"
                    [style.background]="selectedFlight()?.id === f.id ? 'rgba(201,168,76,0.05)' : ''"
                    [class.border-navy-700]="selectedFlight()?.id !== f.id"
                    [disabled]="f.status === 'CANCELLED'">
              <div class="flex items-center gap-3">
                <span class="font-mono font-bold text-white">{{ f.flightNumber }}</span>
                <span class="text-navy-400 text-sm">{{ f.route?.origin?.iataCode }} → {{ f.route?.destination?.iataCode }}</span>
                <span class="text-xs text-navy-500">{{ f.scheduledDeparture | date:'MMM d, HH:mm' }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="badge text-xs"
                  [class.badge-green]="f.status === 'ON_TIME'"
                  [class.badge-yellow]="f.status === 'DELAYED'"
                  [class.badge-red]="f.status === 'CANCELLED'"
                  [class.badge-purple]="f.status === 'BOARDING'">
                  {{ f.status.replace('_',' ') }}
                </span>
                <span class="text-xs text-navy-400">{{ f.gate?.code || '—' }}</span>
                <span *ngIf="selectedFlight()?.id === f.id">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gold-400" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>
                </span>
              </div>
            </button>
          </div>
          <p *ngIf="availableFlights().length === 0" class="text-center text-navy-400 py-6 text-sm">Sin vuelos disponibles</p>
        </div>
        <p *ngIf="step1Error()" class="form-error mt-3">{{ step1Error() }}</p>
        <div class="flex justify-end mt-6">
          <button (click)="goStep1()" class="btn-primary" [disabled]="!selectedFlight() || !selectedFare()">
            Siguiente: Pasajero
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>
          </button>
        </div>
      </div>

      <!-- Step 2: Pasajero + Seat -->
      <div *ngIf="step() === 1" class="aero-card p-6 animate-enter">
        <h2 class="section-title">Select Pasajero y Asiento</h2>
        <div class="form-group">
          <label class="aero-label">Buscar Pasajero *</label>
          <input type="text" [(ngModel)]="passengerSearch" (ngModelChange)="searchPasajeros($event)"
                 placeholder="Buscar por nombre, correo o pasaporte…" class="aero-input" />
        </div>
        <div *ngIf="passengerResults().length" class="space-y-2 mb-4 máx-h-48 overflow-y-auto">
          <button *ngFor="let p of passengerResults()" (click)="selectPasajero(p)"
                  class="w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3"
                  [class.border-gold-500]="selectedPasajero()?.id === p.id"
                  [style.background]="selectedPasajero()?.id === p.id ? 'rgba(201,168,76,0.05)' : ''"
                  [class.border-navy-700]="selectedPasajero()?.id !== p.id">
            <div class="w-9 h-9 rounded-full bg-navy-700 flex items-center justify-center text-sm font-bold text-gold-400 flex-shrink-0">
              {{ p.firstName[0] }}{{ p.lastName[0] }}
            </div>
            <div>
              <p class="text-sm font-medium text-white">{{ p.firstName }} {{ p.lastName }}</p>
              <p class="text-xs text-navy-400">{{ p.email }} &bull; {{ p.tier }}</p>
            </div>
            <span *ngIf="selectedPasajero()?.id === p.id" class="ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gold-400" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Z"/></svg>
            </span>
          </button>
        </div>

        <!-- Seat assignment -->
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="aero-label">Número de Asiento</label>
            <input type="text" [(ngModel)]="seatNumber" placeholder="12A" máxlength="4"
                   pattern="[0-9]{1,3}[A-F]"
                   class="aero-input font-mono uppercase"
                   (input)="seatNumber = seatNumber.toUpperCase()"
                   #seatF="ngModel" />
            <p class="text-xs text-navy-500 mt-1">Format: row + letter, e.g. 12A, 34C</p>
            <p *ngIf="seatF.invalid && seatF.touched" class="form-error">Formato de asiento inválido (p.ej. 12A)</p>
          </div>
        </div>

        <!-- Selected summary -->
        <div *ngIf="selectedFlight() && selectedPasajero()" class="mt-4 p-3 bg-navy-900/50 rounded-lg border border-navy-700 text-sm">
          <p class="text-navy-400 text-xs mb-2 font-medium uppercase tracking-wider">Resumen hasta ahora</p>
          <div class="flex justify-between">
            <span class="text-navy-300">Flight</span>
            <span class="font-mono text-white font-semibold">{{ selectedFlight()?.flightNumber }} &bull; {{ selectedFare() }}</span>
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-navy-300">Pasajero</span>
            <span class="text-white">{{ selectedPasajero()?.firstName }} {{ selectedPasajero()?.lastName }}</span>
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-navy-300">Precio base</span>
            <span class="text-gold-400 font-semibold">$ {{ baseFarePrice().toFixed(2) }}</span>
          </div>
        </div>

        <p *ngIf="step2Error()" class="form-error mt-3">{{ step2Error() }}</p>
        <div class="flex justify-between mt-6">
          <button (click)="step.set(0)" class="btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/></svg>
            Volver
          </button>
          <button (click)="goStep2()" class="btn-primary" [disabled]="!selectedPasajero()">
            Siguiente: Servicios
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>
          </button>
        </div>
      </div>

      <!-- Step 3: Ancillaries -->
      <div *ngIf="step() === 2" class="animate-enter">
        <div class="aero-card p-6 mb-4">
          <h2 class="section-title">Agregar Servicios <span class="text-navy-400 text-sm font-normal">(opcional)</span></h2>
          <div class="grid grid-cols-2 gap-3">
            <div *ngFor="let item of ancillaryCatalog"
                 class="p-4 rounded-xl border-2 transition-all"
                 [class.border-gold-500]="selectedAncillaries[item.type]?.qty > 0"
                 [style.background]="selectedAncillaries[item.type]?.qty > 0 ? 'rgba(201,168,76,0.05)' : ''"
                 [class.border-navy-700]="!(selectedAncillaries[item.type]?.qty > 0)">
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span [innerHTML]="getAncillaryIcon(item.icon)" class="w-5 h-5 text-gold-400 flex-shrink-0"></span>
                  <p class="font-semibold text-sm text-white">{{ item.label }}</p>
                </div>
                <p class="text-gold-400 font-bold text-sm">$ {{ item.price }}/ea</p>
              </div>
              <p class="text-xs text-navy-400 mb-3">{{ item.desc }}</p>
              <!-- Qty stepper -->
              <div class="flex items-center gap-3">
                <button (click)="decAncillary(item)" class="w-7 h-7 rounded-lg bg-navy-700 hover:bg-navy-600 flex items-center justify-center text-white font-bold transition-colors" [disabled]="!selectedAncillaries[item.type]?.qty">−</button>
                <span class="font-mono font-bold text-white w-4 text-center">{{ selectedAncillaries[item.type]?.qty || 0 }}</span>
                <button (click)="incAncillary(item)" class="w-7 h-7 rounded-lg bg-navy-700 hover:bg-navy-600 flex items-center justify-center text-white font-bold transition-colors" [disabled]="(selectedAncillaries[item.type]?.qty || 0) >= item.máxQty">+</button>
                <span class="text-xs text-navy-500">máx {{ item.máxQty }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Price summary -->
        <div class="aero-card p-5 mb-4 bg-navy-800/60">
          <h3 class="font-semibold text-white mb-3">Resumen de Precio</h3>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-navy-400">{{ selectedFare() }} tarifa base</span>
              <span class="text-white">$ {{ baseFarePrice().toFixed(2) }}</span>
            </div>
            <ng-container *ngFor="let item of ancillaryCatalog">
              <div *ngIf="selectedAncillaries[item.type]?.qty > 0" class="flex justify-between text-sm">
                <span class="text-navy-400">{{ item.label }} × {{ selectedAncillaries[item.type].qty }}</span>
                <span class="text-white">$ {{ (item.price * selectedAncillaries[item.type].qty).toFixed(2) }}</span>
              </div>
            </ng-container>
            <div class="border-t border-navy-700 pt-2 flex justify-between font-bold">
              <span class="text-white">Total</span>
              <span class="text-gold-400 text-xl font-bold">$ {{ totalPrice().toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="serverError()" class="mb-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" viewBox="0 0 256 256" fill="currentColor"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09Z"/></svg>
          {{ serverError() }}
        </div>

        <div class="flex justify-between">
          <button (click)="step.set(1)" class="btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/></svg>
            Volver
          </button>
          <button (click)="confirm()" class="btn-primary px-8" [disabled]="saving()">
            <svg *ngIf="saving()" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            <svg *ngIf="!saving()" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H216a8,8,0,0,0,0-16H115.32l112-112A16,16,0,0,0,227.31,73.37Z"/></svg>
            {{ saving() ? 'Confirmando…' : 'Confirmar Reserva' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ReservationWizardComponent implements OnInit {
  step = signal(0);
  steps = ['Seleccionar Vuelo', 'Pasajero y Asiento', 'Servicios y Confirmar'];

  availableFlights = signal<any[]>([]);
  loadingFlights = signal(true);
  selectedFlight = signal<any>(null);
  selectedFare = signal('ECONOMY');
  selectedPasajero = signal<any>(null);
  seatNumber = '';
  passengerSearch = '';
  passengerResults = signal<any[]>([]);
  selectedAncillaries: Record<string, { qty: number; price: number }> = {};
  saving = signal(false);
  serverError = signal('');
  step1Error = signal('');
  step2Error = signal('');

  fareClasses = [
    { value: 'ECONOMY', label: 'Economy', price: FARE_PRICES['ECONOMY'] },
    { value: 'PREMIUM_ECONOMY', label: 'Premium Economy', price: FARE_PRICES['PREMIUM_ECONOMY'] },
    { value: 'BUSINESS', label: 'Business', price: FARE_PRICES['BUSINESS'] },
    { value: 'FIRST_CLASS', label: 'First Class', price: FARE_PRICES['FIRST_CLASS'] },
  ];

  ancillaryCatalog = ANCILLARY_CATALOG;

  constructor(private api: ApiService, private toast: ToastService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.api.get<any>('flights', { limit: 50 }).subscribe({
      next: res => {
        this.availableFlights.set(res.data.filter((f: any) => !['CANCELLED', 'DEPARTED', 'LANDED'].includes(f.status)));
        this.loadingFlights.set(false);
      },
      error: () => this.loadingFlights.set(false),
    });
    const passengerId = this.route.snapshot.queryParamMap.get('passengerId');
    if (passengerId) {
      this.api.get<any>(`passengers/${passengerId}`).subscribe(p => { this.selectedPasajero.set(p); this.passengerSearch = `${p.firstName} ${p.lastName}`; this.passengerResults.set([p]); });
    }
  }

  selectFlight(f: any) { if (f.status !== 'CANCELLED') this.selectedFlight.set(f); }
  selectPasajero(p: any) { this.selectedPasajero.set(p); }

  searchPasajeros(q: string) {
    if (q.length < 2) { this.passengerResults.set([]); return; }
    this.api.get<any>('passengers', { search: q, limit: 8 }).subscribe(res => this.passengerResults.set(res.data));
  }

  baseFarePrice = computed(() => FARE_PRICES[this.selectedFare()] ?? 0);

  totalPrice = computed(() => {
    let total = this.baseFarePrice();
    for (const item of this.ancillaryCatalog) {
      const qty = this.selectedAncillaries[item.type]?.qty || 0;
      total += qty * item.price;
    }
    return Math.máx(0.01, total);
  });

  incAncillary(item: any) {
    const curr = this.selectedAncillaries[item.type]?.qty || 0;
    if (curr < item.máxQty) this.selectedAncillaries[item.type] = { qty: curr + 1, price: item.price };
  }

  decAncillary(item: any) {
    const curr = this.selectedAncillaries[item.type]?.qty || 0;
    if (curr > 0) this.selectedAncillaries[item.type] = { qty: curr - 1, price: item.price };
  }

  goStep1() {
    this.step1Error.set('');
    if (!this.selectedFlight()) { this.step1Error.set('Por favor selecciona un vuelo'); return; }
    if (!this.selectedFare()) { this.step1Error.set('Por favor selecciona una clase'); return; }
    this.step.set(1);
  }

  goStep2() {
    this.step2Error.set('');
    if (!this.selectedPasajero()) { this.step2Error.set('Por favor selecciona un pasajero'); return; }
    this.step.set(2);
  }

  async confirm() {
    this.saving.set(true);
    this.serverError.set('');
    this.api.post<any>('reservations', {
      passengerId: this.selectedPasajero()!.id,
      flightId: this.selectedFlight()!.id,
      fareClass: this.selectedFare(),
      seatNumber: this.seatNumber || undefined,
      totalPrice: this.totalPrice(),
      currency: 'USD',
    }).subscribe({
      next: async (res) => {
        // Add ancillaries
        const ancItems = this.ancillaryCatalog.filter(i => (this.selectedAncillaries[i.type]?.qty || 0) > 0);
        for (const item of ancItems) {
          const qty = this.selectedAncillaries[item.type].qty;
          await this.api.post(`reservations/${res.id}/ancillaries`, {
            type: item.type, description: item.label, quantity: qty, unitPrice: item.price,
          }).toPromise().catch(() => {});
        }
        this.toast.success(`Reservation ${res.bookingReference} confirmed! Total: $${this.totalPrice().toFixed(2)}`);
        this.router.navigate(['/reservations', res.id]);
      },
      error: err => {
        this.saving.set(false);
        const msg = err?.error?.message;
        this.serverError.set(Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al crear la reserva'));
      },
    });
  }

  getAncillaryIcon(icon: string) {
    const icons: Record<string, string> = {
      bag: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M208,72H176V56a24,24,0,0,0-24-24H104A24,24,0,0,0,80,56V72H48A24,24,0,0,0,24,96V200a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V96A24,24,0,0,0,208,72ZM96,56a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8V72H96Z"/></svg>`,
      seat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M208,136H80V48A16,16,0,0,0,48,48V208a8,8,0,0,0,16,0V184H208a16,16,0,0,0,0-32Z"/></svg>`,
      lounge: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M240,208H224V96a16,16,0,0,0-16-16H144V48a16,16,0,0,0-16-16H48A16,16,0,0,0,32,48V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM48,48h80V208H48ZM144,208V96h64V208Z"/></svg>`,
      insurance: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M208,40H48A16,16,0,0,0,32,56V200a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V56A16,16,0,0,0,208,40Zm0,160H48V56H208V200Zm-48-92H136V96a8,8,0,0,0-16,0v12H108a8,8,0,0,0,0,16h12v12a8,8,0,0,0,16,0V136h12a8,8,0,0,0,0-16Z"/></svg>`,
      food: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a96,96,0,1,1-96-96A96.11,96.11,0,0,1,224,128Zm-16,0a80,80,0,1,0-80,80A80.09,80.09,0,0,0,208,128ZM88,76a8,8,0,0,0-8,8v40a32,32,0,0,0,24,31V208a8,8,0,0,0,16,0V155a32,32,0,0,0,24-31V84a8,8,0,0,0-16,0v32H104V84A8,8,0,0,0,88,76Z"/></svg>`,
      priority: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>`,
      car: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M240,112H229.2L201.42,49.5A16,16,0,0,0,186.8,40H69.2a16,16,0,0,0-14.62,9.5L26.8,112H16a8,8,0,0,0,0,16h8v80a16,16,0,0,0,16,16H64a16,16,0,0,0,16-16V192h96v16a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V128h8a8,8,0,0,0,0-16Z"/></svg>`,
      hotel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M240,208H224V136a16,16,0,0,0-16-16H136V72a8,8,0,0,0-8-8H40A16,16,0,0,0,24,80V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM208,208H136V136h72ZM40,80h88V208H40Z"/></svg>`,
    };
    return icons[icon] || icons['bag'];
  }
}
