import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';

/** Modelo mínimo del destino usado en el formulario. */
interface DestinoForm {
  id: number;
  name: string;
  country: string;
  countryCode?: string;
  city: string;
  iataCode: string;
  type: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

/**
 * Formulario reutilizable para crear o editar un destino (US-027).
 * id === 0 indica creación; cualquier otro valor indica edición.
 */
@Component({
  selector: 'app-admin-destination-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <form (ngSubmit)="guardar()" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
          <input
            [(ngModel)]="form.name"
            name="name"
            required
            class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">País</label>
          <input
            [(ngModel)]="form.country"
            name="country"
            required
            class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Código de país (ISO)</label>
          <input
            [(ngModel)]="form.countryCode"
            name="countryCode"
            required
            placeholder="PE, MX, CO..."
            class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Ciudad</label>
          <input
            [(ngModel)]="form.city"
            name="city"
            required
            class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Código IATA</label>
          <input
            [(ngModel)]="form.iataCode"
            name="iataCode"
            required
            placeholder="LIM, CUN, BOG..."
            class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
          <select
            [(ngModel)]="form.type"
            name="type"
            required
            class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PLAYA">Playa</option>
            <option value="CIUDAD">Ciudad</option>
            <option value="AVENTURA">Aventura</option>
            <option value="CULTURA">Cultura</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-medium text-gray-600 mb-1">URL de imagen (opcional)</label>
          <input
            [(ngModel)]="form.imageUrl"
            name="imageUrl"
            class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
          <textarea
            [(ngModel)]="form.description"
            name="description"
            rows="3"
            class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
      </div>

      @if (errorMsg()) {
        <p class="text-sm text-red-600">{{ errorMsg() }}</p>
      }

      <div class="flex items-center gap-3">
        <button
          type="submit"
          [disabled]="guardando()"
          class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {{ guardando() ? 'Guardando...' : (destino.id === 0 ? 'Crear destino' : 'Guardar cambios') }}
        </button>
        <button
          type="button"
          (click)="cancelado.emit()"
          class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  `,
})
export class AdminDestinationFormComponent implements OnInit {
  /** Destino a editar. id === 0 indica que es un destino nuevo. */
  @Input() destino!: DestinoForm;
  /** Se emite cuando el destino se guardó exitosamente. */
  @Output() guardado = new EventEmitter<void>();
  /** Se emite cuando el usuario cancela sin guardar. */
  @Output() cancelado = new EventEmitter<void>();

  form: DestinoForm = { id: 0, name: '', country: '', countryCode: '', city: '', iataCode: '', type: 'PLAYA', isActive: true };
  guardando = signal(false);
  errorMsg = signal<string | null>(null);

  constructor(
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.form = { ...this.destino };
  }

  /** Envía el formulario al backend (POST para nuevo, PUT para edición). */
  guardar() {
    this.guardando.set(true);
    this.errorMsg.set(null);

    const payload = {
      name: this.form.name,
      country: this.form.country,
      countryCode: this.form.countryCode,
      city: this.form.city,
      iataCode: this.form.iataCode,
      type: this.form.type,
      description: this.form.description || undefined,
      imageUrl: this.form.imageUrl || undefined,
    };

    const peticion = this.destino.id === 0
      ? this.api.post('destinations', payload)
      : this.api.put(`destinations/${this.destino.id}`, payload);

    peticion.subscribe({
      next: () => {
        this.toast.success(this.destino.id === 0 ? 'Destino creado.' : 'Destino actualizado.');
        this.guardando.set(false);
        this.guardado.emit();
      },
      error: (err) => {
        this.errorMsg.set(apiErrorMessage(err, 'No se pudo guardar el destino.'));
        this.guardando.set(false);
      },
    });
  }
}
