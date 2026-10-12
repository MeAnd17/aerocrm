import { Component, signal } from '@angular/core';
import { apiErrorMessage } from '../../core/services/api-error';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-lg mx-auto space-y-5">
      <h1 class="text-2xl font-bold text-gray-800">Contáctanos</h1>
      <p class="text-gray-500">Escríbenos y te responderemos a la brevedad.</p>

      @if (sent()) {
        <div class="bg-green-50 border border-green-200 text-green-700 rounded-xl p-5 text-center">
          <p class="text-2xl mb-2">✅</p>
          <p class="font-semibold">¡Mensaje enviado!</p>
          <p class="text-sm mt-1">Te responderemos pronto al correo indicado.</p>
        </div>
      } @else {
        <form (ngSubmit)="onSubmit()" class="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" [(ngModel)]="form.name" name="name" required
                class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <input type="email" [(ngModel)]="form.email" name="email" required
                class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
            <input type="text" [(ngModel)]="form.subject" name="subject" required
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea [(ngModel)]="form.message" name="message" required rows="5"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Escribe tu consulta aquí..."></textarea>
          </div>
          @if (error()) {
            <p class="text-red-600 text-sm">{{ error() }}</p>
          }
          <button type="submit" [disabled]="loading()"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {{ loading() ? 'Enviando...' : 'Enviar mensaje' }}
          </button>
        </form>
      }
    </div>
  `,
})
export class ContactComponent {
  form = { name: '', email: '', subject: '', message: '' };
  loading = signal(false);
  sent = signal(false);
  error = signal('');

  constructor(private api: ApiService) {}

  onSubmit() {
    this.loading.set(true);
    this.error.set('');
    this.api.post<any>('contact', this.form).subscribe({
      next: () => { this.sent.set(true); this.loading.set(false); },
      error: (err) => { this.error.set(apiErrorMessage(err, 'No pudimos enviar tu mensaje')); this.loading.set(false); },
    });
  }
}
