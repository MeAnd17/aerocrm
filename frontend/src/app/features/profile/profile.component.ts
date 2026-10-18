import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/services/api-error';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import {
  ButtonComponent,
  CardComponent,
  FormFieldComponent,
  InputDirective,
} from '../../shared/ui';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LabelPipe, ButtonComponent, CardComponent, FormFieldComponent, InputDirective],
  template: `
    <div class="space-y-5">
      <h1 class="text-2xl font-bold text-slate-800">Mi perfil</h1>

      @if (!profile()) {
        <div class="py-10 text-center text-slate-400">Cargando...</div>
      }

      @if (profile()) {
        <!-- Datos personales -->
        <ui-card title="Datos personales">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ui-field label="Teléfono">
              <input uiInput type="text" [(ngModel)]="editForm.phone" placeholder="Ej. +51 999 888 777" />
            </ui-field>
            <ui-field label="Nacionalidad">
              <input uiInput type="text" [(ngModel)]="editForm.nationality" placeholder="Ej. Peruana" />
            </ui-field>
            <ui-field label="Fecha de nacimiento">
              <input uiInput type="date" [(ngModel)]="editForm.dateOfBirth" />
            </ui-field>
            <ui-field label="Número de documento">
              <input uiInput type="text" [(ngModel)]="editForm.documentNumber" placeholder="Ej. 12345678" />
            </ui-field>
          </div>
          <div class="mt-4 flex items-center gap-3">
            <button uiButton variant="primary" (click)="saveProfile()" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </ui-card>

        <!-- Preferencias de viaje -->
        <ui-card title="Preferencias de viaje">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p class="text-sm font-medium text-slate-700 mb-2">¿Cómo viajas?</p>
              <div class="space-y-2">
                @for (opt of travelOptions; track opt.value) {
                  <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="travelStyle" [value]="opt.value" [(ngModel)]="editForm.travelStyle" />
                    {{ opt.label }}
                  </label>
                }
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-700 mb-2">¿Qué destino prefieres?</p>
              <div class="space-y-2">
                @for (opt of destinationOptions; track opt.value) {
                  <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="destinationType" [value]="opt.value" [(ngModel)]="editForm.destinationType" />
                    {{ opt.label }}
                  </label>
                }
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-700 mb-2">¿Cuánto sueles gastar?</p>
              <div class="space-y-2">
                @for (opt of budgetOptions; track opt.value) {
                  <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="budget" [value]="opt.value" [(ngModel)]="editForm.budget" />
                    {{ opt.label }}
                  </label>
                }
              </div>
            </div>
          </div>
          <div class="mt-4">
            <button uiButton variant="primary" (click)="saveProfile()" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Guardar preferencias' }}
            </button>
          </div>
        </ui-card>

        <!-- Viajeros frecuentes -->
        <ui-card>
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-slate-800">Viajeros frecuentes</h2>
            <button uiButton variant="secondary" size="sm" (click)="openAddTraveler()">+ Agregar</button>
          </div>

          @if (travelers().length === 0 && !showTravelerForm()) {
            <p class="text-sm text-slate-400">No tienes viajeros guardados aún.</p>
          }

          <!-- Lista de viajeros -->
          <div class="divide-y divide-slate-100">
            @for (t of travelers(); track t.id) {
              @if (editingTravelerId() === t.id) {
                <!-- Formulario de edición inline -->
                <div class="py-3 space-y-3">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ui-field label="Nombre">
                      <input uiInput type="text" [(ngModel)]="travelerForm.firstName" />
                    </ui-field>
                    <ui-field label="Apellido">
                      <input uiInput type="text" [(ngModel)]="travelerForm.lastName" />
                    </ui-field>
                    <ui-field label="Documento">
                      <input uiInput type="text" [(ngModel)]="travelerForm.documentNumber" />
                    </ui-field>
                    <ui-field label="Fecha de nacimiento">
                      <input uiInput type="date" [(ngModel)]="travelerForm.dateOfBirth" />
                    </ui-field>
                    <ui-field label="Relación" class="sm:col-span-2">
                      <input uiInput type="text" [(ngModel)]="travelerForm.relation" placeholder="Ej. Pareja, Hijo, Padre" />
                    </ui-field>
                  </div>
                  <div class="flex gap-2">
                    <button uiButton variant="primary" size="sm" (click)="saveTraveler(t.id)">Guardar</button>
                    <button uiButton variant="ghost" size="sm" (click)="cancelTravelerForm()">Cancelar</button>
                  </div>
                </div>
              } @else {
                <div class="flex items-center justify-between py-3">
                  <div>
                    <p class="text-sm font-medium text-slate-800">{{ t.firstName }} {{ t.lastName }}</p>
                    <p class="text-xs text-slate-500">{{ t.relation }} · Doc: {{ t.documentNumber }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button uiButton variant="ghost" size="sm" (click)="startEditTraveler(t)">Editar</button>
                    <button uiButton variant="danger" size="sm" (click)="confirmDeleteTraveler(t)">Eliminar</button>
                  </div>
                </div>
              }
            }
          </div>

          <!-- Formulario de nuevo viajero -->
          @if (showTravelerForm() && editingTravelerId() === null) {
            <div class="border-t border-slate-100 pt-4 space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ui-field label="Nombre">
                  <input uiInput type="text" [(ngModel)]="travelerForm.firstName" placeholder="Nombre" />
                </ui-field>
                <ui-field label="Apellido">
                  <input uiInput type="text" [(ngModel)]="travelerForm.lastName" placeholder="Apellido" />
                </ui-field>
                <ui-field label="Documento">
                  <input uiInput type="text" [(ngModel)]="travelerForm.documentNumber" placeholder="Número de documento" />
                </ui-field>
                <ui-field label="Fecha de nacimiento">
                  <input uiInput type="date" [(ngModel)]="travelerForm.dateOfBirth" />
                </ui-field>
                <ui-field label="Relación" class="sm:col-span-2">
                  <input uiInput type="text" [(ngModel)]="travelerForm.relation" placeholder="Ej. Pareja, Hijo, Padre" />
                </ui-field>
              </div>
              <div class="flex gap-2">
                <button uiButton variant="primary" size="sm" (click)="saveTraveler(null)">Guardar viajero</button>
                <button uiButton variant="ghost" size="sm" (click)="cancelTravelerForm()">Cancelar</button>
              </div>
            </div>
          }
        </ui-card>

        <!-- Cerrar sesión -->
        <button uiButton variant="ghost" [block]="true" (click)="auth.logout()">Cerrar sesión</button>
      }
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  profile = signal<any>(null);
  travelers = signal<any[]>([]);
  saving = signal(false);
  editingTravelerId = signal<number | null>(null);
  showTravelerForm = signal(false);

  editForm: any = {};
  travelerForm: any = {};

  travelOptions = [
    { value: 'SOLO', label: '🧍 Solo' },
    { value: 'PAREJA', label: '👫 En pareja' },
    { value: 'FAMILIA', label: '👨‍👩‍👧 En familia' },
    { value: 'GRUPO', label: '👥 En grupo' },
  ];
  destinationOptions = [
    { value: 'PLAYA', label: '🏖️ Playa' },
    { value: 'CIUDAD', label: '🏙️ Ciudad' },
    { value: 'AVENTURA', label: '🏔️ Aventura' },
    { value: 'CULTURA', label: '🏛️ Cultura' },
  ];
  budgetOptions = [
    { value: '500', label: 'Menos de S/ 500' },
    { value: '1500', label: 'S/ 500 – S/ 1500' },
    { value: '3000', label: 'S/ 1500 – S/ 3000' },
    { value: '5000', label: 'Más de S/ 3000' },
  ];

  ngOnInit() {
    this.api.get<any>('clients/me').subscribe(p => {
      this.profile.set(p);
      this.editForm = {
        phone: p.phone ?? '',
        nationality: p.nationality ?? '',
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
        documentNumber: p.documentNumber ?? '',
        travelStyle: p.travelStyle ?? null,
        destinationType: p.destinationType ?? null,
        budget: p.budget ?? null,
      };
    });
    this.loadTravelers();
  }

  // ── Perfil ───────────────────────────────────────────────────────────────

  saveProfile() {
    this.saving.set(true);
    // Enviar solo los campos con valor para no sobreescribir con null
    const payload: any = {};
    if (this.editForm.phone) payload.phone = this.editForm.phone;
    if (this.editForm.nationality) payload.nationality = this.editForm.nationality;
    if (this.editForm.dateOfBirth) payload.dateOfBirth = this.editForm.dateOfBirth;
    if (this.editForm.documentNumber) payload.documentNumber = this.editForm.documentNumber;
    if (this.editForm.travelStyle) payload.travelStyle = this.editForm.travelStyle;
    if (this.editForm.destinationType) payload.destinationType = this.editForm.destinationType;
    if (this.editForm.budget) payload.budget = this.editForm.budget;

    this.api.patch<any>('clients/me', payload).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.profile.set({ ...this.profile(), ...updated });
        this.toast.success('Datos actualizados');     // CA5: texto exacto
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(apiErrorMessage(err, 'No se pudieron guardar los cambios'));
      },
    });
  }

  // ── Viajeros ─────────────────────────────────────────────────────────────

  private loadTravelers() {
    this.api.get<any[]>('clients/me/travelers').subscribe(t => this.travelers.set(t));
  }

  openAddTraveler() {
    this.travelerForm = { firstName: '', lastName: '', documentNumber: '', dateOfBirth: '', relation: '' };
    this.editingTravelerId.set(null);
    this.showTravelerForm.set(true);
  }

  startEditTraveler(t: any) {
    this.travelerForm = {
      firstName: t.firstName,
      lastName: t.lastName,
      documentNumber: t.documentNumber,
      dateOfBirth: t.dateOfBirth ? t.dateOfBirth.slice(0, 10) : '',
      relation: t.relation,
    };
    this.showTravelerForm.set(false);
    this.editingTravelerId.set(t.id);
  }

  cancelTravelerForm() {
    this.showTravelerForm.set(false);
    this.editingTravelerId.set(null);
    this.travelerForm = {};
  }

  saveTraveler(id: number | null) {
    const call = id === null
      ? this.api.post<any>('clients/me/travelers', this.travelerForm)
      : this.api.patch<any>(`clients/me/travelers/${id}`, this.travelerForm);

    call.subscribe({
      next: (saved) => {
        if (id === null) {
          this.travelers.update(list => [...list, saved]);
        } else {
          this.travelers.update(list => list.map(t => t.id === id ? saved : t));
        }
        this.cancelTravelerForm();
        this.toast.success('Datos actualizados');    // CA5: texto exacto
      },
      error: (err) => {
        this.toast.error(apiErrorMessage(err, 'No se pudo guardar el viajero'));
      },
    });
  }

  confirmDeleteTraveler(t: any) {
    // CA4: mensaje exacto con el nombre del viajero
    const confirmed = confirm(`¿Eliminar a ${t.firstName} de tus viajeros?`);
    if (!confirmed) return;
    this.api.delete(`clients/me/travelers/${t.id}`).subscribe({
      next: () => {
        this.travelers.update(list => list.filter(v => v.id !== t.id));
        this.toast.success('Viajero eliminado');
      },
      error: (err) => {
        this.toast.error(apiErrorMessage(err, 'No se pudo eliminar el viajero'));
      },
    });
  }
}
