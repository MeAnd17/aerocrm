import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style="background:#050d1a">
      <div class="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80&auto=format&fit=crop"
             alt="" class="w-full h-full object-cover opacity-15" />
        <div class="absolute inset-0" style="background:radial-gradient(ellipse at center,rgba(22,45,88,.4) 0%,rgba(5,13,26,.95) 70%)"></div>
      </div>

      <div class="relative z-10 w-full max-w-md animate-enter">
        <!-- Icono + encabezado -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
               style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.3)">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:32px;height:32px;color:#c9a84c" viewBox="0 0 256 256" fill="currentColor">
              <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96Zm112,152H48V96H208V208Zm-80-48a12,12,0,1,1,12,12A12,12,0,0,1,128,160Z"/>
            </svg>
          </div>
          <div style="display:inline-flex;align-items:center;gap:.5rem;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.25);border-radius:999px;padding:.25rem .875rem;margin-bottom:1rem">
            <div class="animate-pulse" style="width:6px;height:6px;border-radius:50%;background:#c9a84c"></div>
            <span style="font-size:.7rem;color:#c9a84c;font-weight:600;letter-spacing:.1em;text-transform:uppercase">Acción Requerida</span>
          </div>
          <h1 style="font-size:1.75rem;font-weight:700;color:white;letter-spacing:-.02em">Crea tu contraseña</h1>
          <p style="color:#5580d0;margin-top:.5rem;font-size:.875rem;line-height:1.5;max-width:340px;margin-left:auto;margin-right:auto">
            Bienvenido/a, <strong style="color:#c9a84c">{{ user?.firstName }}</strong>. Tu cuenta fue creada con una contraseña temporal (tu DNI). Por favor crea una nueva contraseña para continuar.
          </p>
        </div>

        <!-- Tarjeta -->
        <div class="aero-card p-7">
          <!-- Aviso informativo -->
          <div class="flex items-start gap-3 p-4 rounded-xl mb-6"
               style="background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.2)">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;color:#c9a84c;flex-shrink:0;margin-top:1px" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"/></svg>
            <p style="font-size:.8rem;color:#e0cc94;line-height:1.5">
              Ingresa tu <strong>DNI</strong> como contraseña actual y elige una nueva contraseña segura. No podrás acceder al sistema hasta completar este paso.
            </p>
          </div>

          <div *ngIf="errorMsg()" class="mb-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
               style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);color:#f87171">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;flex-shrink:0" viewBox="0 0 256 256" fill="currentColor"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09Z"/></svg>
            {{ errorMsg() }}
          </div>

          <form (ngSubmit)="onSubmit()" novalidate class="space-y-4">
            <div class="form-group">
              <label class="aero-label">Contraseña actual (tu DNI)</label>
              <input [type]="showCurrent ? 'text' : 'password'" [(ngModel)]="currentPassword" name="current" required
                     class="aero-input font-mono" placeholder="Ej: 12345678" />
              <label class="flex items-center gap-2 mt-1.5 cursor-pointer">
                <input type="checkbox" [(ngModel)]="showCurrent" name="sc" class="w-3 h-3" style="accent-color:#c9a84c" />
                <span style="font-size:.75rem;color:#5580d0">Mostrar</span>
              </label>
            </div>

            <div class="form-group">
              <label class="aero-label">Nueva contraseña</label>
              <input [type]="showNew ? 'text' : 'password'" [(ngModel)]="newPassword" name="newpw"
                     required minlength="8" class="aero-input" placeholder="Mínimo 8 caracteres" />
              <!-- Indicador de fortaleza -->
              <div *ngIf="newPassword" class="mt-2">
                <div class="flex gap-1 mb-1">
                  <div *ngFor="let bar of [1,2,3,4]" class="h-1 flex-1 rounded-full transition-all"
                       [style.background]="strength >= bar ? strengthColor : 'rgba(22,45,88,.6)'"></div>
                </div>
                <p style="font-size:.7rem;" [style.color]="strengthColor">{{ strengthLabel }}</p>
              </div>
            </div>

            <div class="form-group">
              <label class="aero-label">Confirmar nueva contraseña</label>
              <input [type]="showNew ? 'text' : 'password'" [(ngModel)]="confirmPassword" name="confirm"
                     required class="aero-input" placeholder="Repite la nueva contraseña"
                     [class.border-red-500]="confirmPassword && confirmPassword !== newPassword" />
              <p *ngIf="confirmPassword && confirmPassword !== newPassword" class="form-error">Las contraseñas no coinciden</p>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="showNew" name="sn" class="w-3 h-3" style="accent-color:#c9a84c" />
              <span style="font-size:.75rem;color:#5580d0">Mostrar nueva contraseña</span>
            </label>

            <!-- Requisitos -->
            <div class="grid grid-cols-2 gap-2 pt-1">
              <div *ngFor="let req of requirements" class="flex items-center gap-2">
                <svg *ngIf="req.met" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;color:#10b981;flex-shrink:0" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Z"/></svg>
                <svg *ngIf="!req.met" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;color:#2452a0;flex-shrink:0" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"/></svg>
                <span style="font-size:.75rem;" [style.color]="req.met ? '#10b981' : '#5580d0'">{{ req.label }}</span>
              </div>
            </div>

            <button type="submit" class="btn-primary w-full justify-center py-3 mt-2"
                    [disabled]="loading() || !currentPassword || !newPassword || newPassword !== confirmPassword || strength < 2">
              <svg *ngIf="loading()" class="animate-spin" style="width:16px;height:16px" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <svg *ngIf="!loading()" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px" viewBox="0 0 256 256" fill="currentColor"><path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80Z"/></svg>
              {{ loading() ? 'Guardando…' : 'Establecer contraseña y continuar' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class ChangePasswordComponent {
  currentPassword = ''; newPassword = ''; confirmPassword = '';
  showCurrent = false; showNew = false;
  loading = signal(false); errorMsg = signal('');
  constructor(private auth: AuthService, private router: Router) {}
  get user() { return this.auth.currentUser(); }
  get strength(): number {
    const p = this.newPassword; if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }
  get strengthLabel() { return ['', 'Débil', 'Regular', 'Buena', 'Fuerte'][this.strength] || ''; }
  get strengthColor() { return ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][this.strength] || '#ef4444'; }
  get requirements() {
    const p = this.newPassword;
    return [
      { label: 'Mínimo 8 caracteres', met: p.length >= 8 },
      { label: '1 letra mayúscula', met: /[A-Z]/.test(p) },
      { label: '1 número', met: /[0-9]/.test(p) },
      { label: 'Contraseñas coinciden', met: !!p && p === this.confirmPassword },
    ];
  }
  onSubmit() {
    if (!this.currentPassword || !this.newPassword || this.newPassword !== this.confirmPassword) return;
    this.loading.set(true); this.errorMsg.set('');
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => { this.loading.set(false); const msg = err?.error?.message; this.errorMsg.set(Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al actualizar la contraseña')); },
    });
  }
}
