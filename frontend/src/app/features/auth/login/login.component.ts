import { Component, signal } from '@angular/core';
import { apiErrorMessage } from '../../../core/services/api-error';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-blue-900">✈️ AeroCRM</h1>
          <p class="text-gray-500 mt-2">Inicia sesión en tu cuenta</p>
        </div>

        <form (ngSubmit)="onSubmit()" #form="ngForm" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" name="email" [(ngModel)]="email" required
              class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" name="password" [(ngModel)]="password" required
              class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••" />
          </div>

          @if (error()) {
            <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {{ error() }}
            </div>
          }

          <button type="submit" [disabled]="loading()"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {{ loading() ? 'Iniciando sesión...' : 'Iniciar sesión' }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?
          <a routerLink="/register" class="text-blue-600 font-medium hover:underline">Regístrate gratis</a>
        </p>
        <p class="text-center text-sm text-gray-400 mt-2">
          <a routerLink="/explore" class="hover:underline">Explorar sin cuenta →</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'Correo o contraseña incorrectos'));
        this.loading.set(false);
      },
    });
  }
}
