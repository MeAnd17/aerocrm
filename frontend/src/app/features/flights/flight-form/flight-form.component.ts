import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-flight-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/flights" class="btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/></svg>
        </a>
        <div>
          <h1 class="page-title">{{ isEdit ? 'Editar Vuelo' : 'Nuevo Vuelo' }}</h1>
          <p class="page-subtitle">{{ isEdit ? 'Actualizar horario y datos del vuelo' : 'Programar una nueva operación de vuelo' }}</p>
        </div>
      </div>

      <form #fForm="ngForm" (ngSubmit)="onSubmit(fForm)" novalidate>
        <!-- Identidad del Vuelo -->
        <div class="aero-card p-6 mb-5">
          <h2 class="section-title">Identidad del Vuelo</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="aero-label">Número de Vuelo *</label>
              <input type="text" name="flightNumber" [(ngModel)]="form.flightNumber" required
                     pattern="[A-Z]{2}-[0-9]{3,4}" placeholder="AE-1234"
                     class="aero-input font-mono uppercase"
                     (input)="form.flightNumber = form.flightNumber.toUpperCase()"
                     #fn="ngModel" [class.border-red-500]="fn.invalid && fn.touched" />
              <p *ngIf="fn.invalid && fn.touched" class="form-error">Format: XX-1234 (2 letters, dash, 3-4 digits)</p>
            </div>
            <div class="form-group">
              <label class="aero-label">Aeronave *</label>
              <select name="aircraft" [(ngModel)]="form.aircraft" required class="aero-input" #ac="ngModel" [class.border-red-500]="ac.invalid && ac.touched">
                <option value="">Seleccionar aeronave…</option>
                <option *ngFor="let a of aircraftOptions" [value]="a">{{ a }}</option>
              </select>
              <p *ngIf="ac.invalid && ac.touched" class="form-error">Select an aircraft type</p>
            </div>
            <div class="form-group">
              <label class="aero-label">Ruta *</label>
              <select name="routeId" [(ngModel)]="form.routeId" required class="aero-input" #route="ngModel" [class.border-red-500]="route.invalid && route.touched">
                <option [value]="null">Seleccionar ruta…</option>
                <option *ngFor="let r of routes()" [value]="r.id">
                  {{ r.origin?.iataCode }} → {{ r.destination?.iataCode }} ({{ r.origin?.city }} → {{ r.destination?.city }})
                </option>
              </select>
              <p *ngIf="route.invalid && route.touched" class="form-error">Select a route</p>
            </div>
            <div class="form-group">
              <label class="aero-label">Puerta de Salida</label>
              <select name="gateId" [(ngModel)]="form.gateId" class="aero-input">
                <option [value]="null">Sin puerta asignada</option>
                <option *ngFor="let g of gates()" [value]="g.id">{{ g.code }} — Terminal {{ g.terminal }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Horario -->
        <div class="aero-card p-6 mb-5">
          <h2 class="section-title">Horario</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="aero-label">Horariod Departure *</label>
              <input type="datetime-local" name="scheduledDeparture" [(ngModel)]="form.scheduledDeparture" required
                     class="aero-input" #dep="ngModel" [class.border-red-500]="dep.invalid && dep.touched"
                     (change)="validateHorario()" />
              <p *ngIf="dep.invalid && dep.touched" class="form-error">Fecha y hora de salida requeridas</p>
            </div>
            <div class="form-group">
              <label class="aero-label">Horariod Arrival *</label>
              <input type="datetime-local" name="scheduledArrival" [(ngModel)]="form.scheduledArrival" required
                     [min]="form.scheduledDeparture"
                     class="aero-input" #arr="ngModel" [class.border-red-500]="arr.invalid && arr.touched || scheduleError()"
                     (change)="validateHorario()" />
              <p *ngIf="arr.invalid && arr.touched" class="form-error">Fecha y hora de llegada requeridas</p>
              <p *ngIf="scheduleError()" class="form-error">{{ scheduleError() }}</p>
            </div>
          </div>
          <div *ngIf="flightDuration" class="mt-2 text-xs text-gold-400 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v52h48A8,8,0,0,1,192,128Z"/></svg>
            Duración del vuelo: {{ flightDuration }}
          </div>
        </div>

        <!-- Seating -->
        <div class="aero-card p-6 mb-5">
          <h2 class="section-title">Configuración de Asientos</h2>
          <p class="text-xs text-navy-400 mb-4">Todos los valores deben ser no negativos. La suma de Economy + Business + Primera Clase no puede superar el Total.</p>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="form-group">
              <label class="aero-label">Total Asientos *</label>
              <input type="number" name="totalSeats" [(ngModel)]="form.totalSeats" required min="1" max="1000"
                     class="aero-input" (change)="validateSeats()" #ts="ngModel" [class.border-red-500]="ts.invalid && ts.touched" />
              <p *ngIf="ts.invalid && ts.touched" class="form-error">1–1000</p>
            </div>
            <div class="form-group">
              <label class="aero-label">Económica *</label>
              <input type="number" name="economySeats" [(ngModel)]="form.economySeats" required min="1" max="900"
                     class="aero-input" (change)="validateSeats()" #eco="ngModel" [class.border-red-500]="eco.invalid && eco.touched" />
              <p *ngIf="eco.invalid && eco.touched" class="form-error">Mínimo 1</p>
            </div>
            <div class="form-group">
              <label class="aero-label">Business</label>
              <input type="number" name="businessSeats" [(ngModel)]="form.businessSeats" required min="0" max="400"
                     class="aero-input" (change)="validateSeats()" />
            </div>
            <div class="form-group">
              <label class="aero-label">Primera Clase</label>
              <input type="number" name="firstClassSeats" [(ngModel)]="form.firstClassSeats" required min="0" max="100"
                     class="aero-input" (change)="validateSeats()" />
            </div>
          </div>
          <p *ngIf="seatError()" class="text-amber-400 text-xs mt-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 256 256" fill="currentColor"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/></svg>
            {{ seatError() }}
          </p>
          <div class="mt-3 h-2 bg-navy-700 rounded-full overflow-hidden" *ngIf="form.totalSeats > 0">
            <div class="h-full flex">
              <div class="bg-blue-500 transition-all" [style.width.%]="getSeatPercent('economy')"></div>
              <div class="bg-gold-500 transition-all" [style.width.%]="getSeatPercent('business')"></div>
              <div class="bg-purple-500 transition-all" [style.width.%]="getSeatPercent('first')"></div>
            </div>
          </div>
          <div class="flex gap-4 mt-2 text-xs" *ngIf="form.totalSeats > 0">
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span>Economy {{ getSeatPercent('economy').toFixed(0) }}%</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-gold-500"></span>Business {{ getSeatPercent('business').toFixed(0) }}%</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500"></span>First {{ getSeatPercent('first').toFixed(0) }}%</span>
          </div>
        </div>

        <div *ngIf="serverError()" class="mb-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" viewBox="0 0 256 256" fill="currentColor"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/></svg>
          {{ serverError() }}
        </div>

        <div class="flex items-center justify-end gap-3">
          <a routerLink="/flights" class="btn-ghost">Cancelar</a>
          <button type="submit" class="btn-primary" [disabled]="loading() || fForm.invalid || !!seatError() || !!scheduleError()">
            <svg *ngIf="loading()" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            {{ loading() ? 'Guardando…' : (isEdit ? 'Guardar Cambios' : 'Crear Vuelo') }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class FlightFormComponent implements OnInit {
  form: any = {
    flightNumber: '', aircraft: '', routeId: null, gateId: null,
    scheduledDeparture: '', scheduledArrival: '',
    totalSeats: 180, economySeats: 156, businessSeats: 24, firstClassSeats: 0,
  };
  isEdit = false;
  loading = signal(false);
  serverError = signal('');
  scheduleError = signal('');
  seatError = signal('');
  routes = signal<any[]>([]);
  gates = signal<any[]>([]);

  aircraftOptions = [
    'Airbus A319', 'Airbus A320neo', 'Airbus A321', 'Airbus A321XLR',
    'Airbus A330-200', 'Airbus A350-900', 'Airbus A380-800',
    'Boeing 737-800', 'Boeing 737 MAX 9', 'Boeing 777-200LR',
    'Boeing 777-300ER', 'Boeing 787-8', 'Boeing 787-9',
  ];

  constructor(private api: ApiService, private toast: ToastService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.api.get<any[]>('flights/routes').subscribe(r => this.routes.set(r));
    this.api.get<any[]>('flights/gates').subscribe(g => this.gates.set(g));
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.api.get<any>(`flights/${id}`).subscribe(f => {
        this.form = {
          ...f,
          routeId: f.routeId,
          gateId: f.gateId,
          scheduledDeparture: f.scheduledDeparture?.slice(0, 16),
          scheduledArrival: f.scheduledArrival?.slice(0, 16),
        };
      });
    }
  }

  validateHorario() {
    if (!this.form.scheduledDeparture || !this.form.scheduledArrival) { this.scheduleError.set(''); return; }
    const dep = new Date(this.form.scheduledDeparture);
    const arr = new Date(this.form.scheduledArrival);
    if (arr <= dep) this.scheduleError.set('La llegada debe ser posterior a la salida');
    else this.scheduleError.set('');
  }

  validateSeats() {
    const { totalSeats: t, economySeats: e, businessSeats: b, firstClassSeats: f } = this.form;
    const sum = (+e || 0) + (+b || 0) + (+f || 0);
    if (sum > +t) this.seatError.set(`Seat classes sum (${sum}) exceeds total seats (${t})`);
    else if (+e < 1) this.seatError.set('Economy seats must be at least 1');
    else if (+b < 0 || +f < 0) this.seatError.set('Seat counts cannot be negative');
    else this.seatError.set('');
  }

  get flightDuration(): string {
    if (!this.form.scheduledDeparture || !this.form.scheduledArrival) return '';
    const diff = new Date(this.form.scheduledArrival).getTime() - new Date(this.form.scheduledDeparture).getTime();
    if (diff <= 0) return '';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  getSeatPercent(type: string) {
    const t = +this.form.totalSeats || 1;
    if (type === 'economy') return ((+this.form.economySeats || 0) / t) * 100;
    if (type === 'business') return ((+this.form.businessSeats || 0) / t) * 100;
    return ((+this.form.firstClassSeats || 0) / t) * 100;
  }

  onSubmit(form: NgForm) {
    if (form.invalid || this.seatError() || this.scheduleError()) {
      Object.values(form.controls).forEach(c => c.markAsTouched());
      return;
    }
    this.loading.set(true);
    this.serverError.set('');
    const payload = {
      ...this.form,
      routeId: +this.form.routeId,
      gateId: this.form.gateId ? +this.form.gateId : undefined,
      totalSeats: +this.form.totalSeats,
      economySeats: +this.form.economySeats,
      businessSeats: +this.form.businessSeats,
      firstClassSeats: +this.form.firstClassSeats,
    };
    const id = this.route.snapshot.paramMap.get('id');
    const req = this.isEdit ? this.api.put(`flights/${id}`, payload) : this.api.post('flights', payload);
    req.subscribe({
      next: () => { this.toast.success(this.isEdit ? 'Flight updated' : 'Flight created'); this.router.navigate(['/flights']); },
      error: err => {
        this.loading.set(false);
        const msg = err?.error?.message;
        this.serverError.set(Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al guardar el vuelo'));
      },
    });
  }
}
