import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-client-support',
  standalone: true,
  imports: [CommonModule, FormsModule, RelativeTimePipe],
  template: `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="page-title">Soporte</h1>
        <p class="page-subtitle">Tus solicitudes de asistencia y mensajes</p>
      </div>
      <button (click)="showNewTicket.set(true)" class="btn-primary text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
          <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/>
        </svg>
        Nueva Solicitud
      </button>
    </div>

    <!-- New ticket form -->
    <div *ngIf="showNewTicket()" class="aero-card p-6 mb-6 animate-enter">
      <div class="flex items-center justify-between mb-4">
        <h2 style="font-size:1rem;font-weight:600;color:white">Open a Soporte Request</h2>
        <button (click)="showNewTicket.set(false)" class="btn-icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div class="form-group md:col-span-2">
          <label class="aero-label">Asunto *</label>
          <input type="text" [(ngModel)]="newForm.subject" maxlength="200" minlength="5"
                 class="aero-input" placeholder="Descripción breve de tu consulta" />
        </div>
        <div class="form-group">
          <label class="aero-label">Canal</label>
          <select [(ngModel)]="newForm.channel" class="aero-input">
            <option value="WEB">Web</option>
            <option value="EMAIL">Email</option>
          </select>
        </div>
        <div class="form-group">
          <label class="aero-label">Prioridad</label>
          <select [(ngModel)]="newForm.priority" class="aero-input">
            <option value="LOW">Baja — consulta general</option>
            <option value="MEDIUM">Media — requiere atención</option>
            <option value="HIGH">Alta — urgente</option>
            <option value="URGENT">Urgente — requiere ayuda inmediata</option>
          </select>
        </div>
        <div class="form-group md:col-span-2">
          <label class="aero-label">Mensaje *</label>
          <textarea [(ngModel)]="newForm.message" rows="4" maxlength="2000"
                    class="aero-input resize-none" placeholder="Describe tu consulta con el mayor detalle posible. Más contexto = respuesta más rápida."></textarea>
          <p style="font-size:.7rem;color:#2452a0;text-align:right;margin-top:.25rem">{{ (newForm.message || '').length }}/2000</p>
        </div>
      </div>

      <div *ngIf="ticketError()" class="mb-3 text-sm" style="color:#f87171">{{ ticketError() }}</div>

      <div class="flex gap-3 justify-end">
        <button (click)="showNewTicket.set(false)" class="btn-ghost">Cancelar</button>
        <button (click)="submitTicket()" class="btn-primary"
                [disabled]="submitting() || !newForm.subject?.trim() || !newForm.message?.trim() || newForm.message.length < 10">
          <svg *ngIf="submitting()" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          {{ submitting() ? 'Enviando…' : 'Enviar Solicitud' }}
        </button>
      </div>
    </div>

    <!-- Tickets list -->
    <div *ngIf="loading()" class="space-y-3">
      <div *ngFor="let _ of [1,2,3]" class="skeleton" style="height:80px;border-radius:.75rem"></div>
    </div>

    <div *ngIf="!loading()" class="space-y-4">
      <div *ngFor="let t of tickets()" class="aero-card overflow-hidden">
        <!-- Ticket header -->
        <div (click)="t._open = !t._open" style="padding:1rem 1.25rem;cursor:pointer;display:flex;align-items:start;justify-content:space-between;gap:1rem"
             [style.border-bottom]="t._open ? '1px solid rgba(22,45,88,0.5)' : 'none'">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.375rem">
              <span style="font-family:'JetBrains Mono',monospace;font-size:.7rem;color:#5580d0">{{ t.ticketNumber }}</span>
              <span class="badge text-xs"
                [class.badge-blue]="t.status === 'OPEN'"
                [class.badge-purple]="t.status === 'IN_PROGRESS'"
                [class.badge-yellow]="t.status === 'WAITING_CUSTOMER'"
                [class.badge-green]="t.status === 'RESOLVED'"
                [class.badge-gray]="t.status === 'CLOSED'"
                [class.badge-red]="t.status === 'ESCALATED'">
                {{ t.status.replace('_',' ') }}
              </span>
              <span class="badge text-xs"
                [class.badge-red]="t.priority === 'URGENT'"
                [class.badge-orange]="t.priority === 'HIGH'"
                [class.badge-yellow]="t.priority === 'MEDIUM'"
                [class.badge-gray]="t.priority === 'LOW'">
                {{ t.priority }}
              </span>
            </div>
            <p style="font-size:.9rem;font-weight:600;color:white">{{ t.subject }}</p>
            <p style="font-size:.75rem;color:#5580d0;margin-top:.25rem">{{ t.createdAt | relativeTime }}</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;color:#2452a0;flex-shrink:0;transition:transform .2s"
               [style.transform]="t._open ? 'rotate(180deg)' : 'rotate(0)'"
               viewBox="0 0 256 256" fill="currentColor">
            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
          </svg>
        </div>

        <!-- Messages -->
        <div *ngIf="t._open" style="padding:1rem 1.25rem;space-y:.75rem">
          <div *ngFor="let msg of t.messages" class="mb-3"
               [style.display]="'flex'"
               [style.flex-direction]="msg.authorType === 'operator' ? 'row-reverse' : 'row'"
               [style.gap]="'.625rem'">
            <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;flex-shrink:0"
                 [style.background]="msg.authorType === 'operator' ? 'rgba(201,168,76,0.15)' : 'rgba(22,45,88,0.8)'"
                 [style.border]="msg.authorType === 'operator' ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(36,82,160,0.3)'"
                 [style.color]="msg.authorType === 'operator' ? '#c9a84c' : '#5580d0'">
              {{ msg.authorName?.[0] || '?' }}
            </div>
            <div style="max-width:80%">
              <p style="font-size:.65rem;margin-bottom:.25rem"
                 [style.text-align]="msg.authorType === 'operator' ? 'right' : 'left'"
                 [style.color]="msg.authorType === 'operator' ? '#c9a84c' : '#5580d0'">
                {{ msg.authorType === 'operator' ? 'Soporte Agent' : 'Tú' }}
              </p>
              <div style="padding:.625rem .875rem;border-radius:.75rem;font-size:.875rem;color:white;line-height:1.5"
                   [style.background]="msg.authorType === 'operator' ? 'rgba(201,168,76,0.1)' : 'rgba(22,45,88,0.8)'"
                   [style.border]="msg.authorType === 'operator' ? '1px solid rgba(201,168,76,0.2)' : '1px solid rgba(36,82,160,0.2)'">
                {{ msg.content }}
              </div>
            </div>
          </div>

          <!-- Reply box (only if open/in_progress) -->
          <div *ngIf="['OPEN','IN_PROGRESS','WAITING_CUSTOMER'].includes(t.status)" class="mt-4 pt-3"
               style="border-top:1px solid rgba(22,45,88,0.5)">
            <textarea [(ngModel)]="t._reply" rows="2" maxlength="2000"
                      class="aero-input resize-none text-sm mb-2" placeholder="Escribe tu respuesta…"></textarea>
            <button (click)="sendReply(t)" class="btn-primary text-sm py-1.5" [disabled]="!t._reply?.trim() || t._sending">
              <svg *ngIf="t._sending" class="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <svg *ngIf="!t._sending" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 256 256" fill="currentColor"><path d="M227.32,28.68a16,16,0,0,0-15.66-4.08l-.15,0L19.57,82.84a16,16,0,0,0-2.42,29.84l85.76,40.11,40.15,85.82a15.86,15.86,0,0,0,14.43,9.21q.69,0,1.38-.06a15.88,15.88,0,0,0,14-11.51l58.2-191.94c0-.05,0-.1.05-.15A16,16,0,0,0,227.32,28.68Z"/></svg>
              Enviar Respuesta
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="tickets().length === 0 && !showNewTicket()" style="text-align:center;padding:3rem;color:#2452a0">
        <svg xmlns="http://www.w3.org/2000/svg" style="width:48px;height:48px;margin:0 auto 1rem;color:#162d58" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Z"/></svg>
        <p style="font-size:1rem;font-weight:500;color:white;margin-bottom:.5rem">Sin solicitudes</p>
        <p style="font-size:.875rem;margin-bottom:1rem">¿Necesitas ayuda? Abre una solicitud y nuestro equipo te atenderá</p>
        <button (click)="showNewTicket.set(true)" class="btn-primary text-sm">Abrir Solicitud</button>
      </div>
    </div>
  `,
})
export class ClientSoporteComponent implements OnInit {
  tickets = signal<any[]>([]);
  loading = signal(true);
  showNewTicket = signal(false);
  submitting = signal(false);
  ticketError = signal('');

