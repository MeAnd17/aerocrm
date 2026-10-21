import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/services/api-error';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <h1 class="text-2xl font-bold text-gray-800">Mi perfil</h1>

      @if (profile()) {
        <!-- Datos personales -->
        <div class="bg-white rounded-xl border shadow-sm p-5">
          <h2 class="font-semibold text-gray-800 mb-4">Datos personales</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Nombre</label>
              <input type="text" [(ngModel)]="editForm.firstName"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Apellido</label>
              <input type="text" [(ngModel)]="editForm.lastName"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Teléfono</label>
              <input type="text" [(ngModel)]="editForm.phone"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Nacionalidad</label>
              <input type="text" [(ngModel)]="editForm.nationality"
                class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button (click)="saveProfile()" [disabled]="saving()"
            class="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
            {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>

        <!-- Preferencias -->
        <div class="bg-white rounded-xl border shadow-sm p-5">
          <h2 class="font-semibold text-gray-800 mb-4">Preferencias de viaje</h2>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-500 mb-2">¿Cómo viajas?</label>
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
              <label class="block text-xs text-gray-500 mb-2">¿Qué destino prefieres?</label>
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
        <div class="bg-white rounded-xl border shadow-sm p-5">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-gray-800">Viajeros frecuentes</h2>
            <button (click)="showAddTraveler.set(!showAddTraveler())" class="text-sm text-blue-600 hover:underline">+ Agregar</button>
          </div>
          @if (travelers().length === 0) {
            <p class="text-sm text-gray-400">No tienes viajeros guardados aún.</p>
          }
          @for (t of travelers(); track t.id) {
            <div class="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p class="text-sm font-medium">{{ t.firstName }} {{ t.lastName }}</p>
                <p class="text-xs text-gray-500">{{ t.relation }} · Doc: {{ t.documentNumber }}</p>
              </div>
              <button (click)="deleteTraveler(t.id)" class="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
            </div>
          }
          @if (showAddTraveler()) {
            <div class="mt-3 space-y-2 border-t pt-3">
              <div class="grid grid-cols-2 gap-2">
                <input type="text" [(ngModel)]="newTraveler.firstName" placeholder="Nombre"
                  class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="text" [(ngModel)]="newTraveler.lastName" placeholder="Apellido"
                  class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="text" [(ngModel)]="newTraveler.documentNumber" placeholder="Documento"
                  class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="date" [(ngModel)]="newTraveler.dateOfBirth"
                  class="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="text" [(ngModel)]="newTraveler.relation" placeholder="Relación (pareja, hijo...)"
                  class="border rounded px-3 py-2 text-sm col-span-2 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>
              <button (click)="addTraveler()"
                class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                Guardar viajero
              </button>
            </div>
          }
        </div>

        <!-- Cerrar sesión -->
        <button (click)="auth.logout()"
          class="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
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
  showAddTraveler = signal(false);
  editForm: any = {};
  newTraveler: any = {};

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
      this.editForm = { firstName: p.firstName, lastName: p.lastName, phone: p.phone, nationality: p.nationality, travelStyle: p.travelStyle, destinationType: p.destinationType };
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

  deleteTraveler(id: number) {
    const traveler = this.travelers().find(t => t.id === id);
    if (!traveler) return;
    const confirmed = confirm(`¿Eliminar a ${traveler.firstName} ${traveler.lastName} de tus viajeros?`);
    if (!confirmed) return;
    this.api.delete(`clients/me/travelers/${id}`).subscribe({
      next: () => this.travelers.update(list => list.filter(t => t.id !== id)),
      error: () => this.toast.error('No se pudo eliminar el viajero'),
    });
  }
}
