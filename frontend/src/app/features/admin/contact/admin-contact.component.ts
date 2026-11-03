import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AdminNotificationsService } from '../admin-notifications.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';
import { LabelPipe } from '../../../shared/pipes/label.pipe';

/** Consulta de contacto que devuelve GET /contact. */
interface ConsultaContacto {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'PENDIENTE' | 'ATENDIDA';
  attendedAt: string | null;
  internalNote: string | null;
  createdAt: string;
  clientId: number | null;
}

/** Respuesta paginada de GET /contact. */
interface RespuestaPaginada {
  messages: ConsultaContacto[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Pantalla de bandeja de consultas del panel de administración (US-030).
 * Lista los mensajes de contacto con filtro por estado y permite marcarlos como atendidos.
 */
@Component({
  selector: 'app-admin-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-800">Consultas</h1>
        <span class="text-sm text-gray-500">{{ total() }} resultado(s)</span>
      </div>

      <!-- Filtro de estado -->
      <div class="bg-white border rounded-xl shadow-sm p-4">
        <select
          [(ngModel)]="estadoFiltro"
          (ngModelChange)="cargar()"
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="ATENDIDA">Atendidas</option>
        </select>
      </div>

      @if (cargando()) {
        <p class="text-sm text-gray-500">Cargando consultas...</p>
      }

      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {{ error() }}
        </div>
      }

      @if (!cargando() && consultas().length === 0 && !error()) {
        <p class="text-sm text-gray-500">No hay consultas con ese filtro.</p>
      }

      @if (consultas().length > 0) {
        <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Remitente</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Correo</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Asunto</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              @for (c of consultas(); track c.id) {
                <tr
                  class="hover:bg-gray-50 transition"
                  [class.bg-blue-50]="consultaAbierta() === c.id"
                >
                  <td class="px-4 py-3 font-medium text-gray-800">{{ c.name }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ c.email }}</td>
                  <td class="px-4 py-3 text-gray-700">{{ c.subject }}</td>
                  <td class="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {{ c.createdAt | date:'dd/MM/yyyy HH:mm':'':'es-PE' }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [class]="estadoClase(c.status)"
                    >
                      {{ c.status | label }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <button
                      type="button"
                      (click)="toggleDetalle(c.id)"
                      class="text-blue-600 hover:text-blue-800 text-xs font-medium transition"
                    >
                      {{ consultaAbierta() === c.id ? 'Cerrar' : 'Ver detalle' }}
                    </button>
                  </td>
                </tr>

                @if (consultaAbierta() === c.id) {
                  <tr>
                    <td colspan="6" class="px-6 py-4 bg-gray-50 border-b">
                      <div class="space-y-4">
                        <!-- Mensaje completo -->
                        <div>
                          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Mensaje</p>
                          <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ c.message }}</p>
                        </div>

                        <!-- Enlace a perfil del cliente si existe -->
                        @if (clienteId(c.email); as cid) {
                          <div>
                            <a
                              [routerLink]="['/admin/clients', cid]"
                              class="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                            >
                              Ver perfil del cliente
                            </a>
                          </div>
                        }

                        <!-- Nota interna existente -->
                        @if (c.internalNote) {
                          <div>
                            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nota interna</p>
                            <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ c.internalNote }}</p>
                          </div>
                        }

                        <!-- Formulario para marcar como atendida -->
                        @if (c.status === 'PENDIENTE') {
                          <div class="border-t pt-4 space-y-3">
                            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Marcar como atendida</p>
                            <textarea
                              [(ngModel)]="notaInterna[c.id]"
                              placeholder="Nota interna (opcional)"
                              rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            ></textarea>
                            <button
                              type="button"
                              (click)="marcarAtendida(c)"
                              [disabled]="guardando() === c.id"
                              class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                            >
                              {{ guardando() === c.id ? 'Guardando...' : 'Marcar como atendida' }}
                            </button>
                          </div>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminContactComponent implements OnInit {
  consultas = signal<ConsultaContacto[]>([]);
  total = signal(0);
  cargando = signal(true);
  error = signal<string | null>(null);
  consultaAbierta = signal<number | null>(null);
  guardando = signal<number | null>(null);

  estadoFiltro = '';
  notaInterna: Record<number, string> = {};

  /** Mapa email → clientId cargado junto a los mensajes cuando el backend lo devuelva. */
  private mapaClientes = signal<Record<string, number>>({});

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private notifs: AdminNotificationsService,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  /** Carga la lista de consultas aplicando el filtro de estado activo. */
  cargar() {
    this.cargando.set(true);
    this.error.set(null);
    this.consultaAbierta.set(null);

    const params: Record<string, string> = {};
    if (this.estadoFiltro) params['status'] = this.estadoFiltro;

    this.api.get<RespuestaPaginada>('contact', params).subscribe({
      next: (data) => {
        this.consultas.set(data.messages);
        this.total.set(data.total);
        this.cargando.set(false);
        // Poblar el mapa email→clientId para el enlace a la ficha del cliente
        const mapa: Record<string, number> = {};
        for (const m of data.messages) {
          if (m.clientId) mapa[m.email] = m.clientId;
        }
        this.mapaClientes.set(mapa);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'No se pudieron cargar las consultas.'));
        this.cargando.set(false);
      },
    });
  }

  /** Abre o cierra el panel de detalle de una consulta. */
  toggleDetalle(id: number) {
    this.consultaAbierta.set(this.consultaAbierta() === id ? null : id);
  }

  /** Marca la consulta como atendida y actualiza la lista en pantalla. */
  marcarAtendida(consulta: ConsultaContacto) {
    this.guardando.set(consulta.id);
    const nota = this.notaInterna[consulta.id] ?? '';

    this.api.patch<ConsultaContacto>(`contact/${consulta.id}/attend`, { note: nota || undefined }).subscribe({
      next: (actualizada) => {
        this.consultas.update((lista) =>
          lista.map((c) => (c.id === actualizada.id ? actualizada : c)),
        );
        this.total.update((t) => (this.estadoFiltro === 'PENDIENTE' ? t - 1 : t));
        this.guardando.set(null);
        this.consultaAbierta.set(null);
        this.notifs.refrescarPendientes();
        this.toast.show('success', 'Consulta marcada como atendida');
      },
      error: (err) => {
        this.guardando.set(null);
        this.toast.show('error', apiErrorMessage(err, 'No se pudo marcar la consulta como atendida.'));
      },
    });
  }

  /** Devuelve el clientId asociado al correo del remitente, si está registrado. */
  clienteId(email: string): number | null {
    return this.mapaClientes()[email] ?? null;
  }

  /** Devuelve las clases de color para la etiqueta de estado. */
  estadoClase(status: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-700',
      ATENDIDA: 'bg-green-100 text-green-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}
