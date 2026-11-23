import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/services/api-error';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <h1 class="text-[28px] leading-9 sm:text-4xl sm:leading-[44px] font-bold tracking-tight text-primary-700">Mi perfil</h1>

      @if (profile()) {
        <!-- Datos personales -->
        <div class="bg-white rounded-2xl border border-slate-900/[0.06] shadow-card p-5">
          <h2 class="text-lg font-bold tracking-tight text-primary-700 mb-4">Datos personales</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-slate-500 mb-1">Nombre</label>
              <input type="text" [(ngModel)]="editForm.firstName"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Apellido</label>
              <input type="text" [(ngModel)]="editForm.lastName"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Teléfono</label>
              <input type="text" [(ngModel)]="editForm.phone"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Nacionalidad</label>
              <input type="text" [(ngModel)]="editForm.nationality"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <button (click)="saveProfile()" [disabled]="saving()"
            class="mt-4 bg-accent-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-accent-700 transition disabled:opacity-50">
            {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>

        <!-- Documento de viaje -->
        <div class="bg-white rounded-2xl border border-slate-900/[0.06] shadow-card p-5">
          <h2 class="text-lg font-bold tracking-tight text-primary-700 mb-1">Documento de viaje</h2>
          <p class="text-sm text-slate-500 mb-4">Se usará para pre-rellenar el titular en tu próxima reserva.</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs text-slate-500 mb-1">Tipo</label>
              <select [(ngModel)]="docForm.documentType"
                class="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="DNI">DNI</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Número</label>
              <input type="text" [(ngModel)]="docForm.documentNumber"
                [attr.maxlength]="docForm.documentType === 'PASAPORTE' ? 12 : 8"
                [placeholder]="docForm.documentType === 'PASAPORTE' ? 'Ej. AB123456' : 'Ej. 12345678'"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Fecha de nacimiento</label>
              <input type="date" [(ngModel)]="docForm.dateOfBirth"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <button (click)="saveDoc()" [disabled]="savingDoc()"
            class="mt-4 bg-accent-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-accent-700 transition disabled:opacity-50">
            {{ savingDoc() ? 'Guardando...' : 'Guardar documento' }}
          </button>
        </div>

        <!-- Preferencias -->
        <div class="bg-white rounded-2xl border border-slate-900/[0.06] shadow-card p-5">
          <h2 class="text-lg font-bold tracking-tight text-primary-700 mb-4">Preferencias de viaje</h2>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-500 mb-2">¿Cómo viajas?</label>
              <div class="space-y-1">
                @for (opt of travelOptions; track opt.value) {
                  <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="travelStyle" [value]="opt.value" [(ngModel)]="editForm.travelStyle" />
                    {{ opt.label }}
                  </label>
                }
              </div>
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-2">¿Qué destino prefieres?</label>
              <div class="space-y-1">
                @for (opt of destinationOptions; track opt.value) {
                  <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="destinationType" [value]="opt.value" [(ngModel)]="editForm.destinationType" />
                    {{ opt.label }}
                  </label>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Viajeros frecuentes -->
        <div class="bg-white rounded-2xl border border-slate-900/[0.06] shadow-card p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold tracking-tight text-primary-700">Viajeros frecuentes</h2>
            <button (click)="openAddTraveler()" class="text-sm text-primary-600 hover:underline">+ Agregar</button>
          </div>
          @if (travelers().length === 0) {
            <p class="text-sm text-slate-400">No tienes viajeros guardados aún.</p>
          }
          @for (t of travelers(); track t.id) {
            <div class="border-b last:border-0">
              <!-- Normal row -->
              @if (editingTravelerId() !== t.id && deletingTravelerId() !== t.id) {
                <div class="flex items-center justify-between py-2">
                  <div>
                    <p class="text-sm font-medium">{{ t.firstName }} {{ t.lastName }}</p>
                    <p class="text-xs text-slate-500">{{ t.relation }} · Doc: {{ t.documentNumber }}</p>
                  </div>
                  <div class="flex gap-3">
                    <button (click)="startEditTraveler(t)" class="text-primary-500 hover:text-primary-700 text-xs">Editar</button>
                    <button (click)="startDeleteTraveler(t.id)" class="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
                  </div>
                </div>
              }
              <!-- Inline delete confirmation -->
              @if (deletingTravelerId() === t.id) {
                <div class="flex items-center justify-between py-2 bg-red-50 rounded-lg px-3 my-1">
                  <p class="text-sm text-slate-700">¿Eliminar a {{ t.firstName }} {{ t.lastName }} de tus viajeros?</p>
                  <div class="flex gap-2 ml-3 shrink-0">
                    <button (click)="confirmDeleteTraveler(t.id)"
                      class="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 transition">
                      Eliminar
                    </button>
                    <button (click)="cancelDeleteTraveler()"
                      class="border border-slate-300 text-slate-600 px-3 py-1 rounded text-xs hover:bg-slate-100 transition">
                      Cancelar
                    </button>
                  </div>
                </div>
              }
              <!-- Inline edit form -->
              @if (editingTravelerId() === t.id) {
                <div class="py-3 space-y-2">
                  <div class="grid grid-cols-2 gap-2">
                    <input type="text" [(ngModel)]="editTravelerForm.firstName" placeholder="Nombre"
                      class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400" />
                    <input type="text" [(ngModel)]="editTravelerForm.lastName" placeholder="Apellido"
                      class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400" />
                    <input type="text" [(ngModel)]="editTravelerForm.documentNumber" placeholder="Documento"
                      class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400" />
                    <input type="date" [(ngModel)]="editTravelerForm.dateOfBirth"
                      class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400" />
                    <input type="text" [(ngModel)]="editTravelerForm.relation" placeholder="Relación (pareja, hijo...)"
                      class="border rounded px-3 py-2 text-sm col-span-2 focus:outline-none focus:ring-1 focus:ring-primary-400" />
                  </div>
                  <div class="flex gap-2">
                    <button (click)="saveEditTraveler(t.id)"
                      class="bg-accent-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-accent-700 transition">
                      Guardar
                    </button>
                    <button (click)="cancelEditTraveler()"
                      class="border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-100 transition">
                      Cancelar
                    </button>
                  </div>
                </div>
              }
            </div>
          }
          <!-- Add traveler form -->
          @if (showAddTraveler()) {
            <div class="mt-3 space-y-2 border-t pt-3">
              <div class="grid grid-cols-2 gap-2">
                <input type="text" [(ngModel)]="newTraveler.firstName" placeholder="Nombre"
                  class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400" />
                <input type="text" [(ngModel)]="newTraveler.lastName" placeholder="Apellido"
                  class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400" />
                <input type="text" [(ngModel)]="newTraveler.documentNumber" placeholder="Documento"
                  class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400" />
                <input type="date" [(ngModel)]="newTraveler.dateOfBirth"
                  class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400" />
                <input type="text" [(ngModel)]="newTraveler.relation" placeholder="Relación (pareja, hijo...)"
                  class="border rounded px-3 py-2 text-sm col-span-2 focus:outline-none focus:ring-1 focus:ring-primary-400" />
              </div>
              <div class="flex gap-2">
                <button (click)="addTraveler()"
                  class="bg-accent-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-accent-700 transition">
                  Guardar viajero
                </button>
                <button (click)="showAddTraveler.set(false)"
                  class="border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-100 transition">
                  Cancelar
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Cambiar contraseña -->
        <a routerLink="/profile/change-password"
          class="block w-full border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition text-center">
          Cambiar contraseña
        </a>

        <!-- Cerrar sesión -->
        <button (click)="auth.logout()"
          class="w-full border border-slate-200 text-slate-500 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition">
          Cerrar sesión
        </button>
      }
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  profile = signal<any>(null);
  travelers = signal<any[]>([]);
  saving = signal(false);
  savingDoc = signal(false);
  showAddTraveler = signal(false);
  editingTravelerId = signal<number | null>(null);
  deletingTravelerId = signal<number | null>(null);
  editForm: any = {};
  docForm: any = {};
  newTraveler: any = {};
  editTravelerForm: any = {};

  travelOptions = [
    { value: 'SOLO', label: '🧍 Solo' }, { value: 'PAREJA', label: '👫 Pareja' },
    { value: 'FAMILIA', label: '👨‍👩‍👧 Familia' }, { value: 'GRUPO', label: '👥 Grupo' },
  ];
  destinationOptions = [
    { value: 'PLAYA', label: '🏖️ Playa' }, { value: 'CIUDAD', label: '🏙️ Ciudad' },
    { value: 'AVENTURA', label: '🏔️ Aventura' }, { value: 'CULTURA', label: '🏛️ Cultura' },
  ];

  constructor(private api: ApiService, public auth: AuthService, private toast: ToastService) {}

  ngOnInit() {
    this.api.get<any>('clients/me').subscribe(p => {
      this.profile.set(p);
      this.editForm = {
        firstName: p.firstName, lastName: p.lastName,
        phone: p.phone, nationality: p.nationality,
        travelStyle: p.travelStyle, destinationType: p.destinationType,
      };
      this.docForm = {
        documentType: p.documentType ?? 'DNI',
        documentNumber: p.documentNumber ?? '',
        dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
      };
    });
    this.api.get<any[]>('clients/me/travelers').subscribe(t => this.travelers.set(t));
  }

  saveProfile() {
    this.saving.set(true);
    this.api.patch<any>('clients/me', this.editForm).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Datos actualizados'); },
      error: () => this.saving.set(false),
    });
  }

  saveDoc() {
    const regexDni = /^\d{8}$/;
    const regexPasaporte = /^[A-Z0-9]{6,12}$/i;
    const { documentType, documentNumber, dateOfBirth } = this.docForm;

    if (documentNumber) {
      if (documentType === 'DNI' && !regexDni.test(documentNumber)) {
        this.toast.error('El DNI debe tener exactamente 8 dígitos');
        return;
      }
      if (documentType === 'PASAPORTE' && !regexPasaporte.test(documentNumber)) {
        this.toast.error('El pasaporte debe ser alfanumérico de 6 a 12 caracteres');
        return;
      }
    }

    if (dateOfBirth) {
      const fecha = new Date(dateOfBirth);
      if (isNaN(fecha.getTime()) || fecha >= new Date() || fecha < new Date('1900-01-01')) {
        this.toast.error('La fecha de nacimiento debe estar entre 1900 y hoy');
        return;
      }
    }

    this.savingDoc.set(true);
    this.api.patch<any>('clients/me', { documentType, documentNumber, dateOfBirth }).subscribe({
      next: () => { this.savingDoc.set(false); this.toast.success('Documento guardado'); },
      error: (err) => { this.savingDoc.set(false); this.toast.error(apiErrorMessage(err, 'No se pudo guardar el documento')); },
    });
  }

  openAddTraveler() {
    this.showAddTraveler.set(true);
    this.cancelEditTraveler();
    this.cancelDeleteTraveler();
  }

  addTraveler() {
    this.api.post<any>('clients/me/travelers', this.newTraveler).subscribe({
      next: (t) => {
        this.travelers.update(list => [...list, t]);
        this.newTraveler = {};
        this.showAddTraveler.set(false);
      },
      error: (err) => this.toast.error(apiErrorMessage(err, 'No se pudo guardar el viajero')),
    });
  }

  startEditTraveler(t: any) {
    this.cancelDeleteTraveler();
    this.showAddTraveler.set(false);
    this.editingTravelerId.set(t.id);
    const dob = t.dateOfBirth ? new Date(t.dateOfBirth).toISOString().split('T')[0] : '';
    this.editTravelerForm = { firstName: t.firstName, lastName: t.lastName, documentNumber: t.documentNumber, dateOfBirth: dob, relation: t.relation };
  }

  cancelEditTraveler() {
    this.editingTravelerId.set(null);
    this.editTravelerForm = {};
  }

  saveEditTraveler(id: number) {
    this.api.patch<any>(`clients/me/travelers/${id}`, this.editTravelerForm).subscribe({
      next: (updated) => {
        this.travelers.update(list => list.map(t => t.id === id ? updated : t));
        this.cancelEditTraveler();
        this.toast.success('Datos actualizados');
      },
      error: (err) => this.toast.error(apiErrorMessage(err, 'No se pudo actualizar el viajero')),
    });
  }

  startDeleteTraveler(id: number) {
    this.cancelEditTraveler();
    this.showAddTraveler.set(false);
    this.deletingTravelerId.set(id);
  }

  cancelDeleteTraveler() {
    this.deletingTravelerId.set(null);
  }

  confirmDeleteTraveler(id: number) {
    this.api.delete(`clients/me/travelers/${id}`).subscribe({
      next: () => {
        this.travelers.update(list => list.filter(t => t.id !== id));
        this.deletingTravelerId.set(null);
      },
      error: () => this.toast.error('No se pudo eliminar el viajero'),
    });
  }
}
