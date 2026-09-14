import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-client-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style="background:#050d1a">
      <div class="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80&auto=format&fit=crop"
             alt="" class="w-full h-full object-cover opacity-20" />
        <div class="absolute inset-0" style="background:linear-gradient(180deg,rgba(5,13,26,.9),rgba(5,13,26,.8))"></div>
      </div>

      <div class="relative z-10 w-full max-w-2xl animate-enter">
        <!-- Encabezado -->
        <div class="text-center mb-8">
          <a routerLink="/" class="inline-flex items-center gap-2 mb-6">
            <div style="width:36px;height:36px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.3);border-radius:9px;display:flex;align-items:center;justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;color:#c9a84c" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>
            </div>
            <span style="font-weight:700;color:white"><span style="color:#c9a84c">Aero</span>CRM</span>
          </a>
          <div style="display:inline-flex;align-items:center;gap:.5rem;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.25);border-radius:999px;padding:.25rem .875rem;margin-bottom:1rem">
            <div style="width:6px;height:6px;border-radius:50%;background:#c9a84c"></div>
            <span style="font-size:.7rem;color:#c9a84c;font-weight:600;letter-spacing:.1em;text-transform:uppercase">Portal del Pasajero</span>
          </div>
          <h1 style="font-size:1.75rem;font-weight:700;color:white;letter-spacing:-.02em">Crear tu cuenta</h1>
          <p style="color:#5580d0;margin-top:.375rem;font-size:.875rem">Únete a AeroCRM y gestiona todos tus viajes en un solo lugar</p>
        </div>

        <div class="aero-card p-8">
          <div *ngIf="serverError()" class="mb-5 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
               style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);color:#f87171">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;flex-shrink:0;margin-top:2px" viewBox="0 0 256 256" fill="currentColor"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09Z"/></svg>
            {{ serverError() }}
          </div>

          <form #regForm="ngForm" (ngSubmit)="onSubmit(regForm)" novalidate>

            <!-- Información personal -->
            <div class="mb-6">
              <p style="font-size:.7rem;color:#c9a84c;text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem">
                <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 256 256" fill="currentColor"><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8Z"/></svg>
                Datos personales
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="aero-label">Nombres *</label>
                  <input type="text" name="firstName" [(ngModel)]="form.firstName" required minlength="2" maxlength="50"
                         class="aero-input" placeholder="Juan Carlos" #fn="ngModel"
                         [class.border-red-500]="fn.invalid && fn.touched" />
                  <p *ngIf="fn.invalid && fn.touched" class="form-error">Mínimo 2 caracteres</p>
                </div>
                <div class="form-group">
                  <label class="aero-label">Apellidos *</label>
                  <input type="text" name="lastName" [(ngModel)]="form.lastName" required minlength="2" maxlength="50"
                         class="aero-input" placeholder="García López" #ln="ngModel"
                         [class.border-red-500]="ln.invalid && ln.touched" />
                  <p *ngIf="ln.invalid && ln.touched" class="form-error">Mínimo 2 caracteres</p>
                </div>
                <div class="form-group">
                  <label class="aero-label">Correo electrónico *</label>
                  <input type="email" name="email" [(ngModel)]="form.email" required email
                         class="aero-input" placeholder="correo@ejemplo.com" #em="ngModel"
                         [class.border-red-500]="em.invalid && em.touched" />
                  <p *ngIf="em.invalid && em.touched" class="form-error">Ingresa un correo válido</p>
                </div>
                <div class="form-group">
                  <label class="aero-label">Teléfono</label>
                  <input type="tel" name="phone" [(ngModel)]="form.phone" maxlength="20"
                         class="aero-input" placeholder="+51 999 888 777" />
                </div>
                <div class="form-group">
                  <label class="aero-label">Fecha de nacimiento</label>
                  <input type="date" name="dateOfBirth" [(ngModel)]="form.dateOfBirth"
                         [max]="maxDob" [min]="minDob" class="aero-input" #dob="ngModel"
                         [class.border-red-500]="dob.invalid && dob.touched" />
                  <p *ngIf="dob.invalid && dob.touched" class="form-error">Debe ser una fecha pasada válida</p>
                </div>
                <div class="form-group">
                  <label class="aero-label">Nacionalidad</label>
                  <input type="text" name="nationality" [(ngModel)]="form.nationality" minlength="2" maxlength="3"
                         class="aero-input" placeholder="PE" style="text-transform:uppercase"
                         (input)="form.nationality = form.nationality.toUpperCase()" />
                  <p style="font-size:.7rem;color:#2452a0;margin-top:.25rem">Código ISO de 2-3 letras (PE, US, CO…)</p>
                </div>
              </div>
            </div>

            <!-- Documento de viaje (opcional) -->
            <div class="mb-6" style="border-top:1px solid rgba(22,45,88,.6);padding-top:1.5rem">
              <p style="font-size:.7rem;color:#c9a84c;text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin-bottom:.25rem;display:flex;align-items:center;gap:.5rem">
                <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34Z"/></svg>
                Documento de viaje
                <span style="font-size:.65rem;color:#2452a0;font-weight:400;text-transform:none;letter-spacing:0">(Opcional — puedes agregarlo después)</span>
              </p>
              <p style="font-size:.75rem;color:#2452a0;margin-bottom:1rem">
                Si tienes pasaporte, ingrésalo para agilizar futuros check-ins.
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="aero-label">Número de pasaporte</label>
                  <input type="text" name="passportNumber" [(ngModel)]="form.passportNumber"
                         pattern="[A-Z0-9]{6,9}" class="aero-input font-mono" placeholder="PE7845123"
                         style="text-transform:uppercase"
                         (input)="form.passportNumber = form.passportNumber.toUpperCase()"
                         #pp="ngModel" [class.border-red-500]="pp.invalid && pp.touched" />
                  <p *ngIf="pp.invalid && pp.touched" class="form-error">6-9 caracteres alfanuméricos en mayúsculas</p>
                </div>
                <div class="form-group">
                  <label class="aero-label">Fecha de vencimiento</label>
                  <input type="date" name="passportExpiry" [(ngModel)]="form.passportExpiry"
                         [min]="minPassportExpiry" class="aero-input" #pe="ngModel"
                         [class.border-red-500]="pe.invalid && pe.touched" />
                  <p *ngIf="pe.invalid && pe.touched" class="form-error">Debe vencer en al menos 1 mes</p>
                </div>
              </div>
            </div>

            <!-- Contraseña -->
            <div class="mb-8" style="border-top:1px solid rgba(22,45,88,.6);padding-top:1.5rem">
              <p style="font-size:.7rem;color:#c9a84c;text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem">
                <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 256 256" fill="currentColor"><path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80Z"/></svg>
                Seguridad
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                  <label class="aero-label">Contraseña *</label>
                  <input [type]="showPw ? 'text' : 'password'" name="password" [(ngModel)]="form.password"
                         required minlength="8" class="aero-input" placeholder="Mínimo 8 caracteres"
                         #pw="ngModel" [class.border-red-500]="pw.invalid && pw.touched" />
                  <p *ngIf="pw.invalid && pw.touched" class="form-error">Mínimo 8 caracteres</p>
                </div>
                <div class="form-group">
                  <label class="aero-label">Confirmar contraseña *</label>
                  <input [type]="showPw ? 'text' : 'password'" name="confirm" [(ngModel)]="confirmPassword"
                         required class="aero-input" placeholder="Repite tu contraseña"
                         [class.border-red-500]="confirmPassword && confirmPassword !== form.password" />
                  <p *ngIf="confirmPassword && confirmPassword !== form.password" class="form-error">Las contraseñas no coinciden</p>
                </div>
              </div>
              <label class="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" [(ngModel)]="showPw" name="showPw" class="w-3.5 h-3.5" style="accent-color:#c9a84c" />
                <span style="font-size:.8rem;color:#5580d0">Mostrar contraseñas</span>
              </label>

              <!-- Indicador de fortaleza -->
              <div *ngIf="form.password" class="mt-3">
                <div class="flex gap-1 mb-1">
                  <div *ngFor="let bar of [1,2,3,4]" class="h-1 flex-1 rounded-full transition-all"
                       [style.background]="passwordStrength >= bar ? strengthColor : 'rgba(22,45,88,.6)'"></div>
                </div>
                <p style="font-size:.7rem;" [style.color]="strengthColor">{{ strengthLabel }}</p>
              </div>
            </div>

            <button type="submit" class="btn-primary w-full justify-center py-3"
                    [disabled]="loading() || regForm.invalid || confirmPassword !== form.password">
              <svg *ngIf="loading()" class="animate-spin" style="width:16px;height:16px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <svg *ngIf="!loading()" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Z"/></svg>
              {{ loading() ? 'Creando cuenta…' : 'Crear Cuenta' }}
            </button>
          </form>

          <p class="text-center mt-5" style="font-size:.875rem;color:#5580d0">
            ¿Ya tienes una cuenta?
            <a routerLink="/client/login" style="color:#c9a84c;font-weight:600;margin-left:4px;text-decoration:underline;text-underline-offset:3px">Inicia sesión</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ClientRegisterComponent {
  form: any = {
    firstName: '', lastName: '', email: '', phone: '',
    nationality: 'PE', dateOfBirth: '',
    passportNumber: '', passportExpiry: '', password: '',
  };
  confirmPassword = '';
  showPw = false;
  loading = signal(false);
  serverError = signal('');

  maxDob = new Date(Date.now() - 365 * 24 * 3600000).toISOString().split('T')[0];
  minDob = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 120); return d.toISOString().split('T')[0]; })();
  minPassportExpiry = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; })();

  get passwordStrength(): number {
    const p = this.form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }
  get strengthLabel() { return ['', 'Débil', 'Regular', 'Buena', 'Fuerte'][this.passwordStrength] || ''; }
  get strengthColor() { return ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][this.passwordStrength] || '#ef4444'; }

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(form: NgForm) {
    if (form.invalid || this.form.password !== this.confirmPassword) {
      Object.values(form.controls).forEach(c => c.markAsTouched());
      return;
    }
    this.loading.set(true);
    this.serverError.set('');

    // Only send passport data if both fields are filled
    const payload: any = {
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      email: this.form.email,
      password: this.form.password,
    };
    if (this.form.phone) payload.phone = this.form.phone;
    if (this.form.nationality) payload.nationality = this.form.nationality;
    if (this.form.dateOfBirth) payload.dateOfBirth = this.form.dateOfBirth;
    if (this.form.passportNumber) payload.passportNumber = this.form.passportNumber;
    if (this.form.passportExpiry) payload.passportExpiry = this.form.passportExpiry;

    this.auth.registerClient(payload).subscribe({
      next: () => this.router.navigate(['/client']),
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message;
        this.serverError.set(Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al crear la cuenta. Por favor inténtalo de nuevo.'));
      },
    });
  }
}
