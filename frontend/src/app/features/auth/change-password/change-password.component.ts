import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <div class="flex items-center gap-3">
        <a routerLink="/profile" class="text-blue-600 hover:underline text-sm">← Volver al perfil</a>
      </div>

      <h1 class="text-2xl font-bold text-gray-800">Cambiar contraseña</h1>

      <div class="bg-white rounded-xl border shadow-sm p-5 max-w-md">
        <form (ngSubmit)="onSubmit()" novalidate class="space-y-4">

          <!-- Contraseña actual -->
          <div>
            <label class="block text-xs text-gray-500 mb-1">Contraseña actual</label>
            <div class="relative">
              <input
                [type]="showCurrent() ? 'text' : 'password'"
                [ngModel]="currentPassword()"
                (ngModelChange)="currentPassword.set($event)"
                name="currentPassword"
                required
                class="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tu contraseña actual" />
              <button type="button"
                (click)="showCurrent.set(!showCurrent())"
                [attr.aria-label]="showCurrent() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 leading-none">
                @if (showCurrent()) {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <!-- Nueva contraseña -->
          <div>
            <label class="block text-xs text-gray-500 mb-1">Nueva contraseña</label>
            <div class="relative">
              <input
                [type]="showNew() ? 'text' : 'password'"
                [ngModel]="newPassword()"
                (ngModelChange)="newPassword.set($event)"
                name="newPassword"
                required
                class="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 8 caracteres" />
              <button type="button"
                (click)="showNew.set(!showNew())"
                [attr.aria-label]="showNew() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 leading-none">
                @if (showNew()) {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            <!-- Indicador de requisitos -->
            @if (newPassword()) {
              <div class="mt-2 grid grid-cols-2 gap-1">
                @for (req of requirements(); track req.label) {
                  <div class="flex items-center gap-1.5">
                    @if (req.met) {
                      <span class="text-green-500 text-xs">✓</span>
                    } @else {
                      <span class="text-gray-300 text-xs">○</span>
                    }
                    <span class="text-xs" [class.text-green-600]="req.met" [class.text-gray-400]="!req.met">{{ req.label }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Confirmar nueva contraseña -->
          <div>
            <label class="block text-xs text-gray-500 mb-1">Confirmar nueva contraseña</label>
            <div class="relative">
              <input
                [type]="showNew() ? 'text' : 'password'"
                [ngModel]="confirmPassword()"
                (ngModelChange)="confirmPassword.set($event)"
                name="confirmPassword"
                required
                class="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                [class.border-red-400]="confirmPassword() && confirmPassword() !== newPassword()"
                placeholder="Repite la nueva contraseña" />
              <button type="button"
                (click)="showNew.set(!showNew())"
                [attr.aria-label]="showNew() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 leading-none">
                @if (showNew()) {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            @if (confirmPassword() && confirmPassword() !== newPassword()) {
              <p class="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
            }
          </div>

          <button
            type="submit"
            [disabled]="loading() || !canSubmit()"
            class="mt-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 w-full">
            {{ loading() ? 'Guardando...' : 'Cambiar contraseña' }}
          </button>

        </form>
      </div>
    </div>
  `,
})
export class ChangePasswordComponent {
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');

  showCurrent = signal(false);
  showNew = signal(false);
  loading = signal(false);

  requirements = computed(() => {
    const p = this.newPassword();
    return [
      { label: 'Mínimo 8 caracteres', met: p.length >= 8 },
      { label: '1 letra mayúscula', met: /[A-Z]/.test(p) },
      { label: '1 número', met: /[0-9]/.test(p) },
      { label: 'Distinta a la actual', met: !!p && p !== this.currentPassword() },
    ];
  });

  canSubmit = computed(() => {
    const p = this.newPassword();
    return (
      !!this.currentPassword() &&
      !!p &&
      p.length >= 8 &&
      /[A-Z]/.test(p) &&
      /[0-9]/.test(p) &&
      p !== this.currentPassword() &&
      p === this.confirmPassword()
    );
  });

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
    private authService: AuthService,
  ) {}

  onSubmit() {
    if (!this.canSubmit()) {
      if (this.newPassword() === this.currentPassword()) {
        this.toast.error('La nueva contraseña debe ser distinta a la actual');
        return;
      }
      if (this.newPassword() !== this.confirmPassword()) {
        this.toast.error('Las contraseñas no coinciden');
        return;
      }
      if (this.newPassword().length < 8 || !/[A-Z]/.test(this.newPassword()) || !/[0-9]/.test(this.newPassword())) {
        this.toast.error('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número');
        return;
      }
      return;
    }

    this.loading.set(true);
    this.api.patch<{ message: string }>('auth/change-password', {
      currentPassword: this.currentPassword(),
      newPassword: this.newPassword(),
    }).subscribe({
      next: () => {
        // Limpia el flag mustChangePassword recargando el perfil del servidor.
        this.authService.refreshMe().subscribe({
          next: () => {
            this.loading.set(false);
            this.toast.success('Contraseña actualizada');
            this.router.navigate(['/profile']);
          },
          error: () => {
            this.loading.set(false);
            this.toast.success('Contraseña actualizada');
            this.router.navigate(['/profile']);
          },
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(apiErrorMessage(err, 'No se pudo actualizar la contraseña'));
      },
    });
  }
}
