import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PackageBuilderState, PassengerDraft } from '../package-builder.state';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';

/** Viajero frecuente devuelto por GET /clients/me/travelers. */
interface ViajeroBD {
  id: number;
  firstName: string;
  lastName: string;
  documentType?: 'DNI' | 'PASAPORTE';
  documentNumber: string;
  dateOfBirth: string;
}

/**
 * Paso 6 · Datos de los pasajeros (US-010).
 *
 * Muestra un formulario por cada asiento seleccionado. El titular (pasajero 0)
 * se pre-rellena con los datos del usuario autenticado. Los demás pasajeros
 * pueden completarse a mano o copiarse de la lista de viajeros frecuentes.
 * Al continuar, los datos se guardan en el estado; si el usuario marcó
 * "Guardar como viajero frecuente", se llama POST /clients/me/travelers.
 */
@Component({
  selector: 'app-step-passengers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border shadow-sm p-5 space-y-5">
      <div>
        <h3 class="font-semibold text-gray-800 text-lg">Datos de los pasajeros</h3>
        <p class="text-sm text-gray-500 mt-1">
          Completa los datos de cada pasajero. El titular se pre-rellena con tu cuenta.
        </p>
      </div>

      @for (pasajero of borradores(); track pasajero; let i = $index) {
        <div class="border rounded-xl p-4 space-y-3"
          [class.border-blue-300]="i === 0"
          [class.bg-blue-50]="i === 0">

          <!-- Encabezado del pasajero -->
          <div class="flex items-center justify-between flex-wrap gap-2">
            <p class="font-semibold text-sm text-gray-700">
              Pasajero {{ i + 1 }}
              @if (i === 0) { <span class="ml-1 text-blue-600">(titular)</span> }
            </p>

            <!-- Selector de viajero frecuente (solo pasajeros no titulares) -->
            @if (i > 0 && viajerosFrecuentes().length > 0) {
              <select
                class="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white"
                (change)="copiarViajero(i, $event)">
                <option value="">Copiar viajero frecuente…</option>
                @for (v of viajerosFrecuentes(); track v.id) {
                  <option [value]="v.id">{{ v.firstName }} {{ v.lastName }}</option>
                }
              </select>
            }
          </div>

          <!-- Nombre -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
              <input
                type="text"
                [(ngModel)]="pasajero.firstName"
                [disabled]="i === 0 && estaAutenticado()"
                placeholder="Nombre"
                [class.border-red-400]="mostrarErrores() && !pasajero.firstName.trim()"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-500" />
              @if (mostrarErrores() && !pasajero.firstName.trim()) {
                <p class="text-xs text-red-500 mt-0.5">Requerido</p>
              }
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Apellido</label>
              <input
                type="text"
                [(ngModel)]="pasajero.lastName"
                [disabled]="i === 0 && estaAutenticado()"
                placeholder="Apellido"
                [class.border-red-400]="mostrarErrores() && !pasajero.lastName.trim()"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-500" />
              @if (mostrarErrores() && !pasajero.lastName.trim()) {
                <p class="text-xs text-red-500 mt-0.5">Requerido</p>
              }
            </div>
          </div>

          <!-- Tipo de documento, número y fecha de nacimiento -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Tipo de documento</label>
              <select
                [(ngModel)]="pasajero.documentType"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                <option value="DNI">DNI</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Número de documento</label>
              <input
                type="text"
                [(ngModel)]="pasajero.documentNumber"
                [attr.inputmode]="pasajero.documentType === 'PASAPORTE' ? null : 'numeric'"
                [attr.maxlength]="pasajero.documentType === 'PASAPORTE' ? 12 : 8"
                [placeholder]="pasajero.documentType === 'PASAPORTE' ? 'Ej. AB123456' : 'Ej. 12345678'"
                (input)="pasajero.documentType === 'PASAPORTE' && mayusculasDoc(i, $event)"
                [class.border-red-400]="mostrarErrores() && !pasajero.documentNumber.trim()"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              @if (mostrarErrores() && !pasajero.documentNumber.trim()) {
                <p class="text-xs text-red-500 mt-0.5">Requerido</p>
              }
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Fecha de nacimiento</label>
              <input
                type="date"
                [(ngModel)]="pasajero.birthDate"
                [class.border-red-400]="mostrarErrores() && !pasajero.birthDate"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              @if (mostrarErrores() && !pasajero.birthDate) {
                <p class="text-xs text-red-500 mt-0.5">Requerida</p>
              }
            </div>
          </div>

          <!-- Guardar como viajero frecuente (solo pasajeros no titulares y sesión activa) -->
          @if (i > 0 && estaAutenticado()) {
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                [(ngModel)]="pasajero.saveAsTraveler"
                class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400" />
              <span class="text-xs text-gray-600">Guardar como viajero frecuente</span>
            </label>
          }
        </div>
      }

      <!-- Acciones -->
      <div class="flex gap-3 pt-2">
        <button
          (click)="continuar()"
          [disabled]="guardando()"
          class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition text-sm disabled:opacity-50">
          @if (guardando()) { Guardando… } @else { Continuar }
        </button>
        <button
          (click)="state.goTo(5)"
          class="text-sm text-gray-400 px-3 hover:text-gray-600 transition">
          Volver
        </button>
      </div>
    </div>
  `,
})
export class StepPassengersComponent implements OnInit {
  readonly state = inject(PackageBuilderState);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  /** Borradores mutables de cada pasajero que se muestran en los formularios. */
  readonly borradores = signal<PassengerDraft[]>([]);
  readonly viajerosFrecuentes = signal<ViajeroBD[]>([]);
  readonly guardando = signal(false);
  /** Se activa al primer intento de continuar para mostrar errores por campo. */
  readonly mostrarErrores = signal(false);

  readonly estaAutenticado = () => this.auth.isAuthenticated();

  constructor() {
    // Cuando el visitante inicia sesión mientras está en este paso, actualiza
    // el nombre y apellido del titular con los del usuario autenticado (US-006).
    effect(() => {
      const usuario = this.auth.currentUser();
      if (!usuario) return;
      const lista = this.borradores();
      if (lista.length === 0) return;
      if (lista[0].firstName === usuario.firstName && lista[0].lastName === usuario.lastName) return;
      const copia = [...lista];
      copia[0] = { ...copia[0], firstName: usuario.firstName, lastName: usuario.lastName };
      this.borradores.set(copia);
    });
  }

  ngOnInit() {
    this._inicializarBorradores();
    if (this.estaAutenticado()) {
      this._cargarViajerosFrecuentes();
    }
  }

  /**
   * Arma la lista de borradores según la cantidad de asientos (state.passengers()).
   * Si ya hay borradores guardados en el estado, los restaura.
   */
  private _inicializarBorradores() {
    const guardados = this.state.passengerDrafts();
    const cantidad = this.state.passengers();

    if (guardados.length === cantidad) {
      // Restaurar borradores previos (el usuario volvió al paso)
      this.borradores.set(guardados.map(p => ({ ...p })));
      return;
    }

    const usuario = this.auth.currentUser();
    const nuevos: PassengerDraft[] = [];

    for (let i = 0; i < cantidad; i++) {
      if (i === 0 && usuario) {
        // Titular: pre-rellenar con datos del usuario autenticado
        nuevos.push({
          firstName: usuario.firstName,
          lastName: usuario.lastName,
          documentType: 'DNI',
          documentNumber: '',
          birthDate: '',
          isHolder: true,
          saveAsTraveler: false,
        });
      } else {
        nuevos.push({
          firstName: '',
          lastName: '',
          documentType: 'DNI',
          documentNumber: '',
          birthDate: '',
          isHolder: false,
          saveAsTraveler: false,
        });
      }
    }

    this.borradores.set(nuevos);
  }

  /** Carga los viajeros frecuentes del cliente para pre-rellenar otros pasajeros. */
  private _cargarViajerosFrecuentes() {
    this.api.get<ViajeroBD[]>('clients/me/travelers').subscribe({
      next: (viajeros) => this.viajerosFrecuentes.set(viajeros),
      error: () => {
        // Los viajeros frecuentes son una comodidad; si falla, el paso sigue funcionando.
      },
    });
  }

  /** Fuerza mayúsculas en el campo de número de pasaporte mientras el usuario escribe. */
  mayusculasDoc(indice: number, evento: Event) {
    const input = evento.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    if (input.value !== upper) {
      input.value = upper;
    }
    const copia = [...this.borradores()];
    copia[indice] = { ...copia[indice], documentNumber: upper };
    this.borradores.set(copia);
  }

  /** Copia los datos de un viajero frecuente al formulario de un pasajero no titular. */
  copiarViajero(indice: number, evento: Event) {
    const id = Number((evento.target as HTMLSelectElement).value);
    if (!id) return;
    const viajero = this.viajerosFrecuentes().find(v => v.id === id);
    if (!viajero) return;

    const copia = [...this.borradores()];
    copia[indice] = {
      ...copia[indice],
      firstName: viajero.firstName,
      lastName: viajero.lastName,
      documentType: viajero.documentType ?? 'DNI',
      documentNumber: viajero.documentNumber,
      birthDate: viajero.dateOfBirth ?? '',
    };
    this.borradores.set(copia);
  }

  /** Valida, guarda en estado y, si corresponde, persiste viajeros frecuentes nuevos. */
  async continuar() {
    const lista = this.borradores();

    // Activar indicadores de error para mostrar bordes rojos y mensajes por campo.
    this.mostrarErrores.set(true);

    // Validación: todos los pasajeros deben tener los cuatro campos obligatorios.
    const incompleto = lista.some(
      p => !p.firstName.trim() || !p.lastName.trim() || !p.documentNumber.trim() || !p.birthDate,
    );
    if (incompleto) {
      this.toast.error('Completa los datos de todos los pasajeros');
      return;
    }

    // Validación: nombre y apellido (solo letras con tildes, ñ, espacios, guion y apóstrofo; 2–50).
    const regexNombre = /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s\-']{2,50}$/;
    const nombreInvalido = lista.some(
      p => !regexNombre.test(p.firstName.trim()) || !regexNombre.test(p.lastName.trim()),
    );
    if (nombreInvalido) {
      this.toast.error('El nombre y apellido solo pueden contener letras, espacios, guiones y apóstrofos (2–50 caracteres)');
      return;
    }

    // Validación: número de documento según el tipo seleccionado.
    const regexDni = /^\d{8}$/;
    const regexPasaporte = /^[A-Z0-9]{6,12}$/i;
    const documentoInvalido = lista.some(p =>
      p.documentType === 'DNI'
        ? !regexDni.test(p.documentNumber)
        : !regexPasaporte.test(p.documentNumber),
    );
    if (documentoInvalido) {
      this.toast.error('El DNI debe tener 8 dígitos; el pasaporte debe ser alfanumérico de 6 a 12 caracteres');
      return;
    }

    // Validación: fecha de nacimiento (no futura, no anterior a 1900).
    const hoy = new Date();
    const minima = new Date('1900-01-01');
    const fechaInvalida = lista.some(p => {
      const fecha = new Date(p.birthDate);
      return isNaN(fecha.getTime()) || fecha >= hoy || fecha < minima;
    });
    if (fechaInvalida) {
      this.toast.error('La fecha de nacimiento debe estar entre 1900 y hoy');
      return;
    }

    this.guardando.set(true);

    // Guardar viajeros frecuentes marcados (se procesan en paralelo, errores no bloquean).
    const promesas = lista
      .filter((p, i) => i > 0 && p.saveAsTraveler)
      .map(p =>
        this.api.post<unknown>('clients/me/travelers', {
          firstName: p.firstName,
          lastName: p.lastName,
          documentType: p.documentType ?? 'DNI',
          documentNumber: p.documentNumber,
          dateOfBirth: p.birthDate,
          relation: 'OTRO',
        }).toPromise().catch((err: unknown) => {
          this.toast.warning(
            apiErrorMessage(err as any, `No se pudo guardar a ${p.firstName} como viajero frecuente`),
          );
        }),
      );

    await Promise.all(promesas);

    // Persistir en el estado (sin la bandera de UI saveAsTraveler).
    this.state.passengerDrafts.set(
      lista.map(p => ({
        firstName: p.firstName,
        lastName: p.lastName,
        documentType: p.documentType ?? 'DNI',
        documentNumber: p.documentNumber,
        birthDate: p.birthDate,
        isHolder: p.isHolder,
      })),
    );

    this.guardando.set(false);
    this.state.goTo(7);
  }
}
