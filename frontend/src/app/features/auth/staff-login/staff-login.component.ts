import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-staff-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex relative overflow-hidden" style="background:#050d1a">
      <!-- Panel izquierdo — imagen aeropuerto -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80&auto=format&fit=crop"
             alt="Aeropuerto" class="w-full h-full object-cover" />
        <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(5,13,26,.7),rgba(10,22,40,.4))"></div>
        <div class="absolute inset-0 flex flex-col justify-between p-12">
          <a routerLink="/" class="flex items-center gap-3">
            <div style="width:40px;height:40px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.4);border-radius:10px;display:flex;align-items:center;justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" style="width:22px;height:22px;color:#c9a84c" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>
            </div>
            <span style="font-size:1.1rem;font-weight:700;color:white"><span style="color:#c9a84c">Aero</span>CRM</span>
          </a>
          <div>
            <div style="width:40px;height:2px;background:#c9a84c;margin-bottom:1.5rem"></div>
            <h2 style="font-size:2rem;font-weight:700;color:white;line-height:1.2">Centro de<br/>Operaciones</h2>
            <p style="color:#8aaae0;margin-top:.75rem;font-size:.9rem;line-height:1.6">
              Gestiona vuelos, pasajeros y soporte desde una plataforma inteligente y unificada.
            </p>
          </div>
        </div>
      </div>

      <!-- Panel derecho — formulario -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div class="w-full max-w-md animate-enter">
          <div class="lg:hidden mb-8 flex items-center gap-3">
            <a routerLink="/" class="flex items-center gap-3">
              <div style="width:36px;height:36px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.3);border-radius:9px;display:flex;align-items:center;justify-content:center">
                <svg xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;color:#c9a84c" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>
              </div>
              <span style="font-weight:700;color:white"><span style="color:#c9a84c">Aero</span>CRM</span>
            </a>
          </div>

          <div class="mb-8">
            <div style="display:inline-flex;align-items:center;gap:.5rem;background:rgba(36,82,160,.15);border:1px solid rgba(36,82,160,.3);border-radius:999px;padding:.25rem .875rem;margin-bottom:1.25rem">
              <div style="width:6px;height:6px;border-radius:50%;background:#3366c2"></div>
              <span style="font-size:.7rem;color:#3366c2;font-weight:600;letter-spacing:.1em;text-transform:uppercase">Acceso al Personal</span>
            </div>
            <h1 style="font-size:1.875rem;font-weight:700;color:white;letter-spacing:-.02em">Bienvenido</h1>
            <p style="color:#5580d0;margin-top:.375rem;font-size:.9rem">Ingresa al panel de operaciones</p>
          </div>

          <div *ngIf="errorMsg()" class="mb-5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
               style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);color:#f87171">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;flex-shrink:0" viewBox="0 0 256 256" fill="currentColor"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09Z"/></svg>
            {{ errorMsg() }}
          </div>

          <form (ngSubmit)="onSubmit()" novalidate class="space-y-4">
            <div class="form-group">
              <label class="aero-label">Correo electrónico</label>
              <div style="position:relative">
                <svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#2452a0" viewBox="0 0 256 256" fill="currentColor"><path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z"/></svg>
                <input type="email" name="email" [(ngModel)]="email" required
                       placeholder="operador@aerocrm.com" class="aero-input" style="padding-left:2.5rem" />
              </div>
            </div>
            <div class="form-group">
              <label class="aero-label">Contraseña</label>
              <div style="position:relative">
                <svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:#2452a0" viewBox="0 0 256 256" fill="currentColor"><path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96Z"/></svg>
                <input [type]="showPw ? 'text' : 'password'" name="password" [(ngModel)]="password" required
                       placeholder="••••••••" class="aero-input" style="padding-left:2.5rem;padding-right:2.5rem" />
                <button type="button" (click)="showPw = !showPw"
                        style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#2452a0;padding:0">
                  <svg *ngIf="!showPw" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px" viewBox="0 0 256 256" fill="currentColor"><path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76Z"/></svg>
                  <svg *ngIf="showPw" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px" viewBox="0 0 256 256" fill="currentColor"><path d="M53.92,34.62A8,8,0,1,0,42.08,45.38L61.32,66.55C28,89.54,9.4,122.12,8.69,123.51a8,8,0,0,0,0,7c.35.79,8.82,19.57,27.65,38.4C61.43,193.74,93.12,207,128,207a117.22,117.22,0,0,0,52.06-11.87l22,24.25a8,8,0,1,0,11.84-10.76Z"/></svg>
                </button>
              </div>
            </div>

            <button type="submit" class="btn-primary w-full justify-center py-3 mt-2"
                    [disabled]="loading() || !email || !password">
              <svg *ngIf="loading()" class="animate-spin" style="width:16px;height:16px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              {{ loading() ? 'Ingresando…' : 'Ingresar' }}
            </button>
          </form>

          <p class="text-center mt-6" style="font-size:.8rem;color:#2452a0">
            ¿No eres personal?
            <a routerLink="/" style="color:#c9a84c;text-decoration:underline;text-underline-offset:3px;margin-left:4px">Volver al inicio</a>
          </p>

          <!-- Credenciales de demo -->
          <div class="mt-6 pt-5" style="border-top:1px solid rgba(22,45,88,.6)">
            <p style="font-size:.7rem;color:#2452a0;text-transform:uppercase;letter-spacing:.1em;font-weight:600;margin-bottom:.75rem">Credenciales de demostración</p>
            <div class="grid grid-cols-1 gap-2">
              <button *ngFor="let c of demoCreds" (click)="fill(c)"
                      class="text-left px-3 py-2 rounded-lg transition-colors"
                      style="background:rgba(15,32,64,.6);border:1px solid rgba(22,45,88,.6)">
                <div class="flex justify-between items-center">
                  <span style="font-size:.75rem;font-weight:600;color:#c9a84c">{{ c.role }}</span>
                  <span style="font-size:.7rem;color:#2452a0">clic para rellenar</span>
                </div>
                <span style="font-size:.75rem;color:#5580d0">{{ c.email }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class StaffLoginComponent {
  email = ''; password = ''; showPw = false;
  loading = signal(false); errorMsg = signal('');
  demoCreds = [
    { role: 'Administrador', email: 'admin@aerocrm.com', password: 'Admin1234!' },
    { role: 'Agente de Vuelo', email: 'agent1@aerocrm.com', password: 'Agent1234!' },
    { role: 'Operador de Soporte', email: 'support1@aerocrm.com', password: 'Support1234!' },
  ];
  constructor(private auth: AuthService, private router: Router) {}
  fill(c: any) { this.email = c.email; this.password = c.password; this.errorMsg.set(''); }
  onSubmit() {
    if (!this.email || !this.password) return;
    this.loading.set(true); this.errorMsg.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => { res.mustChangePassword ? this.router.navigate(['/staff/change-password']) : this.router.navigate(['/dashboard']); },
      error: (err) => { this.loading.set(false); this.errorMsg.set(err?.error?.message || 'Correo o contraseña incorrectos'); },
    });
  }
}
