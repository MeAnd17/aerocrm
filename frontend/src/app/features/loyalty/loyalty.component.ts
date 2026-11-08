import { Component, OnInit, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-loyalty',
  standalone: true,
  imports: [CommonModule, LabelPipe],
  template: `
    <div class="space-y-5">
      <h1 class="text-2xl font-bold text-gray-800">Programa de fidelización</h1>

      @if (status()) {
        <!-- Nivel actual -->
        <div class="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white">
          <p class="text-blue-200 text-sm mb-1">Tu nivel actual</p>
          <h2 class="text-3xl font-bold">{{ status()?.level | label }}</h2>

          <!-- Lo que el cliente puede usar va primero y grande; el total histórico, chico (no se canjea). -->
          <div class="mt-4 rounded-xl bg-white/10 p-4 text-center">
            <p class="text-blue-100 text-sm">Disponibles para canjear</p>
            <p class="text-4xl font-bold mt-1">{{ status()?.availablePoints | number }}</p>
            <p class="text-blue-100 text-sm">equivalen a S/. {{ status()?.availablePointsValue | number:'1.2-2' }}</p>
            <p class="text-blue-200 text-xs mt-2">{{ status()?.totalPoints | number }} acumulados en total (histórico)</p>
          </div>

          <div class="grid grid-cols-3 gap-3 mt-4 text-center">
            <div>
              <p class="text-xl font-bold">{{ status()?.completedTrips }}</p>
              <p class="text-blue-200 text-xs">viajes completados</p>
            </div>
            <div>
              <p class="text-xl font-bold">{{ status()?.currentDiscount }}%</p>
              <p class="text-blue-200 text-xs">adicional al canjear</p>
            </div>
            <div>
              <p class="text-xl font-bold">{{ status()?.minRedeemPoints }}</p>
              <p class="text-blue-200 text-xs">puntos mínimos para canjear</p>
            </div>
          </div>
          <p class="text-blue-200 text-xs mt-3 text-center">Con puntos puedes pagar hasta el {{ status()?.maxRedeemPercent }} % de un paquete.</p>
        </div>

        <!-- Progreso al siguiente nivel -->
        @if (status()?.nextLevel) {
          <div class="bg-white rounded-xl border shadow-sm p-5">
            <p class="text-sm text-gray-600 mb-2">
              Te faltan <strong>{{ status()?.nextLevel?.tripsNeeded }} viajes</strong>
              para ser <strong>{{ status()?.nextLevel?.levelLabel }}</strong>
              y obtener {{ status()?.nextLevel?.discount }}% de descuento al canjear
            </p>
            <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-blue-500 rounded-full transition-all" [style.width.%]="progress()"></div>
            </div>
          </div>
        } @else {
          <div class="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
            <p class="text-purple-800 font-semibold">🏆 Estás en el nivel más alto</p>
          </div>
        }

        <!-- Niveles -->
        <div class="bg-white rounded-xl border shadow-sm p-5">
          <h2 class="font-semibold text-gray-800 mb-4">Todos los niveles</h2>
          <div class="space-y-3">
            @for (level of status()?.levels; track level.level; let i = $index; let last = $last) {
              <div class="flex items-center gap-3 p-3 rounded-lg"
                [class.bg-blue-50]="level.level === status()?.level"
                [class.border]="level.level === status()?.level"
                [class.border-blue-200]="level.level === status()?.level"
                [class.ring-2]="level.level === status()?.level"
                [class.ring-blue-300]="level.level === status()?.level">
                <span class="text-xl">
                  {{ level.level === 'EXPLORADOR' ? '🌱' : level.level === 'VIAJERO' ? '✈️' : level.level === 'FRECUENTE' ? '⭐' : '👑' }}
                </span>
                <div class="flex-1">
                  <p class="font-medium text-gray-800">{{ level.levelLabel }}</p>
                  <p class="text-xs text-gray-500">
                    {{ last ? (level.minTrips + '+ viajes') : (level.minTrips + '–' + ((status()!.levels[i + 1].minTrips) - 1) + ' viajes') }}
                  </p>
                </div>
                <span class="text-sm font-semibold text-blue-700">+{{ level.discount }}%</span>
                @if (level.level === status()?.level) {
                  <span class="text-blue-600 text-xs font-semibold">Actual</span>
                } @else if (level.reached) {
                  <span class="text-green-500 text-xs">✓ Alcanzado</span>
                }
              </div>
            }
          </div>
        </div>

        <!-- Cómo funciona -->
        <div class="bg-white rounded-xl border shadow-sm p-5">
          <h2 class="font-semibold text-gray-800 mb-3">¿Cómo funciona?</h2>
          <ul class="space-y-2 text-sm text-gray-600">
            <li>📌 Por cada S/.100 gastados en un viaje ganas <strong>1 punto</strong></li>
            <li>💰 <strong>100 puntos = S/.10</strong> de descuento en tu próxima compra</li>
            <li>🎯 Canje mínimo: <strong>500 puntos</strong> (= S/.50)</li>
            <li>📈 Tu nivel sube según la cantidad de <strong>viajes completados</strong></li>
            <li>🎁 Tu nivel te da un porcentaje adicional sobre el descuento al canjear</li>
          </ul>
        </div>

        <!-- Historial de puntos -->
        @if (history().length > 0) {
          <div class="bg-white rounded-xl border shadow-sm p-5">
            <h2 class="font-semibold text-gray-800 mb-3">Historial de puntos</h2>
            <div class="space-y-2">
              @for (item of history(); track item.id) {
                <div class="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p class="text-sm text-gray-700">{{ item.description }}</p>
                    @if (item.bookingId) {
                      <p class="text-xs text-blue-500">Ref. reserva: {{ item.bookingId }}</p>
                    }
                    <p class="text-xs text-gray-400">{{ item.createdAt | date:'dd/MM/yyyy' }}</p>
                  </div>
                  <span class="font-semibold text-sm"
                    [class.text-green-600]="item.type === 'EARNED' || item.type === 'REDEEMED_REFUND'"
                    [class.text-red-500]="item.type === 'REDEEMED' || item.type === 'EARNED_REFUND'">
                    {{ (item.type === 'EARNED' || item.type === 'REDEEMED_REFUND') ? '+' : '' }}{{ item.points }} pts
                  </span>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="bg-white rounded-xl border shadow-sm p-5">
            <h2 class="font-semibold text-gray-800 mb-3">Historial de puntos</h2>
            <p class="text-sm text-gray-500 text-center py-4">
              Aún no tienes movimientos. Tus puntos aparecerán al confirmar tu primer viaje
            </p>
          </div>
        }
      }
    </div>
  `,
})
export class LoyaltyComponent implements OnInit {
  status = signal<any>(null);
  history = signal<any[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any>('loyalty/status').subscribe(data => this.status.set(data));
    this.api.get<any[]>('loyalty/history').subscribe(data => this.history.set(data));
  }

  progress(): number {
    // El avance lo calcula el motor de fidelización del backend (AGENTS.md B7).
    return this.status()?.nextLevel?.progressPercent ?? 100;
  }
}
