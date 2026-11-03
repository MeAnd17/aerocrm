import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/services/api-error';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Contáctanos</h1>
        <p class="text-gray-500 mt-1">Escríbenos y te responderemos a la brevedad.</p>
      </div>

      <!-- Formulario de contacto -->
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
              #emailInput="ngModel"
              class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-400]="emailInput.invalid && emailInput.touched" />
            @if (emailInput.invalid && emailInput.touched) {
              <p class="text-red-600 text-xs mt-1">Ingresa un correo válido</p>
            }
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
          <input type="text" [(ngModel)]="form.subject" name="subject" required
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
          <textarea [(ngModel)]="form.message" name="message" required minlength="10" rows="5"
            #mensajeInput="ngModel"
            class="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            [class.border-red-400]="mensajeInput.invalid && mensajeInput.touched"
            placeholder="Escribe tu consulta aquí..."></textarea>
          @if (mensajeInput.invalid && mensajeInput.touched) {
            <p class="text-red-600 text-xs mt-1">El mensaje debe tener al menos 10 caracteres</p>
          }
        </div>
        @if (error()) {
          <p class="text-red-600 text-sm">{{ error() }}</p>
        }
        <button type="submit" [disabled]="loading()"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
          {{ loading() ? 'Enviando...' : 'Enviar mensaje' }}
        </button>
      </form>

      <!-- Mis consultas (solo usuarios autenticados) -->
      @if (usuarioActual()) {
        <section class="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h2 class="text-lg font-semibold text-gray-800">Mis consultas anteriores</h2>
          @if (cargandoConsultas()) {
            <p class="text-gray-400 text-sm">Cargando consultas...</p>
          } @else if (consultas().length === 0) {
            <p class="text-gray-400 text-sm">No tienes consultas enviadas aún.</p>
          } @else {
            <ul class="divide-y divide-gray-100">
              @for (consulta of consultas(); track consulta.id) {
                <li class="py-3">
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                      <p class="font-medium text-gray-800 truncate">{{ consulta.subject }}</p>
                      <p class="text-sm text-gray-500 mt-0.5 line-clamp-2">{{ consulta.message }}</p>
                    </div>
                    <time class="text-xs text-gray-400 whitespace-nowrap shrink-0">
                      {{ consulta.createdAt | date:'dd/MM/yyyy' }}
                    </time>
                  </div>
                </li>
              }
            </ul>
          }
        </section>
      }

      <!-- Preguntas frecuentes -->
      <section class="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <h2 class="text-lg font-semibold text-gray-800">Preguntas frecuentes</h2>
        <dl class="space-y-4">
          <div>
            <dt class="font-medium text-gray-700">¿Cuánto tarda en responderse una consulta?</dt>
            <dd class="text-gray-500 text-sm mt-1">Respondemos todas las consultas en un plazo máximo de 24 horas hábiles.</dd>
          </div>
          <div>
            <dt class="font-medium text-gray-700">¿Puedo modificar una reserva ya confirmada?</dt>
            <dd class="text-gray-500 text-sm mt-1">Sí, siempre que la reserva esté en estado Confirmado o En curso. Escríbenos indicando tu código de reserva.</dd>
          </div>
          <div>
            <dt class="font-medium text-gray-700">¿Cómo puedo canjear mis puntos de fidelización?</dt>
            <dd class="text-gray-500 text-sm mt-1">Los puntos se aplican automáticamente durante el proceso de compra de tu paquete, en el paso de pago.</dd>
          </div>
          <div>
            <dt class="font-medium text-gray-700">¿Qué documentos necesito para viajar?</dt>
            <dd class="text-gray-500 text-sm mt-1">Depende del destino. Para vuelos nacionales basta el DNI; para internacionales necesitarás pasaporte vigente. Escríbenos si tienes dudas sobre tu destino específico.</dd>
          </div>
        </dl>
      </section>
    </div>
  `,
})
export class ContactComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  usuarioActual = this.authService.currentUser;

  form: ContactForm = { name: '', email: '', subject: '', message: '' };
  loading = signal(false);
  error = signal('');

  consultas = signal<ContactMessage[]>([]);
  cargandoConsultas = signal(false);

  ngOnInit() {
    /** Precarga nombre y correo si hay sesión activa, y carga el historial del usuario. */
    const usuario = this.usuarioActual();
    if (usuario) {
      this.form.name = `${usuario.firstName} ${usuario.lastName}`.trim();
      this.form.email = usuario.email;
      this.cargarConsultas();
    }
  }

  onSubmit() {
    /** Envía el formulario y actualiza el historial si el usuario está autenticado. */
    this.loading.set(true);
    this.error.set('');
    this.api.post<{ message: string }>('contact', this.form).subscribe({
      next: () => {
        this.loading.set(false);
        this.form.subject = '';
        this.form.message = '';
        this.toast.success('Tu consulta fue enviada. Te responderemos pronto');
        if (this.usuarioActual()) {
          this.cargarConsultas();
        }
      },
      error: (err: unknown) => {
        this.error.set(apiErrorMessage(err, 'No pudimos enviar tu mensaje'));
        this.loading.set(false);
      },
    });
  }

  private cargarConsultas() {
    /** Carga el historial de consultas del usuario autenticado. */
    this.cargandoConsultas.set(true);
    this.api.get<ContactMessage[]>('contact/mine').subscribe({
      next: (lista) => {
        this.consultas.set(lista);
        this.cargandoConsultas.set(false);
      },
      error: () => {
        this.cargandoConsultas.set(false);
      },
    });
  }
}
