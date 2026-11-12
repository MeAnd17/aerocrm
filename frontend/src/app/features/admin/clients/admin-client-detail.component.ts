import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';
import { LabelPipe } from '../../../shared/pipes/label.pipe';

/** Reserva reducida que llega en el detalle del cliente (admin). */
interface ReservaResumen {
  id: string;
  confirmationCode: string;
  status: string;
  totalPrice: string;
  currency: string;
  pointsEarned: number;
  pointsUsed: number;
  passengers: number;
  createdAt: string;
}

/** Entrada del historial de puntos. */
interface HistorialPuntos {
  id: number;
  type: string;
  points: number;
  description: string;
  createdAt: string;
}

/** Reseña reducida que llega en el detalle del cliente (admin). */
interface ResenaResumen {
  id: number;
  rating: number;
  comment: string | null;
  updatedAt: string;
  codigoReserva: string;
}

/** Perfil completo del cliente que devuelve GET /clients/admin/:id. */
interface ClienteDetalle {
  id: number;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  phone: string | null;
  nationality: string | null;
  documentNumber: string | null;
  dateOfBirth: string | null;
  travelStyle: string | null;
  destinationType: string | null;
  spendingRange: string | null;
  nivel: string;
  puntos: number;
  puntosTotal: number;
  viajes: number;
  fechaRegistro: string;
  reservas: ReservaResumen[];
  historialPuntos: HistorialPuntos[];
  resenas: ResenaResumen[];
}

/**
 * Pantalla de detalle de un cliente para el administrador, con historial de reservas,
 * puntos y opción de restablecer contraseña (US-028).
 */
