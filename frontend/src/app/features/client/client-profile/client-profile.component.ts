import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto">
      <div class="mb-6">
        <h1 class="page-title">Mi Perfil</h1>
        <p class="page-subtitle">Tu información personal y preferencias de viaje</p>
      </div>

      <div *ngIf="loading()" class="space-y-4">
        <div *ngFor="let _ of [1,2]" class="skeleton" style="height:160px;border-radius:.75rem"></div>
      </div>

      <div *ngIf="!loading()">
        <!-- Profile header -->
        <div class="aero-card p-6 mb-5">
          <div class="flex items-center gap-5">
            <div style="width:64px;height:64px;border-radius:1rem;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;flex-shrink:0"
                 [style.background]="tierBg" [style.border]="'2px solid ' + tierColor" [style.color]="tierColor">
              {{ initials }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-3 flex-wrap mb-1">
                <h2 style="font-size:1.25rem;font-weight:700;color:white">{{ user?.firstName }} {{ user?.lastName }}</h2>
                <span *ngIf="profile()?.passenger?.tier" class="badge" style="font-size:.7rem"
                      [style.background]="tierBg" [style.color]="tierColor">
                  {{ profile()?.passenger?.tier }}
                </span>
              </div>
              <p style="font-size:.875rem;color:#5580d0">{{ user?.email }}</p>
              <p *ngIf="profile()?.passenger?.frequentFlyerNumber" style="font-family:'JetBrains Mono',monospace;font-size:.8rem;color:#c9a84c;margin-top:.25rem">
                {{ profile()?.passenger?.frequentFlyerNumber }}
              </p>
            </div>
          </div>
        </div>

        <!-- Passenger info -->
        <div *ngIf="profile()?.passenger" class="aero-card p-6 mb-5">
          <h2 class="section-title">Información de Viaje</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:.25rem">Pasaporte</p>
              <p style="font-family:'JetBrains Mono',monospace;font-size:.9rem;color:white">{{ profile()?.passenger?.passportNumber }}</p>
            </div>
            <div>
              <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:.25rem">Vencimiento</p>
              <p style="font-size:.875rem;color:white">{{ profile()?.passenger?.passportVencimiento | date:'MMM d, y' }}</p>
            </div>
            <div>
              <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:.25rem">Nacionalidad</p>
              <p style="font-size:.875rem;color:white">{{ profile()?.passenger?.nationality }}</p>
            </div>
            <div>
              <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:.25rem">Fecha de Nacimiento</p>
              <p style="font-size:.875rem;color:white">{{ profile()?.passenger?.dateOfBirth | date:'MMMM d, y' }}</p>
            </div>
            <div>
              <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:.25rem">Preferencia de Comida</p>
              <p style="font-size:.875rem;color:white" style2="text-transform:capitalize">{{ profile()?.passenger?.preferenceMeal || 'Estándar' }}</p>
            </div>
            <div>
              <p style="font-size:.65rem;color:#2452a0;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:.25rem">Teléfono</p>
              <p style="font-size:.875rem;color:white">{{ profile()?.passenger?.phone || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Change password section -->
        <div class="aero-card p-6">
          <h2 class="section-title">Cambiar Contraseña</h2>
          <div *ngIf="pwSuccess()" class="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
               style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);color:#34d399">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Z"/></svg>
            Contraseña actualizada exitosamente
          </div>
          <div *ngIf="pwError()" class="mb-4 text-sm" style="color:#f87171">{{ pwError() }}</div>

          <div class="grid grid-cols-1 gap-4">
            <div class="form-group">
              <label class="aero-label">Contraseña Actual</label>
              <input type="password" [(ngModel)]="pw.current" class="aero-input" placeholder="••••••••" />
            </div>
            <div class="form-group">
              <label class="aero-label">Nueva Contraseña</label>
              <input type="password" [(ngModel)]="pw.newPw" class="aero-input" placeholder="Min 8 characters" />
            </div>
            <div class="form-group">
              <label class="aero-label">Confirm Nueva Contraseña</label>
              <input type="password" [(ngModel)]="pw.confirm" class="aero-input" placeholder="Repite la nueva contraseña"
                     [class.border-red-500]="pw.confirm && pw.confirm !== pw.newPw" />
              <p *ngIf="pw.confirm && pw.confirm !== pw.newPw" class="form-error">Las contraseñas no coinciden</p>
            </div>
          </div>
          <div class="flex justify-end mt-4">
            <button (click)="changePassword()" class="btn-primary"
                    [disabled]="pwLoading() || !pw.current || !pw.newPw || pw.newPw !== pw.confirm || pw.newPw.length < 8">
              <svg *ngIf="pwLoading()" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              Actualizar Contraseña
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ClientProfileComponent implements OnInit {
  profile = signal<any>(null);
  loading = signal(true);
  pw = { current: '', newPw: '', confirm: '' };
  pwLoading = signal(false);
  pwError = signal('');
  pwSuccess = signal(false);

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService) {}

  get user() { return this.auth.currentUser(); }
  get initials() { const u = this.user; return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '?'; }

  get tierBg() {
    const map: Record<string, string> = { PLATINUM: 'rgba(139,92,246,0.15)', GOLD: 'rgba(201,168,76,0.15)', SILVER: 'rgba(148,163,184,0.12)', STANDARD: 'rgba(71,85,105,0.12)' };
    return map[this.profile()?.passenger?.tier] || map['STANDARD'];
  }
  get tierColor() {
    const map: Record<string, string> = { PLATINUM: '#a78bfa', GOLD: '#c9a84c', SILVER: '#94a3b8', STANDARD: '#64748b' };
    return map[this.profile()?.passenger?.tier] || map['STANDARD'];
  }

  ngOnInit() {
    this.api.get<any>('auth/client/profile').subscribe({
      next: p => { this.profile.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  changePassword() {
    if (this.pw.newPw !== this.pw.confirm || this.pw.newPw.length < 8) return;
    this.pwLoading.set(true);
    this.pwError.set('');
    this.pwSuccess.set(false);
    this.auth.changePassword(this.pw.current, this.pw.newPw).subscribe({
      next: () => {
        this.pwSuccess.set(true);
        this.pw = { current: '', newPw: '', confirm: '' };
        this.pwLoading.set(false);
        setTimeout(() => this.pwSuccess.set(false), 4000);
      },
      error: err => {
        this.pwLoading.set(false);
        const msg = err?.error?.message;
        this.pwError.set(Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al actualizar la contraseña'));
      },
    });
  }
}
