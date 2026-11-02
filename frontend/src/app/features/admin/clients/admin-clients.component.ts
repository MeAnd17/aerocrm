import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';
import { LabelPipe } from '../../../shared/pipes/label.pipe';

/** Resumen de cliente que devuelve GET /clients/admin/all. */
interface ClienteResumen {
  id: number;
  userId: number;
  nombre: string;
  email: string;
  nivel: string;
  puntos: number;
  puntosTotal: number;
  viajes: number;
  fechaRegistro: string;
}

const NIVELES = ['EXPLORADOR', 'VIAJERO', 'FRECUENTE', 'ELITE'] as const;

/**
 * Pantalla de administración de clientes: lista con filtros por nivel y búsqueda de texto (US-028).
 */
@Component({
  selector: 'app-admin-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-800">Clientes</h1>
        <span class="text-sm text-gray-500">{{ clientes().length }} resultado(s)</span>
      </div>

      <!-- Filtros -->
      <div class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        <input
          type="text"
          [(ngModel)]="busqueda"
          (ngModelChange)="cargar()"
          placeholder="Buscar por nombre o correo"
          class="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          [(ngModel)]="nivelFiltro"
          (ngModelChange)="cargar()"
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los niveles</option>
          @for (n of niveles; track n) {
            <option [value]="n">{{ n | label }}</option>
          }
        </select>
      </div>

      @if (cargando()) {
        <p class="text-sm text-gray-500">Cargando clientes...</p>
      }

      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {{ error() }}
        </div>
      }

      @if (!cargando() && clientes().length === 0 && !error()) {
        <p class="text-sm text-gray-500">No se encontraron clientes con esos filtros.</p>
      }

      @if (clientes().length > 0) {
        <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Correo</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Nivel</th>
                <th class="text-right px-4 py-3 font-semibold text-gray-600">Puntos disp.</th>
                <th class="text-right px-4 py-3 font-semibold text-gray-600">Viajes</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Registro</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              @for (c of clientes(); track c.id) {
                <tr class="hover:bg-gray-50 transition">
                  <td class="px-4 py-3 font-medium text-gray-800">{{ c.nombre }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ c.email }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [class]="nivelClase(c.nivel)"
                    >
                      {{ c.nivel | label }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ c.puntos }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ c.viajes }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ c.fechaRegistro | date:'dd/MM/yyyy':'':'es-PE' }}</td>
                  <td class="px-4 py-3">
                    <a
                      [routerLink]="['/admin/clients', c.id]"
                      class="text-blue-600 hover:text-blue-800 text-xs font-medium transition"
                    >
                      Ver detalle
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminClientsComponent implements OnInit {
  clientes = signal<ClienteResumen[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  busqueda = '';
  nivelFiltro = '';
  niveles = NIVELES;

  constructor(
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  /** Carga la lista de clientes aplicando los filtros activos. */
  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    const params: Record<string, string> = {};
    if (this.busqueda.trim()) params['search'] = this.busqueda.trim();
    if (this.nivelFiltro) params['level'] = this.nivelFiltro;

    this.api.get<ClienteResumen[]>('clients/admin/all', params).subscribe({
      next: (data) => {
        this.clientes.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'No se pudieron cargar los clientes.'));
        this.cargando.set(false);
      },
    });
  }

  /** Devuelve las clases de color para la etiqueta de nivel de membresía. */
  nivelClase(nivel: string): string {
    const map: Record<string, string> = {
      EXPLORADOR: 'bg-gray-100 text-gray-600',
      VIAJERO: 'bg-blue-100 text-blue-700',
      FRECUENTE: 'bg-purple-100 text-purple-700',
      ELITE: 'bg-yellow-100 text-yellow-700',
    };
    return map[nivel] ?? 'bg-gray-100 text-gray-600';
  }
}