  newForm = { subject: '', channel: 'WEB', priority: 'MEDIUM', message: '' };

  constructor(private api: ApiService, private auth: AuthService, private toast: ToastService) {}

  ngOnInit() { this.loadTickets(); }

  loadTickets() {
    this.loading.set(true);
    this.api.get<any>('auth/client/profile').subscribe({
      next: p => {
        this.tickets.set((p.tickets || []).map((t: any) => ({ ...t, _open: false, _reply: '', _sending: false })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submitTicket() {
    if (!this.newForm.subject?.trim() || !this.newForm.message?.trim()) return;
    this.submitting.set(true);
    this.ticketError.set('');
    const user = this.auth.currentUser();
    this.api.post('support/tickets', {
      passengerId: (user as any).passengerId,
      subject: this.newForm.subject,
      channel: this.newForm.channel,
      priority: this.newForm.priority,
      initialMessage: this.newForm.message,
    }).subscribe({
      next: () => {
        this.toast.success('Soporte request submitted. Our team will respond shortly.');
        this.showNewTicket.set(false);
        this.newForm = { subject: '', channel: 'WEB', priority: 'MEDIUM', message: '' };
        this.submitting.set(false);
        this.loadTickets();
      },
      error: err => {
        this.submitting.set(false);
        this.ticketError.set(err?.error?.message || 'Error al enviar. Por favor inténtalo de nuevo.');
      },
    });
  }

  sendReply(ticket: any) {
    if (!ticket._reply?.trim()) return;
    ticket._sending = true;
    this.api.post(`support/tickets/${ticket.id}/messages`, { content: ticket._reply, isInternal: false }).subscribe({
      next: (msg: any) => {
        ticket.messages = [...ticket.messages, msg];
        ticket._reply = '';
        ticket._sending = false;
        this.toast.success('Respuesta enviada');
      },
      error: () => { ticket._sending = false; this.toast.error('Error al enviar la respuesta'); },
    });
  }
}
