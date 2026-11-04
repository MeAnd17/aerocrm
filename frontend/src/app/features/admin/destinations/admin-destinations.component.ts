import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import { AdminDestinationFormComponent } from './admin-destination-form.component';

/** Representa un destino del catálogo tal como llega de GET /destinations/admin/all. */
interface Destino {
  id: number;
  name: string;
  country: string;
  city: string;
  iataCode: string;
  type: string;
  isActive: boolean;
}

/**
 * Pantalla de administración de destinos: lista, crea, edita y desactiva destinos (US-027).
 */
@Component({
  selector: 'app-admin-destinations',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe, AdminDestinationFormComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-800">Destinos</h1>
        <button
          (click)="abrirFormNuevo()"
          class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Agregar destino
        </button>
      </div>

      @if (cargando()) {
        <p class="text-sm text-gray-500">Cargando destinos...</p>
      }

      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {{ error() }}
        </div>
      }

      @if (destinoEditando()) {
        <div class="bg-white border rounded-xl shadow-sm p-6">
          <h2 class="text-base font-semibold text-gray-700 mb-4">
            {{ destinoEditando()!.id === 0 ? 'Nuevo destino' : 'Editar destino' }}
          </h2>
          <app-admin-destination-form
            [destino]="destinoEditando()!"
            (guardado)="onGuardado()"
            (cancelado)="destinoEditando.set(null)"
          />
        </div>
      }

      @if (!cargando() && destinos().length === 0 && !error()) {
        <p class="text-sm text-gray-500">No hay destinos registrados.</p>
      }

      @if (destinos().length > 0) {
        <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Destino</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Ciudad / País</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">IATA</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              @for (dest of destinos(); track dest.id) {
                <tr class="hover:bg-gray-50 transition" [class.opacity-50]="!dest.isActive">
                  <td class="px-4 py-3 font-medium text-gray-800">{{ dest.name }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ dest.city }}, {{ dest.country }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ dest.iataCode }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ dest.type | label }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [class.bg-green-100]="dest.isActive"
                      [class.text-green-700]="dest.isActive"
                      [class.bg-gray-100]="!dest.isActive"
                      [class.text-gray-500]="!dest.isActive"
                    >
                      {{ dest.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <button
                        (click)="abrirFormEditar(dest)"
                        class="text-blue-600 hover:text-blue-800 text-xs font-medium transition"
                      >
                        Editar
                      </button>
                      <a
                        [routerLink]="['/admin/destinations', dest.id, 'inventory']"
                        class="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition"
                      >
                        Inventario
                      </a>
                      @if (dest.isActive) {
                        <button
                          (click)="desactivar(dest)"
                          class="text-red-500 hover:text-red-700 text-xs font-medium transition"
                        >
                          Desactivar
                        </button>
                      }
                    </div>
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
export class AdminDestinationsComponent implements OnInit {
  destinos = signal<Destino[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  destinoEditando = signal<Destino | null>(null);

  constructor(
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.cargar();
  }

  /** Abre el formulario en modo creación. */
  abrirFormNuevo() {
    this.destinoEditando.set({ id: 0, name: '', country: '', city: '', iataCode: '', type: 'PLAYA', isActive: true });
  }

  /** Abre el formulario en modo edición con los datos del destino seleccionado. */
  abrirFormEditar(dest: Destino) {
    this.destinoEditando.set({ ...dest });
  }

  /** Callback tras guardar: cierra el formulario y recarga la lista. */
  onGuardado() {
    this.destinoEditando.set(null);
    this.cargar();
  }

  /** Desactiva el destino tras confirmación del usuario. */
  desactivar(dest: Destino) {
    if (!confirm(`¿Desactivar "${dest.name}"? Esta acción no se puede revertir desde aquí.`)) return;
    this.api.patch<Destino>(`destinations/${dest.id}/deactivate`, {}).subscribe({
      next: () => {
        this.toast.success(`"${dest.name}" fue desactivado.`);
        this.cargar();
      },
      error: (err) => this.toast.error(apiErrorMessage(err, 'No se pudo desactivar el destino.')),
    });
  }

  /** Carga la lista de todos los destinos desde el endpoint de administración. */
  private cargar() {
    this.cargando.set(true);
    this.error.set(null);
    this.api.get<Destino[]>('destinations/admin/all').subscribe({
      next: (data) => {
        this.destinos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'No se pudieron cargar los destinos.'));
        this.cargando.set(false);
      },
    });
  }
}
