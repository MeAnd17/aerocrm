import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold text-blue-900">✈️ Viajes CRM</h1>
          <p class="text-gray-500 mt-2">Crea tu cuenta</p>
        </div>

        @if (step() === 1) {
          <form (ngSubmit)="nextStep()" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" [(ngModel)]="form.firstName" name="firstName" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input type="text" [(ngModel)]="form.lastName" name="lastName" required
                  class="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input type="email" [(ngModel)]="form.email" name="email" required
                class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input type="password" [(ngModel)]="form.password" name="password" required
                class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número" />
            </div>
            <button type="submit"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
              Continuar →
            </button>
          </form>
        }

        @if (step() === 2) {
          <div class="space-y-4">
            <p class="text-sm text-gray-500 text-center">Opcional — puedes omitir estas preguntas</p>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">¿Cómo sueles viajar?</label>
              <div class="grid grid-cols-2 gap-2">
                @for (option of travelOptions; track option.value) {
                  <button type="button" (click)="form.travelStyle = option.value"
                    [class.ring-2]="form.travelStyle === option.value"
                    [class.ring-blue-500]="form.travelStyle === option.value"
                    class="border border-gray-200 rounded-lg py-2.5 text-sm hover:border-blue-400 transition text-center">
                    {{ option.label }}
                  </button>
                }
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">¿Qué tipo de destino prefieres?</label>
              <div class="grid grid-cols-2 gap-2">
                @for (option of destinationOptions; track option.value) {
                  <button type="button" (click)="form.destinationType = option.value"
                    [class.ring-2]="form.destinationType === option.value"
                    [class.ring-blue-500]="form.destinationType === option.value"
                    class="border border-gray-200 rounded-lg py-2.5 text-sm hover:border-blue-400 transition text-center">
                    {{ option.label }}
                  </button>
                }
              </div>
            </div>

            @if (error()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{{ error() }}</div>
            }

            <div class="flex gap-3">
              <button (click)="submit()" [disabled]="loading()"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
                {{ loading() ? 'Creando cuenta...' : 'Crear cuenta' }}
              </button>
              <button (click)="submit()" class="text-sm text-gray-400 hover:text-gray-600 px-3">Omitir</button>
            </div>
          </div>
        }

        <p class="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta? <a routerLink="/login" class="text-blue-600 font-medium hover:underline">Inicia sesión</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  step = signal(1);
  loading = signal(false);
  error = signal('');

  form: any = { firstName: '', lastName: '', email: '', password: '', travelStyle: null, destinationType: null };

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

  constructor(private auth: AuthService, private router: Router) {}

  nextStep() {
    if (!this.form.firstName || !this.form.lastName || !this.form.email || !this.form.password) return;
    this.step.set(2);
  }

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.form).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al crear la cuenta');
        this.loading.set(false);
      },
    });
  }
}
