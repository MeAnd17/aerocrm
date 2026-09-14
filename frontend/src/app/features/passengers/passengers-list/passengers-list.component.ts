import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-pasajeros-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, RelativeTimePipe],
  template: `
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="page-title">Pasajeros</h1>
        <p class="page-subtitle">Gestión de perfiles y vista 360° de pasajeros</p>
      </div>
      <a routerLink="/pasajeros/new" class="btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
          <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/>
        </svg>
        Nuevo Pasajero
      </a>
    </div>

    <!-- Filters -->
    <div class="aero-card p-4 mb-5 flex flex-wrap gap-3 items-center">
      <div class="relative flex-1 min-w-48">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" viewBox="0 0 256 256" fill="currentColor">
          <path d="M229.66,218.34l-50.07-50.06a88.21,88.21,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>
        </svg>
        <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)"
               placeholder="Buscar por nombre, correo, pasaporte…"
               class="aero-input pl-10 py-2 text-sm" />
      </div>
      <select [(ngModel)]="tierFilter" (ngModelChange)="load()" class="aero-input py-2 text-sm w-40">
        <option value="">Todos los niveles</option>
        <option value="STANDARD">Standard</option>
        <option value="SILVER">Silver</option>
        <option value="GOLD">Gold</option>
        <option value="PLATINUM">Platinum</option>
      </select>
      <span class="text-xs text-navy-400">{{ total() }} pasajeros</span>
    </div>

    <!-- Table -->
    <div class="aero-card overflow-hidden">
      <!-- Loading skeleton -->
      <div *ngIf="loading()" class="p-6 space-y-3">
        <div *ngFor="let _ de [1,2,3,4,5,6,7]" class="skeleton h-12 rounded-lg"></div>
      </div>

      <div *ngIf="!loading()">
        <table class="aero-table">
          <thead>
            <tr>
              <th>Pasajero</th>
              <th>Pasaporte</th>
              <th>Nacionalidad</th>
              <th>Nivel</th>
              <th>Registro</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p de pasajeros()">
              <td>
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
                       [ngClass]="getNivelAvatarClass(p.tier)">
                    {{ p.firstName[0] }}{{ p.lastName[0] }}
                  </div>
                  <div>
                    <p class="font-medium text-white">{{ p.firstName }} {{ p.lastName }}</p>
                    <p class="text-xs text-navy-400">{{ p.email }}</p>
                  </div>
                </div>
              </td>
              <td class="font-mono text-xs text-navy-300">{{ p.passportNumber }}</td>
              <td class="text-sm">
                <span class="inline-flex items-center gap-1.5">
                  <span class="text-navy-300">{{ p.nationality }}</span>
                </span>
              </td>
              <td><span class="badge text-xs" [ngClass]="getNivelBadgeClass(p.tier)">{{ p.tier }}</span></td>
              <td class="text-xs text-navy-400">{{ p.createdAt | relativeTime }}</td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <a [routerLink]="['/pasajeros', p.id]" class="btn-icon" title="Ver Perfil 360°">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"/>
                    </svg>
                  </a>
                  <a [routerLink]="['/pasajeros', p.id, 'edit']" class="btn-icon" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H216a8,8,0,0,0,0-16H115.32l112-112A16,16,0,0,0,227.31,73.37ZM92.69,208H48V163.31l88-88L180.69,120Z"/>
                    </svg>
                  </a>
                  <button (click)="confirmDesactivar(p)" class="btn-icon text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Desactivar">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-64,64a8,8,0,0,1-11.32-11.32l64-64A8,8,0,0,1,173.66,98.34Zm-96,11.32a8,8,0,0,0,11.32,0l64-64a8,8,0,0,0-11.32-11.32l-64,64A8,8,0,0,0,77.66,109.66ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="pasajeros().length === 0">
              <td colspan="6">
                <div class="flex flex-col items-center py-12 text-navy-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mb-3 text-navy-600" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.43a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92Z"/>
                  </svg>
                  <p class="font-medium">No pasajeros found</p>
                  <p class="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                  <a routerLink="/pasajeros/new" class="btn-primary mt-4 text-sm">Add First Pasajero</a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div *ngIf="totalPáginas() > 1" class="flex items-center justify-between px-4 py-3 border-t border-navy-700">
          <span class="text-xs text-navy-400">Página {{ page() }} de {{ totalPáginas() }}</span>
          <div class="flex gap-2">
            <button (click)="prevPágina()" [disabled]="page() === 1" class="btn-ghost text-sm py-1 px-3">
              &larr; Ant
            </button>
            <button (click)="nextPágina()" [disabled]="page() === totalPáginas()" class="btn-ghost text-sm py-1 px-3">
              Sig &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Desactivar Modal -->
    <div *ngIf="deactivateTarget()" class="modal-overlay" (click)="deactivateTarget.set(null)">
      <div class="aero-card p-6 max-w-sm w-full" (click)="$event.stopPropagation()">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-400" viewBox="0 0 256 256" fill="currentColor">
              <path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-white">Desactivar Pasajero</h3>
            <p class="text-xs text-navy-400">Esta acción puede revertirla un administrador</p>
          </div>
        </div>
        <p class="text-sm text-navy-300 mb-5">
          ¿Estás seguro de desactivar a <strong class="text-white">{{ deactivateTarget()?.firstName }} {{ deactivateTarget()?.lastName }}</strong>?
          Sus reservas e historial se conservarán.
        </p>
        <div class="flex gap-3">
          <button (click)="deactivateTarget.set(null)" class="btn-ghost flex-1 justify-center">Cancelar</button>
          <button (click)="deactivate()" class="btn-danger flex-1 justify-center" [disabled]="deactivating()">
            {{ deactivating() ? 'Desactivando…' : 'Desactivar' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PasajerosListComponent implements OnInit {
  pasajeros = signal<any[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  totalPáginas = signal(1);
  searchQuery = '';
  tierFilter = '';
  deactivateTarget = signal<any>(null);
  deactivating = signal(false);

  private searchSubject = new Subject<string>();

  constructor(private api: ApiService, private toast: ToastService, public auth: AuthService) {}

  ngOnInit() {
    this.load();
    this.searchSubject.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  onSearch(val: string) { this.searchSubject.next(val); }

  load() {
    this.loading.set(true);
    const params: any = { page: this.page(), limit: 15 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.tierFilter) params.tier = this.tierFilter;

    this.api.get<any>('pasajeros', params).subscribe({
      next: res => {
        this.pasajeros.set(res.data);
        this.total.set(res.total);
        this.totalPáginas.set(res.totalPáginas);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  prevPágina() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPágina() { if (this.page() < this.totalPáginas()) { this.page.update(p => p + 1); this.load(); } }

  confirmDesactivar(p: any) { this.deactivateTarget.set(p); }

  deactivate() {
    const p = this.deactivateTarget();
    if (!p) return;
    this.deactivating.set(true);
    this.api.delete(`pasajeros/${p.id}`).subscribe({
      next: () => {
        this.toast.success(`${p.firstName} ${p.lastName} ha sido desactivado`);
        this.deactivateTarget.set(null);
        this.deactivating.set(false);
        this.load();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al desactivar pasajero');
        this.deactivating.set(false);
      },
    });
  }

  getNivelBadgeClass(tier: string) {
    const map: Record<string, string> = {
      STANDARD: 'badge-gray', SILVER: 'badge-navy', GOLD: 'badge-gold', PLATINUM: 'badge-purple',
    };
    return map[tier] || 'badge-gray';
  }

  getNivelAvatarClass(tier: string) {
    const map: Record<string, string> = {
      STANDARD: 'bg-navy-700 text-navy-300',
      SILVER: 'bg-slate-600/30 text-slate-300 border border-slate-500/30',
      GOLD: 'bg-gold-500/20 text-gold-400 border border-gold-500/30',
      PLATINUM: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    };
    return map[tier] || 'bg-navy-700 text-navy-300';
  }
}
