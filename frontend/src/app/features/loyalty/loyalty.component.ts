import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
} from '../../shared/ui';

@Component({
  selector: 'app-loyalty',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe, BadgeComponent, ButtonComponent, CardComponent, EmptyStateComponent, LoadingStateComponent, PageHeaderComponent],
  template: `
    <div class="space-y-8 lg:space-y-10">
      <ui-page-header eyebrow="Programa de fidelización" title="Mis puntos"
        subtitle="Cada viaje completado suma puntos y te acerca al siguiente nivel de membresía." />

      @if (status()) {
        <!-- Saldo y nivel -->
        <section class="grid gap-5 lg:grid-cols-3">
          <div class="lg:col-span-2 rounded-2xl border border-slate-900/[0.06] bg-white p-5 shadow-card sm:p-8">
            <div class="flex flex-wrap items-center gap-2">
              <ui-badge tone="accent">Nivel {{ status()?.level | label }}</ui-badge>
              <ui-badge tone="neutral">{{ status()?.completedTrips }} {{ status()?.completedTrips === 1 ? 'viaje completado' : 'viajes completados' }}</ui-badge>
            </div>

            <div class="mt-6 grid gap-6 sm:grid-cols-2 sm:items-end">
              <div>
                @if (firstName()) {
                  <h2 class="text-[28px] leading-9 font-bold tracking-tight text-primary-700">Hola, {{ firstName() }}</h2>
                }
                <p class="mt-1 text-[15px] text-slate-500">Usa tus puntos como descuento en tu próximo paquete.</p>
              </div>
              <!-- Lo que el cliente puede usar va primero y grande; el total histórico, chico (no se canjea). -->
              <div class="rounded-2xl bg-primary-50 p-5">
                <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Disponibles para canjear</p>
                <p class="mt-1 flex items-baseline gap-2">
                  <span class="text-5xl font-extrabold tracking-tight text-primary-700 tabular-nums">{{ status()?.availablePoints | number }}</span>
                  <span class="text-lg font-bold text-success-700">pts</span>
                </p>
                <p class="mt-1 text-xs text-slate-500">{{ status()?.totalPoints | number }} acumulados en total (histórico)</p>
              </div>
            </div>

            <div class="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="font-semibold text-primary-700">Equivalen a un descuento de</p>
                <p class="text-xs text-slate-500">Más {{ status()?.currentDiscount }}% adicional por tu nivel al canjear</p>
              </div>
              <p class="text-2xl font-extrabold text-accent-700 tabular-nums">S/. {{ status()?.availablePointsValue | number:'1.2-2' }}</p>
            </div>

            <div class="mt-6 flex flex-wrap gap-3">
              <a routerLink="/explore" uiButton size="lg">Usar mis puntos en un viaje</a>
              <a routerLink="/my-trips" uiButton variant="secondary" size="lg">Ver mis viajes</a>
            </div>
          </div>

          <div class="flex flex-col gap-5">
            <!-- Reglas del canje -->
            <div class="rounded-2xl bg-primary-700 p-6 text-white shadow-raised">
              <p class="text-[11px] font-bold uppercase tracking-wider text-primary-200">Reglas del canje</p>
              <dl class="mt-4 space-y-3 text-sm">
                <div class="flex items-center justify-between gap-3 rounded-xl bg-white/[0.06] px-4 py-3">
                  <dt class="text-primary-100">Mínimo para canjear</dt>
                  <dd class="font-bold tabular-nums">{{ status()?.minRedeemPoints }} pts</dd>
                </div>
                <div class="flex items-center justify-between gap-3 rounded-xl bg-white/[0.06] px-4 py-3">
                  <dt class="text-primary-100">Adicional por tu nivel</dt>
                  <dd class="font-bold tabular-nums">{{ status()?.currentDiscount }}%</dd>
                </div>
                <div class="flex items-center justify-between gap-3 rounded-xl bg-white/[0.06] px-4 py-3">
                  <dt class="text-primary-100">Tope por paquete</dt>
                  <dd class="font-bold tabular-nums">{{ status()?.maxRedeemPercent }}%</dd>
                </div>
              </dl>
            </div>

            <!-- Progreso al siguiente nivel -->
            <div class="flex-1 rounded-2xl border border-slate-900/[0.06] bg-white p-6 shadow-card">
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Próximo nivel</p>
              @if (status()?.nextLevel) {
                <p class="mt-2 text-sm text-slate-600">
                  Te faltan <strong class="text-primary-700">{{ status()?.nextLevel?.tripsNeeded }} viajes</strong>
                  para ser <strong class="text-primary-700">{{ status()?.nextLevel?.levelLabel }}</strong>
                  y obtener <strong class="text-accent-700">{{ status()?.nextLevel?.discount }}%</strong> adicional al canjear.
                </p>
                <div class="mt-4 h-2.5 overflow-hidden rounded-full bg-primary-50" role="progressbar"
                  [attr.aria-valuenow]="progress()" aria-valuemin="0" aria-valuemax="100" aria-label="Avance al siguiente nivel">
                  <div class="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-600 transition-all" [style.width.%]="progress()"></div>
                </div>
              } @else {
                <p class="mt-2 font-semibold text-primary-700">🏆 Estás en el nivel más alto</p>
              }
            </div>
          </div>
        </section>

        <!-- Niveles -->
        <section>
          <p class="text-[11px] font-bold uppercase tracking-wider text-accent-700">Niveles del programa</p>
          <h2 class="mt-1 text-2xl font-bold tracking-tight text-primary-700">Niveles por viajes completados</h2>
          <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            @for (level of status()?.levels; track level.level; let i = $index; let last = $last) {
              <div class="relative flex flex-col rounded-2xl border bg-white p-5 shadow-card"
                [ngClass]="level.level === status()?.level ? 'border-2 border-accent-500 shadow-raised' : 'border-slate-900/[0.06]'">
                @if (level.level === status()?.level) {
                  <span class="absolute -top-3 right-4 rounded-full bg-accent-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Tu nivel</span>
                }
                <div class="flex items-center justify-between">
                  <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-xl" aria-hidden="true">
                    {{ level.level === 'EXPLORADOR' ? '🌱' : level.level === 'VIAJERO' ? '✈️' : level.level === 'FRECUENTE' ? '⭐' : '👑' }}
                  </span>
                  <ui-badge tone="neutral" [caps]="true">
                    {{ last ? (level.minTrips + '+ viajes') : (level.minTrips + '–' + ((status()!.levels[i + 1].minTrips) - 1) + ' viajes') }}
                  </ui-badge>
                </div>
                <p class="mt-4 text-lg font-bold text-primary-700">{{ level.levelLabel }}</p>
                <p class="mt-1 text-sm text-slate-500">
                  <strong class="text-accent-700">+{{ level.discount }}%</strong> adicional al canjear puntos
                </p>
                <p class="mt-auto pt-4 text-xs font-semibold">
                  @if (level.level === status()?.level) {
                    <span class="text-accent-700">Nivel actual</span>
                  } @else if (level.reached) {
                    <span class="text-success-700">✓ Alcanzado</span>
                  } @else {
                    <span class="text-slate-400">🔒 Por desbloquear</span>
                  }
                </p>
              </div>
            }
          </div>
        </section>

        <!-- Cómo funciona -->
        <ui-card title="¿Cómo funciona?">
          <ul class="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <li>📌 Por cada S/.100 gastados en un viaje ganas <strong>1 punto</strong></li>
            <li>💰 <strong>100 puntos = S/.10</strong> de descuento en tu próxima compra</li>
            <li>🎯 Canje mínimo: <strong>500 puntos</strong> (= S/.50)</li>
            <li>📈 Tu nivel sube según la cantidad de <strong>viajes completados</strong></li>
            <li>🎁 Tu nivel te da un porcentaje adicional sobre el descuento al canjear</li>
          </ul>
        </ui-card>

        <!-- Historial de puntos -->
        <section>
          <p class="text-[11px] font-bold uppercase tracking-wider text-accent-700">Movimientos</p>
          <h2 class="mt-1 text-2xl font-bold tracking-tight text-primary-700">Historial de puntos</h2>
          <div class="mt-5 overflow-hidden rounded-2xl border border-slate-900/[0.06] bg-white shadow-card">
            @if (history().length > 0) {
              <ul class="divide-y divide-slate-100">
                @for (item of history(); track item.id) {
                  <li class="flex items-center gap-4 px-4 py-4 sm:px-6">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                      [class.bg-success-50]="isGain(item)" [class.bg-accent-50]="!isGain(item)" aria-hidden="true">
                      {{ isGain(item) ? '⛰️' : '🎟️' }}
                    </span>
                    <div class="min-w-0 flex-1">
                      <p class="font-semibold text-primary-700">{{ item.description }}</p>
                      <p class="text-xs text-slate-500">
                        {{ item.createdAt | date:'dd MMM yyyy' }}
                        @if (item.bookingId) { · Ref. reserva {{ item.bookingId }} }
                      </p>
                    </div>
                    <span class="shrink-0 rounded-full px-3 py-1 text-sm font-bold tabular-nums"
                      [class.bg-success-50]="isGain(item)" [class.text-success-700]="isGain(item)"
                      [class.bg-red-50]="!isGain(item)" [class.text-red-700]="!isGain(item)">
                      {{ isGain(item) ? '+' : '' }}{{ item.points }} pts
                    </span>
                  </li>
                }
              </ul>
            } @else {
              <ui-empty-state icon="🧭" title="Aún no tienes movimientos"
                message="Tus puntos aparecerán al confirmar tu primer viaje." />
            }
          </div>
        </section>
      } @else {
        <ui-loading text="Cargando tus puntos..." />
      }
    </div>
  `,
})
export class LoyaltyComponent implements OnInit {
  status = signal<any>(null);
  history = signal<any[]>([]);
  private readonly auth = inject(AuthService);
  readonly firstName = computed(() => this.auth.currentUser()?.firstName ?? '');

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any>('loyalty/status').subscribe(data => this.status.set(data));
    this.api.get<any[]>('loyalty/history').subscribe(data => this.history.set(data));
  }

  /** Movimientos que suman puntos (ganados o devueltos por una cancelación). */
  isGain(item: { type: string }): boolean {
    return item.type === 'EARNED' || item.type === 'REDEEMED_REFUND';
  }

  progress(): number {
    // El avance lo calcula el motor de fidelización del backend (AGENTS.md B7).
    return this.status()?.nextLevel?.progressPercent ?? 100;
  }
}
