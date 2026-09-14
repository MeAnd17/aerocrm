import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RutarLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { VuelosSocketService } from '../../../core/services/vuelos-socket.service';
import { VueloEstadoLabelPipe, VueloEstadoClassPipe } from '../../../shared/pipes/flight-status.pipe';
import { Subscription } from 'rxjs';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  ON_TIME:   ['DELAYED', 'BOARDING', 'CANCELLED'],
  DELAYED:   ['ON_TIME', 'BOARDING', 'CANCELLED'],
  BOARDING:  ['DEPARTED', 'DELAYED', 'CANCELLED'],
  DEPARTED:  ['LANDED', 'DIVERTED'],
  LANDED:    [],
  CANCELLED: [],
  DIVERTED:  ['LANDED'],
};

@Component({
  selector: 'app-vuelos-list',
  standalone: true,
  imports: [CommonModule, RutarLink, FormsModule, VueloEstadoLabelPipe, VueloEstadoClassPipe],
  template: `
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="page-title">Vuelos y Operaciones</h1>
        <p class="page-subtitle">Gestión del estado de vuelos en tiempo real</p>
      </div>
      <div class="flex gap-2">
        <a routerLink="/vuelos/board" class="btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
            <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM40,112H80v32H40Zm56,0H216v32H96Zm120-16H40V64H216ZM40,160H80v32H40Zm56,0H216v32H96Z"/>
          </svg>
          Tablero de Salidas
        </a>
        <a *ngIf="auth.hasPermission('vuelos:create')" routerLink="/vuelos/new" class="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
            <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/>
          </svg>
          Agregar Vuelo
        </a>
      </div>
    </div>

    <!-- WS indicator -->
    <div class="flex items-center gap-2 mb-4 text-xs" [class.text-emerald-400]="wsConnected" [class.text-amber-400]="!wsConnected">
      <span class="w-2 h-2 rounded-full" [class.bg-emerald-400]="wsConnected" [class.bg-amber-400]="!wsConnected" [class.animate-pulse]="!wsConnected"></span>
      {{ wsConnected ? 'Actualizaciones en vivo — los cambios aparecen al instante' : 'Conectando a actualizaciones en vivo…' }}
    </div>

    <!-- Filters -->
    <div class="aero-card p-4 mb-5 flex flex-wrap gap-3 items-center">
      <select [(ngModel)]="statusFilter" (ngModelChange)="load()" class="aero-input py-2 text-sm w-40">
        <option value="">Todos los estados</option>
        <option value="ON_TIME">A tiempo</option>
        <option value="DELAYED">Retrasado</option>
        <option value="BOARDING">Embarcando</option>
        <option value="DEPARTED">Despegó</option>
        <option value="LANDED">Aterrizó</option>
        <option value="CANCELLED">Cancelarado</option>
        <option value="DIVERTED">Desviado</option>
      </select>
      <input type="date" [(ngModel)]="dateFilter" (ngModelChange)="load()" class="aero-input py-2 text-sm w-44" />
      <button (click)="clearFilters()" class="btn-ghost text-sm py-2 px-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
          <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
        </svg>
        Clear
      </button>
      <span class="text-xs text-navy-400 ml-auto">{{ total() }} vuelos</span>
    </div>

    <!-- Table -->
    <div class="aero-card overflow-hidden">
      <div *ngIf="loading()" class="p-6 space-y-3">
        <div *ngFor="let _ de [1,2,3,4,5,6]" class="skeleton h-14 rounded-lg"></div>
      </div>

      <div *ngIf="!loading()">
        <table class="aero-table">
          <thead>
            <tr>
              <th>Vuelo</th>
              <th>Ruta</th>
              <th>Salida</th>
              <th>Llegada</th>
              <th>Puerta</th>
              <th>Aeronave</th>
              <th>Estado</th>
              <th *ngIf="auth.hasPermission('vuelos:update')" class="text-center">Change Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let f de vuelos()" class="departure-row" [ngClass]="'status-' + f.status.toLowerCase()">
              <td class="font-mono font-bold text-white text-sm">{{ f.flightNumber }}</td>
              <td>
                <div class="flex items-center gap-1 font-mono text-xs">
                  <span class="text-white font-semibold">{{ f.route?.origin?.iataCode }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-navy-500" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>
                  <span class="text-white font-semibold">{{ f.route?.destination?.iataCode }}</span>
                </div>
                <div class="text-xs text-navy-400 truncate max-w-28">
                  {{ f.route?.origin?.city }} → {{ f.route?.destination?.city }}
                </div>
              </td>
              <td class="font-mono text-xs">
                <span class="text-white">{{ f.scheduledSalida | date:'HH:mm' }}</span>
                <span class="text-navy-500 ml-1">{{ f.scheduledSalida | date:'dd MMM' }}</span>
              </td>
              <td class="font-mono text-xs">
                <span class="text-white">{{ f.scheduledLlegada | date:'HH:mm' }}</span>
                <span class="text-navy-500 ml-1">{{ f.scheduledLlegada | date:'dd MMM' }}</span>
              </td>
              <td class="font-mono text-gold-400 font-semibold text-sm">{{ f.gate?.code ?? '—' }}</td>
              <td class="text-xs text-navy-400 max-w-32 truncate">{{ f.aircraft }}</td>
              <td>
                <span class="badge text-xs transition-all duration-300" [ngClass]="f.status | flightEstadoClass">
                  {{ f.status | flightEstadoLabel }}
                </span>
              </td>
              <td *ngIf="auth.hasPermission('vuelos:update')">
                <div class="flex flex-wrap gap-1 justify-center">
                  <button *ngFor="let s de getSigEstadoes(f.status)"
                    (click)="changeEstado(f, s)"
                    [disabled]="changingEstado() === f.id"
                    class="px-2 py-0.5 rounded text-xs font-medium border transition-all"
                    [ngClass]="getEstadoButtonClass(s)">
                    {{ s | flightEstadoLabel }}
                  </button>
                  <span *ngIf="getSigEstadoes(f.status).length === 0" class="text-xs text-navy-600 italic">Terminal</span>
                </div>
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <a [routerLink]="['/vuelos', f.id]" class="btn-icon" title="Ver detalle">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76Z"/></svg>
                  </a>
                  <a *ngIf="auth.hasPermission('vuelos:update')" [routerLink]="['/vuelos', f.id, 'edit']" class="btn-icon" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H216a8,8,0,0,0,0-16H115.32l112-112A16,16,0,0,0,227.31,73.37Z"/></svg>
                  </a>
                </div>
              </td>
            </tr>
            <tr *ngIf="vuelos().length === 0">
              <td [attr.colspan]="auth.hasPermission('vuelos:update') ? 9 : 8">
                <div class="flex flex-col items-center py-12 text-navy-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mb-3 text-navy-600" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>
                  <p class="font-medium">No vuelos found</p>
                  <p class="text-sm mt-1">Intenta ajustar los filtros</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div *ngIf="totalPáginas() > 1" class="flex items-center justify-between px-4 py-3 border-t border-navy-700">
          <span class="text-xs text-navy-400">Página {{ page() }} de {{ totalPáginas() }}</span>
          <div class="flex gap-2">
            <button (click)="changePágina(-1)" [disabled]="page() === 1" class="btn-ghost text-sm py-1 px-3">&larr; Ant</button>
            <button (click)="changePágina(1)" [disabled]="page() === totalPáginas()" class="btn-ghost text-sm py-1 px-3">Sig &rarr;</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Motivo modal -->
    <div *ngIf="pendingChange()" class="modal-overlay" (click)="cancelChange()">
      <div class="aero-card p-6 max-w-md w-full" (click)="$event.stopPropagation()">
        <h3 class="font-semibold text-white mb-1">Change Estado to <span class="text-gold-400">{{ pendingChange()?.newEstado | flightEstadoLabel }}</span></h3>
        <p class="text-xs text-navy-400 mb-4">Vuelo {{ pendingChange()?.flight?.flightNumber }}</p>
        <div *ngIf="pendingChange()?.newEstado === 'DELAYED' || pendingChange()?.newEstado === 'CANCELLED' || pendingChange()?.newEstado === 'DIVERTED'" class="form-group">
          <label class="aero-label">Motivo <span class="text-navy-500 font-normal">(optional)</span></label>
          <input type="text" [(ngModel)]="changeMotivo" maxlength="200" placeholder="p.ej. Personal no disponible, condiciones climáticas…" class="aero-input" />
        </div>
        <div class="flex gap-3 mt-4">
          <button (click)="cancelChange()" class="btn-ghost flex-1 justify-center">Cancelar</button>
          <button (click)="confirmChange()" class="btn-primary flex-1 justify-center" [disabled]="changingEstado() !== null">
            <svg *ngIf="changingEstado() !== null" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class VuelosListComponent implements OnInit, OnDestroy {
  vuelos = signal<any[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  totalPáginas = signal(1);
  statusFilter = '';
  dateFilter = '';
  changingEstado = signal<number | null>(null);
  pendingChange = signal<{ flight: any; newEstado: string } | null>(null);
  changeMotivo = '';
  private sub?: Subscription;

  constructor(
    private api: ApiService,
    private toast: ToastService,
    public auth: AuthService,
    private socket: VuelosSocketService,
  ) {}

  get wsConnected() { return this.socket.isConnected; }

  ngOnInit() {
    this.load();
    this.sub = this.socket.flightEstadoUpdated$.subscribe(update => {
      this.vuelos.update(list =>
        list.map(f => f.id === update.flightId ? { ...f, status: update.status } : f)
      );
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  load() {
    this.loading.set(true);
    const params: any = { page: this.page(), limit: 15 };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.dateFilter) params.date = this.dateFilter;
    this.api.get<any>('vuelos', params).subscribe({
      next: res => { this.vuelos.set(res.data); this.total.set(res.total); this.totalPáginas.set(res.totalPáginas); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  clearFilters() { this.statusFilter = ''; this.dateFilter = ''; this.page.set(1); this.load(); }
  changePágina(dir: number) { this.page.update(p => p + dir); this.load(); }

  getSigEstadoes(current: string): string[] { return STATUS_TRANSITIONS[current] || []; }

  changeEstado(flight: any, newEstado: string) {
    this.changeMotivo = '';
    this.pendingChange.set({ flight, newEstado });
  }

  cancelChange() { this.pendingChange.set(null); this.changeMotivo = ''; }

  confirmChange() {
    const p = this.pendingChange();
    if (!p) return;
    this.changingEstado.set(p.flight.id);
    const body: any = { status: p.newEstado };
    if (this.changeMotivo) body.reason = this.changeMotivo;
    this.api.patch(`vuelos/${p.flight.id}/status`, body).subscribe({
      next: () => {
        this.toast.success(`Vuelo ${p.flight.flightNumber} → ${p.newEstado.replace('_', ' ')}`);
        this.pendingChange.set(null);
        this.changeMotivo = '';
        this.changingEstado.set(null);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al actualizar el estado');
        this.changingEstado.set(null);
        this.pendingChange.set(null);
      },
    });
  }

  getEstadoButtonClass(s: string) {
    const map: Record<string, string> = {
      ON_TIME: 'border-emerald-600 text-emerald-400 hover:bg-emerald-600/20',
      DELAYED: 'border-amber-600 text-amber-400 hover:bg-amber-600/20',
      BOARDING: 'border-purple-600 text-purple-400 hover:bg-purple-600/20',
      CANCELLED: 'border-red-600 text-red-400 hover:bg-red-600/20',
      DEPARTED: 'border-blue-600 text-blue-400 hover:bg-blue-600/20',
      LANDED: 'border-gray-600 text-gray-400 hover:bg-gray-600/20',
      DIVERTED: 'border-orange-600 text-orange-400 hover:bg-orange-600/20',
    };
    return map[s] || 'border-navy-600 text-navy-300';
  }
}
