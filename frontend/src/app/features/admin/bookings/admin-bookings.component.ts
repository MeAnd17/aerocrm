import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';
import { LabelPipe } from '../../../shared/pipes/label.pipe';

/** Resumen de reserva que devuelve GET /admin/bookings. */
interface ReservaAdmin {
  id: string;
  confirmationCode: string;
  status: string;
  totalPrice: string;
  passengers: number;
  createdAt: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

/** Respuesta paginada de GET /admin/bookings. */
interface PaginaReservas {
  bookings: ReservaAdmin[];
  total: number;
  page: number;
  limit: number;
}

const ESTADOS = ['PENDIENTE', 'CONFIRMADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO'] as const;

/**
 * Pantalla de administración de reservas: lista con filtros por estado y búsqueda de texto (US-029).
 */
@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-800">Reservas</h1>
        <span class="text-sm text-gray-500">{{ total() }} resultado(s)</span>
      </div>

      <!-- Filtros -->
      <div class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        <input
          type="text"
          [(ngModel)]="busqueda"
          (ngModelChange)="cargar()"
          placeholder="Buscar por código, nombre o correo"
          class="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          [(ngModel)]="estadoFiltro"
          (ngModelChange)="cargar()"
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          @for (e of estados; track e) {
            <option [value]="e">{{ e | label }}</option>
          }
        </select>
      </div>

      @if (cargando()) {
        <p class="text-sm text-gray-500">Cargando reservas...</p>
      }

      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {{ error() }}
        </div>
      }

      @if (!cargando() && reservas().length === 0 && !error()) {
        <p class="text-sm text-gray-500">No se encontraron reservas con esos filtros.</p>
      }

      @if (reservas().length > 0) {
        <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Código</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Cliente</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th class="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                <th class="text-right px-4 py-3 font-semibold text-gray-600">Pasajeros</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              @for (r of reservas(); track r.id) {
                <tr class="hover:bg-gray-50 transition">
                  <td class="px-4 py-3 font-mono text-gray-700">{{ r.confirmationCode }}</td>
                  <td class="px-4 py-3">
                    <p class="font-medium text-gray-800">{{ r.user.firstName }} {{ r.user.lastName }}</p>
                    <p class="text-xs text-gray-500">{{ r.user.email }}</p>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [class]="estadoClase(r.status)"
                    >
                      {{ r.status | label }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right text-gray-700">S/ {{ r.totalPrice }}</td>
                  <td class="px-4 py-3 text-right text-gray-700">{{ r.passengers }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ r.createdAt | date:'dd/MM/yyyy':'':'es-PE' }}</td>
                  <td class="px-4 py-3">
                    <a
                      [routerLink]="['/admin/bookings', r.id]"
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

        <!-- Paginación -->
        @if (totalPaginas() > 1) {
          <div class="flex items-center justify-between text-sm">
            <button
              (click)="cambiarPagina(paginaActual() - 1)"
              [disabled]="paginaActual() === 1"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span class="text-gray-500">Página {{ paginaActual() }} de {{ totalPaginas() }}</span>
            <button
              (click)="cambiarPagina(paginaActual() + 1)"
              [disabled]="paginaActual() === totalPaginas()"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class AdminBookingsComponent implements OnInit {
  reservas = signal<ReservaAdmin[]>([]);
  total = signal(0);
  cargando = signal(true);
  error = signal<string | null>(null);
  paginaActual = signal(1);

  busqueda = '';
  estadoFiltro = '';
  estados = ESTADOS;
  readonly limite = 20;

  totalPaginas = signal(1);

  constructor(
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  /** Carga la lista de reservas aplicando los filtros y la página activos. */
  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    const params: Record<string, string> = {
      page: String(this.paginaActual()),
      limit: String(this.limite),
    };
    if (this.busqueda.trim()) params['search'] = this.busqueda.trim();
    if (this.estadoFiltro) params['status'] = this.estadoFiltro;

    this.api.get<PaginaReservas>('admin/bookings', params).subscribe({
      next: (data) => {
        this.reservas.set(data.bookings);
        this.total.set(data.total);
        this.totalPaginas.set(Math.max(1, Math.ceil(data.total / this.limite)));
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'No se pudieron cargar las reservas.'));
        this.cargando.set(false);
      },
    });
  }

  /** Cambia a la página indicada y recarga los datos. */
  cambiarPagina(pagina: number) {
    this.paginaActual.set(pagina);
    this.cargar();
  }

  /** Devuelve las clases de color para la etiqueta de estado de reserva. */
  estadoClase(estado: string): string {
    const mapa: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-700',
      CONFIRMADO: 'bg-blue-100 text-blue-700',
      EN_CURSO: 'bg-indigo-100 text-indigo-700',
      COMPLETADO: 'bg-green-100 text-green-700',
      CANCELADO: 'bg-red-100 text-red-600',
    };
    return mapa[estado] ?? 'bg-gray-100 text-gray-600';
  }
}
