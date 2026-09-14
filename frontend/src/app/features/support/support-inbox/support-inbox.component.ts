import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-support-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RelativeTimePipe, TitleCasePipe],
  template: `
    <div class="flex h-full" style="height: calc(100vh - 7rem)">

      <!-- LEFT PANEL: Ticket List -->
      <div class="w-80 flex-shrink-0 flex flex-col border-r border-navy-700 bg-navy-900/40 rounded-l-xl overflow-hidden">

        <!-- Header + simulate button -->
        <div class="p-4 border-b border-navy-700 flex-shrink-0">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h1 class="font-bold text-white text-base">Bandeja de Soporte</h1>
              <p class="text-xs text-navy-400">{{ total() }} tickets</p>
            </div>
            <button (click)="simulate()" [disabled]="simulating()" class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <svg *ngIf="!simulating()" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 256 256" fill="currentColor">
                <path d="M213.85,125.46l-112,120a8,8,0,0,1-13.85-5.46V136H24a8,8,0,0,1-5.54-13.77l112-104A8,8,0,0,1,144,24V120h72a8,8,0,0,1,5.54,13.77A8,8,0,0,1,213.85,125.46Z"/>
              </svg>
              <svg *ngIf="simulating()" class="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              Simular
            </button>
          </div>

          <!-- Filters -->
          <div class="space-y-2">
            <div class="flex gap-1 flex-wrap">
              <button *ngFor="let ch of channelFilters" (click)="toggleCanal(ch.value)"
                      class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all border"
                      [class.bg-gold-500]="channelFilter === ch.value"
                      [class.border-gold-500]="channelFilter === ch.value"
                      [class.text-gold-400]="channelFilter === ch.value"
                      [class.border-navy-600]="channelFilter !== ch.value"
                      [class.text-navy-400]="channelFilter !== ch.value">
                <span [innerHTML]="getCanalIcon(ch.value)" class="w-3 h-3"></span>
                {{ ch.label }}
              </button>
            </div>
            <div class="flex gap-1">
              <button *ngFor="let p of priorityFilters" (click)="togglePriority(p.value)"
                      class="px-2 py-1 rounded-lg text-xs transition-all border flex-1 text-center"
                      [class.border-navy-600]="priorityFilter !== p.value"
                      [class.text-navy-400]="priorityFilter !== p.value"
                      [ngClass]="priorityFilter === p.value ? p.activeClass : ''">
                {{ p.label }}
              </button>
            </div>
            <select [(ngModel)]="statusFilter" (ngModelChange)="loadTickets()" class="aero-input py-1.5 text-xs w-full">
              <option value="">Todos Statuses</option>
              <option value="OPEN">Abierto</option>
              <option value="IN_PROGRESS">En curso</option>
              <option value="WAITING_CUSTOMER">Esperando cliente</option>
              <option value="RESOLVED">Resuelto</option>
              <option value="ESCALATED">Escalado</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </div>
        </div>

        <!-- Ticket list -->
        <div class="flex-1 overflow-y-auto">
          <div *ngIf="loadingTickets()" class="p-3 space-y-2">
            <div *ngFor="let _ of [1,2,3,4,5]" class="skeleton h-20 rounded-lg"></div>
          </div>
          <div *ngIf="!loadingTickets()">
            <div *ngFor="let t of tickets()"
                 (click)="selectTicket(t)"
                 class="p-3 border-b border-navy-800 cursor-pointer transition-all hover:bg-navy-800/60 relative"
                 [class.bg-navy-800]="selectedTicket()?.id === t.id"
                 [class.border-l-4]="t.priority === 'URGENT' || t.priority === 'HIGH'"
                 [class.border-l-red-500]="t.priority === 'URGENT'"
                 [class.border-l-orange-500]="t.priority === 'HIGH'"
                 [class.animate-enter]="t.isNuevo">
              <div class="flex items-start gap-2">
                <span [innerHTML]="getCanalIcon(t.channel)" class="w-4 h-4 flex-shrink-0 mt-0.5 text-navy-400"></span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-1">
                    <p class="text-xs font-semibold text-white truncate leading-snug">{{ t.subject }}</p>
                    <span class="badge text-xs flex-shrink-0 ml-1"
                      [class.badge-red]="t.priority === 'URGENT'"
                      [class.badge-orange]="t.priority === 'HIGH'"
                      [class.badge-yellow]="t.priority === 'MEDIUM'"
                      [class.badge-gray]="t.priority === 'LOW'">
                      {{ t.priority }}
                    </span>
                  </div>
                  <p class="text-xs text-navy-400 mt-0.5">{{ t.passenger?.firstName }} {{ t.passenger?.lastName }}</p>
                  <p *ngIf="t.messages?.[0]" class="text-xs text-navy-500 mt-0.5 truncate">{{ t.messages[0].content }}</p>
                  <div class="flex items-center justify-between mt-1">
                    <span class="badge text-xs"
                      [class.badge-blue]="t.status === 'OPEN'"
                      [class.badge-purple]="t.status === 'IN_PROGRESS'"
                      [class.badge-green]="t.status === 'RESOLVED' || t.status === 'CLOSED'"
                      [class.badge-red]="t.status === 'ESCALATED'"
                      [class.badge-yellow]="t.status === 'WAITING_CUSTOMER'">
                      {{ t.status.replace('_',' ') }}
                    </span>
                    <span class="text-xs text-navy-600">{{ t.createdAt | relativeTime }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div *ngIf="tickets().length === 0" class="p-6 text-center text-navy-500 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 mx-auto mb-2 text-navy-700" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Z"/></svg>
              Sin tickets encontrados
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL: Conversation + AI -->
      <div class="flex-1 flex flex-col bg-navy-900/20 rounded-r-xl overflow-hidden min-w-0">

        <!-- Empty state -->
        <div *ngIf="!selectedTicket()" class="flex-1 flex flex-col items-center justify-center text-navy-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mb-4 text-navy-700" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Z"/></svg>
          <p class="font-medium text-navy-400">Selecciona un ticket para ver la conversación</p>
          <p class="text-sm mt-1">or click Simular to inject a test message</p>
        </div>

        <!-- Ticket detail -->
        <div *ngIf="selectedTicket()" class="flex-1 flex flex-col overflow-hidden">

          <!-- Ticket header -->
          <div class="p-4 border-b border-navy-700 flex-shrink-0 bg-navy-800/30">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span [innerHTML]="getCanalIcon(selectedTicket()?.channel)" class="w-4 h-4 text-navy-400"></span>
                  <h2 class="font-semibold text-white text-sm truncate">{{ selectedTicket()?.subject }}</h2>
                </div>
                <div class="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span class="font-mono text-xs text-navy-500">{{ selectedTicket()?.ticketNumber }}</span>
                  <a *ngIf="selectedTicket()?.passenger" [routerLink]="['/passengers', selectedTicket()?.passenger?.id]" class="text-xs text-gold-400 hover:text-gold-300 transition-colors">
                    {{ selectedTicket()?.passenger?.firstName }} {{ selectedTicket()?.passenger?.lastName }}
                  </a>
                  <span class="badge text-xs"
                    [class.badge-blue]="selectedTicket()?.status === 'OPEN'"
                    [class.badge-purple]="selectedTicket()?.status === 'IN_PROGRESS'"
                    [class.badge-green]="selectedTicket()?.status === 'RESOLVED'"
                    [class.badge-red]="selectedTicket()?.status === 'ESCALATED'"
                    [class.badge-yellow]="selectedTicket()?.status === 'WAITING_CUSTOMER'">
                    {{ selectedTicket()?.status?.replace('_',' ') }}
                  </span>
                </div>
              </div>
              <!-- Status actions -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <select [(ngModel)]="newStatus" (ngModelChange)="updateStatus()" class="aero-input py-1 text-xs w-36" [disabled]="updatingStatus()">
                  <option value="">Cambiar estado…</option>
                  <option value="OPEN">Abierto</option>
                  <option value="IN_PROGRESS">En curso</option>
                  <option value="WAITING_CUSTOMER">Esperando cliente</option>
                  <option value="RESOLVED">Resuelto</option>
                  <option value="ESCALATED">Escalado</option>
                  <option value="CLOSED">Cerrado</option>
                </select>
                <select [(ngModel)]="newPriority" (ngModelChange)="updatePriority()" class="aero-input py-1 text-xs w-32" [disabled]="updatingStatus()">
                  <option value="">Prioridad…</option>
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>
          </div>

          <div class="flex-1 flex overflow-hidden">

            <!-- Messages -->
            <div class="flex-1 flex flex-col overflow-hidden">
              <div class="flex-1 overflow-y-auto p-4 space-y-4" #messageContainer>
                <div *ngFor="let msg of selectedTicket()?.messages" class="flex" [class.justify-end]="msg.authorType === 'operator'">

                  <!-- System message -->
                  <div *ngIf="msg.authorType === 'system'" class="w-full text-center">
                    <span class="text-xs text-navy-500 bg-navy-800 rounded-full px-3 py-1">{{ msg.content }}</span>
                  </div>

                  <!-- Passenger message -->
                  <div *ngIf="msg.authorType === 'passenger'" class="max-w-sm">
                    <div class="flex items-end gap-2">
                      <div class="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs font-bold text-navy-200 flex-shrink-0">
                        {{ selectedTicket()?.passenger?.firstName?.[0] || 'P' }}
                      </div>
                      <div>
                        <div class="bg-navy-700 rounded-2xl rounded-bl-sm px-4 py-2.5">
                          <p class="text-sm text-white whitespace-pre-wrap">{{ msg.content }}</p>
                        </div>
                        <div class="flex items-center gap-1 mt-1">
                          <span [innerHTML]="getCanalIcon(msg.channel)" class="w-3 h-3 text-navy-500"></span>
                          <p class="text-xs text-navy-600">{{ msg.createdAt | relativeTime }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Operator message -->
                  <div *ngIf="msg.authorType === 'operator'" class="max-w-sm">
                    <div class="flex items-end gap-2 flex-row-reverse">
                      <div class="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-xs font-bold text-gold-400 flex-shrink-0">
                        {{ msg.authorName?.[0] || 'O' }}
                      </div>
                      <div>
                          <div class="rounded-2xl rounded-br-sm px-4 py-2.5"
                             [style.background]="msg.isInternal ? 'rgba(146,64,14,0.3)' : 'rgba(201,168,76,0.15)'"
                             [class.border]="msg.isInternal"
                             [class.border-amber-600]="msg.isInternal">
                          <p *ngIf="msg.isInternal" class="text-xs text-amber-400 mb-1 font-medium">Nota interna</p>
                          <p class="text-sm text-white whitespace-pre-wrap">{{ msg.content }}</p>
                        </div>
                        <p class="text-xs text-navy-600 mt-1 text-right">{{ msg.createdAt | relativeTime }}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Reply box -->
              <div class="p-3 border-t border-navy-700 flex-shrink-0 bg-navy-800/20">
                <textarea [(ngModel)]="replyText" rows="3" maxlength="2000" placeholder="Escribe tu respuesta…"
                          class="aero-input resize-none text-sm mb-2 w-full"></textarea>
                <div class="flex items-center justify-between">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="isInternal" class="w-3.5 h-3.5 accent-amber-500" />
                    <span class="text-xs text-navy-400">Nota interna (no visible para el pasajero)</span>
                  </label>
                  <button (click)="sendReply()" class="btn-primary text-sm py-1.5 px-4" [disabled]="!replyText.trim() || sendingReply()">
                    <svg *ngIf="sendingReply()" class="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    <svg *ngIf="!sendingReply()" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 256 256" fill="currentColor"><path d="M227.32,28.68a16,16,0,0,0-15.66-4.08l-.15,0L19.57,82.84a16,16,0,0,0-2.42,29.84l85.76,40.11,40.15,85.82a15.86,15.86,0,0,0,14.43,9.21q.69,0,1.38-.06a15.88,15.88,0,0,0,14-11.51l58.2-191.94c0-.05,0-.1.05-.15A16,16,0,0,0,227.32,28.68Z"/></svg>
                    Enviar Respuesta
                  </button>
                </div>
              </div>
            </div>

            <!-- AI Panel -->
            <div class="w-64 flex-shrink-0 border-l border-navy-700 flex flex-col bg-navy-800/20 overflow-y-auto">
              <div class="p-3 border-b border-navy-700">
                <div class="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gold-400" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M224,160a32.06,32.06,0,0,1-28.42,31.81L185.07,224H70.93l-10.51-32.19A32,32,0,0,1,32,160V64A32,32,0,0,1,64,32H192a32,32,0,0,1,32,32ZM192,48H64A16,16,0,0,0,48,64v96a16,16,0,0,0,13.23,15.74L68.93,200H187.07l7.7-24.26A16,16,0,0,0,208,160V64A16,16,0,0,0,192,48ZM80,112a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,112Zm0-32a8,8,0,0,1,8-8h80a8,8,0,0,1,0,16H88A8,8,0,0,1,80,80Z"/>
                  </svg>
                  <h3 class="text-xs font-bold text-white uppercase tracking-wider">Asistente IA</h3>
                  <span class="badge badge-navy text-xs ml-auto">Llama 3</span>
                </div>
              </div>

              <div class="flex-1 p-3 space-y-3">
                <!-- Analyze button -->
                <button (click)="analyzeWithAI()" class="btn-secondary w-full text-xs py-2 justify-center" [disabled]="analyzingAI()">
                  <svg *ngIf="analyzingAI()" class="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  <svg *ngIf="!analyzingAI()" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 256 256" fill="currentColor"><path d="M247.39,68.94A8,8,0,0,0,240,64H160l-19.47-38.94A8,8,0,0,0,133.16,21a8.08,8.08,0,0,0-7.37,1.07L60.44,72H24A16,16,0,0,0,8,88v80a16,16,0,0,0,16,16H60.44l65.35,49.93A8,8,0,0,0,135,235a8,8,0,0,0,5.53-2.06,7.94,7.94,0,0,0,2.47-5.79V197.6l72.83-72.83A8,8,0,0,0,247.39,68.94Z"/></svg>
                  {{ analyzingAI() ? 'Analizando…' : 'Analizar con IA' }}
                </button>

                <!-- AI unavailable -->
                <div *ngIf="aiUnavailable()" class="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-xs text-amber-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mb-1" viewBox="0 0 256 256" fill="currentColor"><path d="M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/></svg>
                  El servicio de IA no está disponible. Verifica que Ollama esté en línea.
                </div>

                <!-- AI Results -->
                <div *ngIf="aiAnalysis()">
                  <!-- Sentimiento -->
                  <div class="bg-navy-900/60 rounded-lg p-3 mb-2">
                    <p class="text-xs text-navy-400 mb-1 font-medium">Sentimiento</p>
                    <div class="flex items-center gap-2">
                      <span class="badge text-xs"
                        [class.badge-green]="aiAnalysis()?.sentimentLabel === 'positive'"
                        [class.badge-gray]="aiAnalysis()?.sentimentLabel === 'neutral'"
                        [class.badge-orange]="aiAnalysis()?.sentimentLabel === 'negative'"
                        [class.badge-red]="aiAnalysis()?.sentimentLabel === 'urgent'">
                        {{ aiAnalysis()?.sentimentLabel | titlecase }}
                      </span>
                      <span class="text-xs text-navy-500 font-mono">{{ aiAnalysis()?.sentimentScore?.toFixed(2) }}</span>
                    </div>
                  </div>

                  <!-- Summary -->
                  <div class="bg-navy-900/60 rounded-lg p-3 mb-2">
                    <p class="text-xs text-navy-400 mb-1 font-medium flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34Z"/></svg>
                      Resumen IA
                    </p>
                    <p class="text-xs text-navy-300 leading-relaxed">{{ aiAnalysis()?.summary }}</p>
                  </div>

                  <!-- Respuesta Sugerida -->
                  <div class="bg-navy-900/60 rounded-lg p-3 mb-2">
                    <p class="text-xs text-navy-400 mb-1 font-medium flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 256 256" fill="currentColor"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H216a8,8,0,0,0,0-16H115.32l112-112A16,16,0,0,0,227.31,73.37ZM92.69,208H48V163.31l88-88L180.69,120Z"/></svg>
                      Respuesta Sugerida
                    </p>
                    <p class="text-xs text-navy-400 leading-relaxed mb-2">{{ aiAnalysis()?.suggestedReply }}</p>
                    <button (click)="useSuggestedReply()" class="text-xs text-gold-400 hover:text-gold-300 transition-colors underline-offset-2 underline">
                      Usar esta respuesta
                    </button>
                  </div>

                  <!-- Cross-sell -->
                  <div *ngIf="aiAnalysis()?.crossSellRecs?.length" class="bg-navy-900/60 rounded-lg p-3">
                    <p class="text-xs text-navy-400 mb-2 font-medium">Recomendaciones de Venta Cruzada</p>
                    <div *ngFor="let rec of aiAnalysis()?.crossSellRecs" class="flex items-start gap-2 mb-2 last:mb-0">
                      <span class="w-1.5 h-1.5 rounded-full bg-gold-400 mt-1.5 flex-shrink-0"></span>
                      <div>
                        <p class="text-xs text-gold-300 font-medium">{{ rec.type?.replace('_',' ') | titlecase }}</p>
                        <p class="text-xs text-navy-500">{{ rec.reason }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Human-in-the-loop notice -->
                  <p class="text-xs text-navy-600 mt-3 text-center italic">
                    ✦ Sugerencia de IA — tú decides qué enviar
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
})
export class SupportInboxComponent implements OnInit {
  tickets = signal<any[]>([]);
  selectedTicket = signal<any>(null);
  loadingTickets = signal(true);
  total = signal(0);
  simulating = signal(false);
  replyText = '';
  isInternal = false;
  sendingReply = signal(false);
  updatingStatus = signal(false);
  newStatus = '';
  newPriority = '';
  analyzingAI = signal(false);
  aiAnalysis = signal<any>(null);
  aiUnavailable = signal(false);

  channelFilter = '';
  priorityFilter = '';
  statusFilter = '';

  channelFilters = [
    { value: '', label: 'Todos' },
    { value: 'WEB', label: 'Web' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'PHONE', label: 'Phone' },
    { value: 'TWITTER', label: 'Twitter' },
  ];

  priorityFilters = [
    { value: '', label: 'Todos', activeClass: 'border-navy-400 text-white bg-navy-700' },
    { value: 'URGENT', label: 'Urgente', activeClass: 'border-red-500 text-red-400 bg-red-500/10' },
    { value: 'HIGH', label: 'Alta', activeClass: 'border-orange-500 text-orange-400 bg-orange-500/10' },
    { value: 'MEDIUM', label: 'Med', activeClass: 'border-yellow-500 text-yellow-400 bg-yellow-500/10' },
    { value: 'LOW', label: 'Baja', activeClass: 'border-gray-500 text-gray-400 bg-gray-500/10' },
  ];

  constructor(private api: ApiService, private toast: ToastService, public auth: AuthService) {}

  ngOnInit() { this.loadTickets(); }

  loadTickets() {
    this.loadingTickets.set(true);
    const params: any = { limit: 50 };
    if (this.channelFilter) params.channel = this.channelFilter;
    if (this.priorityFilter) params.priority = this.priorityFilter;
    if (this.statusFilter) params.status = this.statusFilter;
    this.api.get<any>('support/tickets', params).subscribe({
      next: res => {
        this.tickets.set(res.data);
        this.total.set(res.total);
        this.loadingTickets.set(false);
      },
      error: () => this.loadingTickets.set(false),
    });
  }

  toggleCanal(val: string) { this.channelFilter = this.channelFilter === val ? '' : val; this.loadTickets(); }
  togglePriority(val: string) { this.priorityFilter = this.priorityFilter === val ? '' : val; this.loadTickets(); }

  selectTicket(t: any) {
    this.newStatus = '';
    this.newPriority = '';
    this.aiAnalysis.set(null);
    this.aiUnavailable.set(false);
    this.api.get<any>(`support/tickets/${t.id}`).subscribe(full => {
      this.selectedTicket.set(full);
      // Load existing AI analysis
      this.api.get<any>(`ai/analysis/${t.id}`).subscribe({
        next: a => { if (a) this.aiAnalysis.set({ ...a, crossSellRecs: typeof a.crossSellRecs === 'string' ? JSON.parse(a.crossSellRecs) : a.crossSellRecs }); },
        error: () => {},
      });
    });
  }

  simulate() {
    this.simulating.set(true);
    this.api.post<any>('support/simulate', {}).subscribe({
      next: ticket => {
        this.simulating.set(false);
        this.toast.info(`Nuevo ticket: ${ticket.subject}`, 'Simulard Message');
        const marked = { ...ticket, isNuevo: true };
        this.tickets.update(t => [marked, ...t]);
        this.total.update(n => n + 1);
        this.selectTicket(ticket);
        setTimeout(() => this.tickets.update(t => t.map(x => x.id === ticket.id ? { ...x, isNuevo: false } : x)), 2000);
      },
      error: err => { this.simulating.set(false); this.toast.error(err?.error?.message || 'Error en simulación'); },
    });
  }

  sendReply() {
    if (!this.replyText.trim()) return;
    this.sendingReply.set(true);
    this.api.post(`support/tickets/${this.selectedTicket()?.id}/messages`, {
      content: this.replyText,
      isInternal: this.isInternal,
    }).subscribe({
      next: msg => {
        this.selectedTicket.update(t => ({ ...t, messages: [...t.messages, msg] }));
        this.replyText = '';
        this.isInternal = false;
        this.sendingReply.set(false);
        this.toast.success('Respuesta enviada');
      },
      error: err => { this.sendingReply.set(false); this.toast.error(err?.error?.message || 'Error al enviar'); },
    });
  }

  updateStatus() {
    if (!this.newStatus) return;
    this.updatingStatus.set(true);
    this.api.patch(`support/tickets/${this.selectedTicket()?.id}/status`, { status: this.newStatus }).subscribe({
      next: () => {
        this.selectedTicket.update(t => ({ ...t, status: this.newStatus }));
        this.tickets.update(list => list.map(t => t.id === this.selectedTicket()?.id ? { ...t, status: this.newStatus } : t));
        this.toast.success(`Estado actualizado a ${this.newStatus.replace('_', ' ')}`);
        this.updatingStatus.set(false);
        this.newStatus = '';
      },
      error: err => { this.updatingStatus.set(false); this.toast.error(err?.error?.message || 'Error al actualizar estado'); },
    });
  }

  updatePriority() {
    if (!this.newPriority) return;
    this.updatingStatus.set(true);
    this.api.patch(`support/tickets/${this.selectedTicket()?.id}/priority`, { priority: this.newPriority }).subscribe({
      next: () => {
        this.selectedTicket.update(t => ({ ...t, priority: this.newPriority }));
        this.tickets.update(list => list.map(t => t.id === this.selectedTicket()?.id ? { ...t, priority: this.newPriority } : t));
        this.toast.success(`Prioridad establecida a ${this.newPriority}`);
        this.updatingStatus.set(false);
        this.newPriority = '';
      },
      error: err => { this.updatingStatus.set(false); this.toast.error(err?.error?.message || 'Error al actualizar prioridad'); },
    });
  }

  analyzeWithAI() {
    this.analyzingAI.set(true);
    this.aiUnavailable.set(false);
    this.api.post<any>(`ai/analyze-ticket/${this.selectedTicket()?.id}`, {}).subscribe({
      next: result => {
        const parsed = { ...result, crossSellRecs: typeof result.crossSellRecs === 'string' ? JSON.parse(result.crossSellRecs) : result.crossSellRecs };
        this.aiAnalysis.set(parsed);
        this.analyzingAI.set(false);
        this.toast.success('Análisis de IA completado');
      },
      error: err => {
        this.analyzingAI.set(false);
        if (err.status === 503) { this.aiUnavailable.set(true); }
        else { this.toast.error(err?.error?.message || 'Error en el análisis de IA'); }
      },
    });
  }

  useSuggestedReply() {
    const reply = this.aiAnalysis()?.suggestedReply;
    if (reply) { this.replyText = reply; this.toast.info('Respuesta sugerida cargada — revísala antes de enviar'); }
  }

  getCanalIcon(channel: string) {
    const icons: Record<string, string> = {
      WEB: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a88.21,88.21,0,0,1-45.06-12.38,8,8,0,0,0-6.51-.9L40,216l13.28-36.51a8,8,0,0,0-.9-6.51A88,88,0,1,1,128,216ZM80,128a8,8,0,1,1,8,8A8,8,0,0,1,80,128Zm40,0a8,8,0,1,1,8,8A8,8,0,0,1,120,128Zm40,0a8,8,0,1,1,8,8A8,8,0,0,1,160,128Z"/></svg>`,
      EMAIL: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z"/></svg>`,
      WHATSAPP: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32a8,8,0,0,0-8.25-4.44A56.26,56.26,0,0,0,56,120a96,96,0,0,0,96,96,56.26,56.26,0,0,0,56-49.94A8,8,0,0,0,187.58,144.84ZM152,200a80.09,80.09,0,0,1-80-80,40.2,40.2,0,0,1,34.87-39.94l11.01,22L108.07,117a8,8,0,0,0-.73,7.29,56.77,56.77,0,0,0,24.36,24.36,8,8,0,0,0,7.29-.73l14.8-9.82,22,11.01A40.21,40.21,0,0,1,152,200Z"/></svg>`,
      PHONE: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.49l20.75-25.1.28-.3a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46Z"/></svg>`,
      TWITTER: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M214.75,211.71l-62.6-98.36,61.77-67.95a8,8,0,0,0-11.84-10.76L143.14,99.65,100.75,28.29A8,8,0,0,0,94,24H48a8,8,0,0,0-6.75,12.29l62.6,98.36L41.08,202.61a8,8,0,1,0,11.84,10.76l58.94-64.83L154,219.71A8,8,0,0,0,160,224H208a8,8,0,0,0,6.75-12.29Z"/></svg>`,
      '': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Z"/></svg>`,
    };
    return icons[channel] || icons[''];
  }
}