@Component({
  selector: 'app-admin-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-6">
      <!-- Cabecera -->
      <div class="flex items-center gap-3">
        <a routerLink="/admin/clients" class="text-sm text-blue-600 hover:text-blue-800 transition">← Volver</a>
        <h1 class="text-xl font-bold text-gray-800">Detalle del cliente</h1>
      </div>

      @if (cargando()) {
        <p class="text-sm text-gray-500">Cargando perfil...</p>
      }

      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {{ error() }}
        </div>
      }

      @if (cliente()) {
        <!-- Perfil -->
        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-lg font-semibold text-gray-800">{{ cliente()!.firstName }} {{ cliente()!.lastName }}</p>
              <p class="text-sm text-gray-500">{{ cliente()!.email }}</p>
            </div>
            <div class="flex items-center gap-3">
              @if (cliente()!.mustChangePassword) {
                <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  Debe cambiar contraseña
                </span>
              }
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                [class]="nivelClase(cliente()!.nivel)"
              >
                {{ cliente()!.nivel | label }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Puntos disponibles</p>
              <p class="font-semibold text-gray-800">{{ cliente()!.puntos }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Puntos totales</p>
              <p class="font-semibold text-gray-800">{{ cliente()!.puntosTotal }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Viajes completados</p>
              <p class="font-semibold text-gray-800">{{ cliente()!.viajes }}</p>
            </div>
            <div>
              <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Registrado</p>
              <p class="font-semibold text-gray-800">{{ cliente()!.fechaRegistro | date:'dd/MM/yyyy':'':'es-PE' }}</p>
            </div>
          </div>

          @if (cliente()!.phone || cliente()!.nationality || cliente()!.documentNumber) {
            <div class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 border-t pt-4">
              @if (cliente()!.phone) {
                <div>
                  <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Teléfono</p>
                  <p class="text-gray-700">{{ cliente()!.phone }}</p>
                </div>
              }
              @if (cliente()!.nationality) {
                <div>
                  <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Nacionalidad</p>
                  <p class="text-gray-700">{{ cliente()!.nationality }}</p>
                </div>
              }
              @if (cliente()!.documentNumber) {
                <div>
                  <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Documento</p>
                  <p class="text-gray-700">{{ cliente()!.documentNumber }}</p>
                </div>
              }
            </div>
          }

          @if (cliente()!.travelStyle || cliente()!.destinationType || cliente()!.spendingRange) {
            <div class="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 border-t pt-4">
              @if (cliente()!.travelStyle) {
                <div>
                  <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Forma de viajar</p>
                  <p class="text-gray-700">{{ cliente()!.travelStyle | label }}</p>
                </div>
              }
              @if (cliente()!.destinationType) {
                <div>
                  <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Tipo de destino</p>
                  <p class="text-gray-700">{{ cliente()!.destinationType | label }}</p>
                </div>
              }
              @if (cliente()!.spendingRange) {
                <div>
                  <p class="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Rango de gasto</p>
                  <p class="text-gray-700">{{ cliente()!.spendingRange | label }}</p>
                </div>
              }
            </div>
          }

          <!-- Acción de restablecimiento -->
          <div class="border-t pt-4">
            <button
              (click)="restablecerContrasena()"
              [disabled]="resetCargando()"
              class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ resetCargando() ? 'Procesando...' : 'Restablecer contraseña' }}
            </button>
          </div>
        </div>

        <!-- Modal con contraseña temporal -->
        @if (contrasenaTemp()) {
          <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h2 class="text-lg font-bold text-gray-800">Contraseña temporal generada</h2>
              <p class="text-sm text-gray-600">
                Comparte esta contraseña con el cliente por un canal seguro.
                <strong>No se volverá a mostrar.</strong>
              </p>
              <div class="bg-gray-100 rounded-lg px-4 py-3 font-mono text-xl text-center tracking-widest text-gray-800 select-all">
                {{ contrasenaTemp() }}
              </div>
              <p class="text-xs text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
                Cópiala ahora. Al cerrar este aviso no habrá forma de recuperarla.
              </p>
              <div class="flex justify-end gap-3">
                <button
                  (click)="copiarContrasena()"
                  class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Copiar
                </button>
                <button
                  (click)="cerrarModal()"
                  class="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Reservas -->
        <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b">
            <h2 class="text-base font-semibold text-gray-700">Reservas ({{ cliente()!.reservas.length }})</h2>
          </div>
          @if (cliente()!.reservas.length === 0) {
            <p class="px-6 py-4 text-sm text-gray-500">Sin reservas registradas.</p>
          } @else {
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Código</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th class="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th class="text-right px-4 py-3 font-semibold text-gray-600">Pts. ganados</th>
                  <th class="text-right px-4 py-3 font-semibold text-gray-600">Pts. usados</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                @for (r of cliente()!.reservas; track r.id) {
                  <tr class="hover:bg-gray-50 transition">
                    <td class="px-4 py-3 font-mono text-gray-700">{{ r.confirmationCode }}</td>
                    <td class="px-4 py-3">
                      <span
                        class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [class]="estadoClase(r.status)"
                      >
                        {{ r.status | label }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right text-gray-700">{{ r.currency }} {{ r.totalPrice }}</td>
                    <td class="px-4 py-3 text-right text-gray-700">{{ r.pointsEarned }}</td>
                    <td class="px-4 py-3 text-right text-gray-700">{{ r.pointsUsed }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ r.createdAt | date:'dd/MM/yyyy':'':'es-PE' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <!-- Historial de puntos -->
        <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b">
            <h2 class="text-base font-semibold text-gray-700">Historial de puntos ({{ cliente()!.historialPuntos.length }})</h2>
          </div>
          @if (cliente()!.historialPuntos.length === 0) {
            <p class="px-6 py-4 text-sm text-gray-500">Sin movimientos de puntos.</p>
          } @else {
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                  <th class="text-right px-4 py-3 font-semibold text-gray-600">Puntos</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Descripción</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                @for (h of cliente()!.historialPuntos; track h.id) {
                  <tr class="hover:bg-gray-50 transition">
                    <td class="px-4 py-3">
                      <span
                        class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [class]="puntosClase(h.type)"
                      >
                        {{ h.type | label }}
                      </span>
                    </td>
                    <td
                      class="px-4 py-3 text-right font-semibold"
                      [class.text-green-700]="h.points > 0"
                      [class.text-red-600]="h.points < 0"
                    >
                      {{ h.points > 0 ? '+' : '' }}{{ h.points }}
                    </td>
                    <td class="px-4 py-3 text-gray-600">{{ h.description }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ h.createdAt | date:'dd/MM/yyyy':'':'es-PE' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <!-- Reseñas -->
        <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b">
            <h2 class="text-base font-semibold text-gray-700">Calificaciones ({{ cliente()!.resenas?.length ?? 0 }})</h2>
          </div>
          @if (!cliente()!.resenas?.length) {
            <p class="px-6 py-4 text-sm text-gray-500">Sin calificaciones registradas.</p>
          } @else {
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Reserva</th>
                  <th class="text-center px-4 py-3 font-semibold text-gray-600">Estrellas</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Comentario</th>
                  <th class="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                @for (r of cliente()!.resenas; track r.id) {
                  <tr class="hover:bg-gray-50 transition">
                    <td class="px-4 py-3 font-mono text-gray-700">{{ r.codigoReserva }}</td>
                    <td class="px-4 py-3 text-center text-yellow-500">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ r.comment ?? '—' }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ r.updatedAt | date:'dd/MM/yyyy':'':'es-PE' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </div>
  `,
})
export class AdminClientDetailComponent implements OnInit {
  cliente = signal<ClienteDetalle | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  resetCargando = signal(false);
  contrasenaTemp = signal<string | null>(null);

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar(id);
  }

  /** Carga el perfil completo del cliente desde la API. */
  private cargar(id: number) {
    this.cargando.set(true);
    this.error.set(null);
    this.api.get<ClienteDetalle>(`clients/admin/${id}`).subscribe({
      next: (data) => {
        this.cliente.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'No se pudo cargar el perfil del cliente.'));
        this.cargando.set(false);
      },
    });
  }

  /** Solicita al backend que genere una contraseña temporal y la muestra en el modal. */
  restablecerContrasena() {
    const c = this.cliente();
    if (!c) return;
    if (!confirm(`¿Restablecer la contraseña de ${c.firstName} ${c.lastName}? Se generará una contraseña temporal.`)) return;

    this.resetCargando.set(true);
    this.api.patch<{ contrasenaTemporalUnica: string }>(`clients/admin/${c.id}/reset-password`, {}).subscribe({
      next: (res) => {
        this.contrasenaTemp.set(res.contrasenaTemporalUnica);
        this.resetCargando.set(false);
        // Recarga el perfil para reflejar mustChangePassword = true
        this.cargar(c.id);
      },
      error: (err) => {
        this.toast.error(apiErrorMessage(err, 'No se pudo restablecer la contraseña.'));
        this.resetCargando.set(false);
      },
    });
  }

  /** Copia la contraseña temporal al portapapeles. */
  copiarContrasena() {
    const temp = this.contrasenaTemp();
    if (!temp) return;
    navigator.clipboard.writeText(temp).then(() => {
      this.toast.success('Contraseña copiada al portapapeles.');
    });
  }

  /** Cierra el modal y elimina la contraseña temporal de la memoria. */
  cerrarModal() {
    this.contrasenaTemp.set(null);
  }

  /** Devuelve las clases de color para la etiqueta de nivel. */
  nivelClase(nivel: string): string {
    const map: Record<string, string> = {
      EXPLORADOR: 'bg-gray-100 text-gray-600',
      VIAJERO: 'bg-blue-100 text-blue-700',
      FRECUENTE: 'bg-purple-100 text-purple-700',
      ELITE: 'bg-yellow-100 text-yellow-700',
    };
    return map[nivel] ?? 'bg-gray-100 text-gray-600';
  }

  /** Devuelve las clases de color para la etiqueta de estado de reserva. */
  estadoClase(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-700',
      CONFIRMADO: 'bg-blue-100 text-blue-700',
      EN_CURSO: 'bg-indigo-100 text-indigo-700',
      COMPLETADO: 'bg-green-100 text-green-700',
      CANCELADO: 'bg-red-100 text-red-600',
    };
    return map[estado] ?? 'bg-gray-100 text-gray-600';
  }

  /** Devuelve las clases de color para el tipo de movimiento de puntos. */
  puntosClase(tipo: string): string {
    const map: Record<string, string> = {
      EARNED: 'bg-green-100 text-green-700',
      REDEEMED: 'bg-orange-100 text-orange-700',
      EARNED_REFUND: 'bg-teal-100 text-teal-700',
      REDEEMED_REFUND: 'bg-blue-100 text-blue-700',
    };
    return map[tipo] ?? 'bg-gray-100 text-gray-600';
  }
}
