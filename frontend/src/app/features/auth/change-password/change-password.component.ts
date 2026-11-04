import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
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
            <input
              [type]="showCurrent() ? 'text' : 'password'"
              [(ngModel)]="currentPassword"
              name="currentPassword"
              required
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tu contraseña actual" />
            <label class="flex items-center gap-2 mt-1.5 cursor-pointer">
              <input type="checkbox" [checked]="showCurrent()" (change)="showCurrent.set(!showCurrent())" class="w-3 h-3" />
              <span class="text-xs text-gray-400">Mostrar</span>
            </label>
          </div>

          <!-- Nueva contraseña -->
          <div>
            <label class="block text-xs text-gray-500 mb-1">Nueva contraseña</label>
            <input
              [type]="showNew() ? 'text' : 'password'"
              [(ngModel)]="newPassword"
              name="newPassword"
              required
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 8 caracteres" />
            <!-- Indicador de requisitos -->
            @if (newPassword) {
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
            <input
              [type]="showNew() ? 'text' : 'password'"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              required
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-400]="confirmPassword && confirmPassword !== newPassword"
              placeholder="Repite la nueva contraseña" />
            @if (confirmPassword && confirmPassword !== newPassword) {
              <p class="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
            }
            <label class="flex items-center gap-2 mt-1.5 cursor-pointer">
              <input type="checkbox" [checked]="showNew()" (change)="showNew.set(!showNew())" class="w-3 h-3" />
              <span class="text-xs text-gray-400">Mostrar nueva contraseña</span>
            </label>
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
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrent = signal(false);
  showNew = signal(false);
  loading = signal(false);

  requirements = computed(() => {
    const p = this.newPassword;
    return [
      { label: 'Mínimo 8 caracteres', met: p.length >= 8 },
      { label: '1 letra mayúscula', met: /[A-Z]/.test(p) },
      { label: '1 número', met: /[0-9]/.test(p) },
    ];
  });

  canSubmit = computed(() => {
    const p = this.newPassword;
    return (
      !!this.currentPassword &&
      !!p &&
      p.length >= 8 &&
      /[A-Z]/.test(p) &&
      /[0-9]/.test(p) &&
      p === this.confirmPassword
    );
  });

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
  ) {}

  onSubmit() {
    if (!this.canSubmit()) {
      if (this.newPassword !== this.confirmPassword) {
        this.toast.error('Las contraseñas no coinciden');
        return;
      }
      if (this.newPassword.length < 8 || !/[A-Z]/.test(this.newPassword) || !/[0-9]/.test(this.newPassword)) {
        this.toast.error('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número');
        return;
      }
      return;
    }

    this.loading.set(true);
    this.api.patch<{ message: string }>('auth/change-password', {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Contraseña actualizada');
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(apiErrorMessage(err, 'No se pudo actualizar la contraseña'));
      },
    });
  }
}
