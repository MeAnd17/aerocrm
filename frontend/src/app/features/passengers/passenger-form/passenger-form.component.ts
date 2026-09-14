import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-passenger-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/passengers" class="btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
            <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/>
          </svg>
        </a>
        <div>
          <h1 class="page-title">{{ isEdit ? 'Editar Pasajero' : 'Nuevo Pasajero' }}</h1>
          <p class="page-subtitle">{{ isEdit ? 'Actualizar información del pasajero' : 'Registrar un nuevo pasajero en el sistema' }}</p>
        </div>
      </div>

      <form #pForm="ngForm" (ngSubmit)="onSubmit(pForm)" novalidate>
        <!-- Información Personal -->
        <div class="aero-card p-6 mb-5">
          <h2 class="section-title">Información Personal</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="aero-label">Nombres *</label>
              <input type="text" name="firstName" [(ngModel)]="form.firstName" required minlength="2" maxlength="50"
                     class="aero-input" placeholder="James" #firstName="ngModel"
                     [class.border-red-500]="firstName.invalid && firstName.touched" />
              <p *ngIf="firstName.invalid && firstName.touched" class="form-error">First name must be 2–50 characters</p>
            </div>
            <div class="form-group">
              <label class="aero-label">Apellidos *</label>
              <input type="text" name="lastName" [(ngModel)]="form.lastName" required minlength="2" maxlength="50"
                     class="aero-input" placeholder="Harrison" #lastName="ngModel"
                     [class.border-red-500]="lastName.invalid && lastName.touched" />
              <p *ngIf="lastName.invalid && lastName.touched" class="form-error">Last name must be 2–50 characters</p>
            </div>
            <div class="form-group">
              <label class="aero-label">Correo electrónico *</label>
              <input type="email" name="email" [(ngModel)]="form.email" required email
                     class="aero-input" placeholder="passenger@email.com" #emailF="ngModel"
                     [class.border-red-500]="emailF.invalid && emailF.touched" />
              <p *ngIf="emailF.invalid && emailF.touched" class="form-error">Ingresa un correo electrónico válido</p>
            </div>
            <div class="form-group">
              <label class="aero-label">Teléfono</label>
              <input type="tel" name="phone" [(ngModel)]="form.phone" maxlength="20"
                     class="aero-input" placeholder="+1-212-555-0101" />
            </div>
            <div class="form-group">
              <label class="aero-label">Fecha de nacimiento *</label>
              <input type="date" name="dateOfBirth" [(ngModel)]="form.dateOfBirth" required
                     [max]="maxDob" [min]="minDob"
                     class="aero-input" #dob="ngModel"
                     [class.border-red-500]="dob.invalid && dob.touched" />
              <p *ngIf="dob.invalid && dob.touched" class="form-error">Debe ser una fecha pasada válida (máx. 120 años)</p>
            </div>
            <div class="form-group">
              <label class="aero-label">Nacionalidad (código ISO) *</label>
              <input type="text" name="nationality" [(ngModel)]="form.nationality" required minlength="2" maxlength="3"
                     class="aero-input uppercase" placeholder="US" style="text-transform:uppercase"
                     (input)="form.nationality = form.nationality.toUpperCase()"
                     #nat="ngModel"
                     [class.border-red-500]="nat.invalid && nat.touched" />
              <p *ngIf="nat.invalid && nat.touched" class="form-error">Código ISO de 2-3 letras (p.ej. PE, US, ES)</p>
            </div>
          </div>
        </div>

        <!-- Documentos de Viaje -->
        <div class="aero-card p-6 mb-5">
          <h2 class="section-title">Documentos de Viaje</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="aero-label">Número de Pasaporte *</label>
              <input type="text" name="passportNumber" [(ngModel)]="form.passportNumber" required
                     pattern="[A-Z0-9]{6,9}"
                     class="aero-input uppercase font-mono" placeholder="US7845123"
                     (input)="form.passportNumber = form.passportNumber.toUpperCase()"
                     #passport="ngModel"
                     [class.border-red-500]="passport.invalid && passport.touched" />
              <p *ngIf="passport.invalid && passport.touched" class="form-error">6-9 caracteres alfanuméricos en mayúsculas (p.ej. PE7845123)</p>
            </div>
            <div class="form-group">
              <label class="aero-label">Fecha de vencimiento *</label>
              <input type="date" name="passportExpiry" [(ngModel)]="form.passportExpiry" required
                     [min]="minPassportExpiry"
                     class="aero-input" #passExpiry="ngModel"
                     [class.border-red-500]="passExpiry.invalid && passExpiry.touched" />
              <p *ngIf="passExpiry.invalid && passExpiry.touched" class="form-error">Debe vencer en al menos 6 meses</p>
              <p *ngIf="passExpiry.valid && form.passportExpiry && isExpiryNear()" class="text-amber-400 text-xs mt-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 256 256" fill="currentColor"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/></svg>
                El pasaporte vence en menos de 1 año
              </p>
            </div>
            <div class="form-group col-span-2">
              <label class="aero-label">Frequent Flyer Number</label>
              <input type="text" name="frequentFlyerNumber" [(ngModel)]="form.frequentFlyerNumber" maxlength="20"
                     class="aero-input font-mono" placeholder="AE-GOLD-001" />
            </div>
          </div>
        </div>

        <!-- Loyalty & Preferences -->
        <div class="aero-card p-6 mb-6">
          <h2 class="section-title">Lealtad y Preferencias de Viaje</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="aero-label">Nivel de Lealtad</label>
              <select name="tier" [(ngModel)]="form.tier" class="aero-input">
                <option value="STANDARD">Standard</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
              </select>
            </div>
            <div class="form-group">
              <label class="aero-label">Preferencia de Comida</label>
              <select name="preferenceMeal" [(ngModel)]="form.preferenceMeal" class="aero-input">
                <option value="estándar">Standard</option>
                <option value="vegetariano">Vegetarian</option>
                <option value="vegano">Vegan</option>
                <option value="halal">Halal</option>
                <option value="kosher">Kosher</option>
              </select>
            </div>
          </div>
          <div class="flex flex-wrap gap-6 mt-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="preferenceWindow" [(ngModel)]="form.preferenceWindow" class="w-4 h-4 accent-gold-500" />
              <span class="text-sm text-navy-300">Prefiere asiento ventana</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="preferenceAisle" [(ngModel)]="form.preferenceAisle" class="w-4 h-4 accent-gold-500" />
              <span class="text-sm text-navy-300">Prefiere asiento pasillo</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="preferenceSpecialAssistance" [(ngModel)]="form.preferenceSpecialAssistance" class="w-4 h-4 accent-gold-500" />
              <span class="text-sm text-navy-300">Requiere asistencia especial</span>
            </label>
          </div>
          <div class="form-group mt-4">
            <label class="aero-label">Notas Internas</label>
            <textarea name="notes" [(ngModel)]="form.notes" maxlength="500" rows="3"
                      class="aero-input resize-none" placeholder="Notas opcionales visibles solo para operadores…"></textarea>
            <p class="text-xs text-navy-500 text-right mt-1">{{ (form.notes || '').length }}/500</p>
          </div>
        </div>

        <!-- Error alert -->
        <div *ngIf="serverError()" class="mb-4 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" viewBox="0 0 256 256" fill="currentColor"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/></svg>
          {{ serverError() }}
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <a routerLink="/passengers" class="btn-ghost">Cancelar</a>
          <button type="submit" class="btn-primary" [disabled]="loading() || pForm.invalid">
            <svg *ngIf="loading()" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            {{ loading() ? 'Guardando…' : (isEdit ? 'Guardar Cambios' : 'Crear Pasajero') }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class PassengerFormComponent implements OnInit {
  form: any = {
    firstName: '', lastName: '', email: '', phone: '', nationality: '',
    dateOfBirth: '', passportNumber: '', passportExpiry: '',
    tier: 'STANDARD', preferenceMeal: 'estándar',
    preferenceWindow: false, preferenceAisle: false, preferenceSpecialAssistance: false, notes: '',
  };

  isEdit = false;
  loading = signal(false);
  serverError = signal('');

  // Validation bounds
  maxDob = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().split('T')[0]; // at least 1 year old
  minDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 120); return d.toISOString().split('T')[0]; })();
  minPassportExpiry = (() => { const d = new Date(); d.setMonth(d.getMonth() + 6); return d.toISOString().split('T')[0]; })();

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.api.get<any>(`passengers/${id}`).subscribe(p => {
        this.form = {
          ...p,
          dateOfBirth: p.dateOfBirth?.split('T')[0],
          passportExpiry: p.passportExpiry?.split('T')[0],
        };
      });
    }
  }

  isExpiryNear(): boolean {
    if (!this.form.passportExpiry) return false;
    const expiry = new Date(this.form.passportExpiry);
    const oneYear = new Date(); oneYear.setFullYear(oneYear.getFullYear() + 1);
    return expiry <= oneYear;
  }

  onSubmit(form: NgForm) {
    if (form.invalid) { Object.values(form.controls).forEach(c => c.markAsTouched()); return; }
    this.loading.set(true);
    this.serverError.set('');

    const id = this.route.snapshot.paramMap.get('id');
    const req = this.isEdit
      ? this.api.put(`passengers/${id}`, this.form)
      : this.api.post('passengers', this.form);

    req.subscribe({
      next: () => {
        this.toast.success(this.isEdit ? 'Pasajero actualizado exitosamente' : 'Pasajero creado exitosamente');
        this.router.navigate(['/passengers']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message;
        this.serverError.set(Array.isArray(msg) ? msg.join(', ') : (msg || 'Ocurrió un error. Por favor inténtalo de nuevo.'));
      },
    });
  }
}
