import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PackageBuilderState } from '../package-builder.state';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';


/**
 * Paso 7 · Resumen del paquete (US-016, US-020).
 *
 * Llama a POST /api/bookings/quote al entrar para obtener el desglose oficial
 * del servidor (AGENTS.md B6). No calcula ningún precio en pantalla.
 *
 * Detecta cambios de precio comparando el total de la cotización con el total
 * local previo (state.totalPrice). Si difieren, avisa al usuario.
 *
 * Cuando el usuario está autenticado y tiene al menos 500 puntos, muestra el
 * selector de canje (US-020). Al aplicar, re-cotiza con los puntos elegidos
 * para obtener el descuento actualizado (puntos + bono de nivel) del servidor.
 *
 * El botón "Continuar al pago" requiere sesión. Si el usuario no está autenticado,
 * se muestra un aviso con botones de registro e inicio de sesión; el resumen
 * sigue siendo visible.
 * La creación de la reserva ocurre en el paso siguiente (StepPaymentComponent).
 */
@Component({
  selector: 'app-step-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border shadow-sm p-5 space-y-4">
      <h3 class="font-semibold text-gray-800 text-lg">📋 Resumen del paquete</h3>

      <!-- Estado de carga de la cotización -->
      @if (loadingQuote()) {
        <p class="text-sm text-gray-500 text-center py-4">Calculando precios…</p>
      }

      @if (quoteError()) {
        <p class="text-sm text-red-600 bg-red-50 rounded-lg p-3">{{ quoteError() }}</p>
      }

      <!-- Desglose de precios (solo cuando hay cotización del servidor) -->
      @if (quote(); as q) {
        <!-- Aviso de precio actualizado -->
        @if (priceChanged()) {
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p class="text-sm font-semibold text-amber-800">⚠️ El precio de tu paquete se actualizó</p>
            <p class="text-sm text-amber-700 mt-1">
              El nuevo total es
              <span class="font-bold">S/. {{ q.breakdown.total | number:'1.2-2' }}</span>.
            </p>
          </div>
        }

        <div class="space-y-2 text-sm">
          <!-- Vuelo de ida -->
          <div class="flex justify-between">
            <span>
              ✈️ Vuelo de ida
              <span class="text-gray-500">({{ q.breakdown.outboundFlight.flightNumber }})</span>
              × {{ state.passengers() }} pax
            </span>
            <span class="font-semibold">S/. {{ q.breakdown.outboundFlight.lineTotal | number:'1.2-2' }}</span>
          </div>

          <!-- Vuelo de regreso (si existe) -->
          @if (q.breakdown.returnFlight) {
            <div class="flex justify-between">
              <span>
                🔁 Vuelo de regreso
                <span class="text-gray-500">({{ q.breakdown.returnFlight.flightNumber }})</span>
                × {{ state.passengers() }} pax
              </span>
              <span class="font-semibold">S/. {{ q.breakdown.returnFlight.lineTotal | number:'1.2-2' }}</span>
            </div>
          }

          <!-- Hotel -->
          @if (q.breakdown.hotel) {
            <div class="flex justify-between">
              <span>🏨 {{ q.breakdown.hotel.name }} ({{ q.breakdown.hotel.nights }} noches)</span>
              <span class="font-semibold">S/. {{ q.breakdown.hotel.lineTotal | number:'1.2-2' }}</span>
            </div>
          }

          <!-- Actividades -->
          @for (act of q.breakdown.activities; track act.id) {
            <div class="flex justify-between">
              <span>🎯 {{ act.name }} (× {{ act.quantity }})</span>
              <span class="font-semibold">S/. {{ act.lineTotal | number:'1.2-2' }}</span>
            </div>
          }

          <!-- Extras -->
          @for (extra of q.breakdown.extras; track extra.id) {
            <div class="flex justify-between">
              <span>➕ {{ extra.name }}</span>
              <span class="font-semibold">S/. {{ extra.lineTotal | number:'1.2-2' }}</span>
            </div>
          }

          <!-- Separador y subtotal -->
          <div class="border-t pt-2 flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>S/. {{ q.breakdown.subtotal | number:'1.2-2' }}</span>
          </div>

          <!-- Descuento por puntos (solo si hay canje) -->
          @if (q.breakdown.pointsDiscountAmount > 0) {
            <div class="flex justify-between text-green-700">
              <span>Canje de {{ q.pointsToRedeem }} puntos</span>
              <span>− S/. {{ q.breakdown.pointsDiscountAmount | number:'1.2-2' }}</span>
            </div>
          }

          <!-- Descuento adicional por nivel (solo si hay bono) -->
          @if (q.breakdown.levelDiscountAmount > 0) {
            <div class="flex justify-between text-green-700">
              <span>Bono nivel {{ state.loyalty()?.levelLabel }} ({{ state.loyalty()?.currentDiscount }}%)</span>
              <span>− S/. {{ q.breakdown.levelDiscountAmount | number:'1.2-2' }}</span>
            </div>
          }

          <!-- Total -->
          <div class="border-t pt-2 flex justify-between font-bold text-base">
            <span>Total</span>
            <span class="text-blue-900">S/. {{ q.breakdown.total | number:'1.2-2' }}</span>
          </div>

          <!-- Puntos que se ganarán -->
          @if (q.pointsToEarn > 0) {
            <div class="text-right text-xs text-blue-600">
              Ganarás <strong>{{ q.pointsToEarn }} puntos</strong> con esta compra
            </div>
          }
        </div>

        <!-- Canje de puntos (US-020): solo cuando está autenticado y tiene al menos 500 pts -->
        @if (isLoggedIn() && state.loyalty()?.canRedeem) {
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-blue-800">💎 Canjear puntos</p>
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  [ngModel]="canjeActivo()"
                  (ngModelChange)="toggleCanje($event)"
                  class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
                />
                <span class="text-xs text-blue-700 font-medium">Usar puntos</span>
              </label>
            </div>

            <p class="text-xs text-blue-600">
              Tienes <strong>{{ state.loyalty().availablePoints }}</strong> puntos
              · En esta compra puedes usar hasta <strong>{{ maxPuntosCanjeables() }}</strong>
            </p>

            @if (state.loyalty().currentDiscount > 0) {
              <p class="text-xs text-blue-600">
                Tu nivel <strong>{{ state.loyalty().levelLabel }}</strong>
                añade un {{ state.loyalty().currentDiscount }}% de descuento adicional al canjear.
              </p>
            }

            @if (canjeActivo()) {
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  [(ngModel)]="puntosIngresados"
                  min="500"
                  [max]="maxPuntosCanjeables()"
                  step="100"
                  placeholder="Puntos a canjear (min. 500)"
                  class="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  (click)="aplicarCanje()"
                  [disabled]="loadingQuote()"
                  class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  Aplicar
                </button>
              </div>
            }

            @if (state.pointsToRedeem() > 0) {
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500">
                  Quedarán {{ state.loyalty().availablePoints - q.pointsToRedeem }} puntos tras el canje
                </span>
                <button
                  type="button"
                  (click)="quitarCanje()"
                  class="text-red-600 hover:text-red-800 font-medium transition"
                >
                  Quitar canje
                </button>
              </div>
            }
          </div>
        } @else if (isLoggedIn() && state.loyalty() && !state.loyalty().canRedeem) {
          <p class="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            Necesitas al menos 500 puntos para canjear.
            Tienes {{ state.loyalty().availablePoints }}.
          </p>
        }

        <!-- Pasajeros -->
        <div class="bg-gray-50 rounded-lg p-3 space-y-1">
          <p class="text-sm font-semibold text-gray-700">👥 Pasajeros</p>
          @if (state.passengerDrafts().length > 0) {
            @for (p of state.passengerDrafts(); track p.documentNumber; let pi = $index) {
              <p class="text-sm text-gray-600">
                {{ pi + 1 }}. {{ p.firstName }} {{ p.lastName }}
                <span class="text-gray-400 text-xs">· {{ p.documentType === 'PASAPORTE' ? 'Pasaporte' : 'DNI' }} {{ p.documentNumber }}</span>
                @if (pi === 0) { <span class="text-blue-600 text-xs">(titular)</span> }
              </p>
            }
          } @else if (state.passengers() > 0) {
            <p class="text-sm text-gray-600">
              {{ state.passengers() }} pasajero{{ state.passengers() !== 1 ? 's' : '' }}
              seleccionado{{ state.passengers() !== 1 ? 's' : '' }}
            </p>
          } @else {
            <p class="text-sm text-gray-500 italic">
              Los datos de cada pasajero se agregarán en el siguiente paso.
            </p>
          }
        </div>

        <!-- Bloque de sesión o botón continuar -->
        @if (!isLoggedIn()) {
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <p class="text-sm font-semibold text-blue-800">
              Crea tu cuenta o inicia sesión para confirmar tu viaje
            </p>
            <div class="flex gap-3 flex-wrap">
              <button (click)="goToRegister()"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold text-sm transition">
                Registrarme
              </button>
              <button (click)="goToLogin()"
                class="flex-1 bg-white hover:bg-gray-50 text-blue-700 border border-blue-300 py-2 px-4 rounded-lg font-semibold text-sm transition">
                Iniciar sesión
              </button>
            </div>
          </div>
        } @else {
          <div class="space-y-2">
            <button (click)="irAlPago()"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-lg transition">
              Continuar al pago →
            </button>
            <button (click)="state.goTo(6)"
              class="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition">
              ← Volver a pasajeros
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class StepSummaryComponent implements OnInit {
  readonly state = inject(PackageBuilderState);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  /** Cotización devuelta por el servidor. */
  readonly quote = signal<any>(null);
  readonly loadingQuote = signal(false);
  readonly quoteError = signal('');

  /** Indica si el total del servidor difiere del total local previo. */
  readonly priceChanged = signal(false);

  readonly isLoggedIn = computed(() => this.auth.currentUser() !== null);

  /** Interruptor de canje: comienza apagado (US-020). */
  readonly canjeActivo = signal(false);

  /** Puntos máximos canjeables: calculado en el servidor incluyendo el bono de nivel (B7, US-020). */
  readonly maxPuntosCanjeables = computed(() => this.quote()?.maxRedeemablePoints ?? 0);

  /** Puntos ingresados por el usuario en el campo de canje (US-020). */
  puntosIngresados = 0;

  ngOnInit() {
    this._fetchQuote();
  }

  /** Solicita la cotización al servidor y detecta cambios de precio. */
  private _fetchQuote() {
    const s = this.state;
    if (!s.flightId()) return;

    // Total local antes de pedir al servidor: sirve para detectar cambios.
    const localTotal = s.totalPrice();

    this.loadingQuote.set(true);
    this.quoteError.set('');
    this.priceChanged.set(false);

    const body: Record<string, unknown> = {
      flightId: s.flightId(),
      passengers: s.passengers(),
    };
    if (s.returnFlightId()) body['returnFlightId'] = s.returnFlightId();
    if (s.hotelId()) {
      body['hotelId'] = s.hotelId();
      body['checkIn'] = s.hotelCheckIn();
      body['checkOut'] = s.hotelCheckOut();
    }
    if (s.activitySelections().length > 0) {
      body['activities'] = s.activitySelections().map(sel => ({
        activityId: sel.activityId,
        quantity: sel.quantity,
      }));
    }
    const extraIds = s.extras().map(e => e.id).filter(Boolean);
    if (extraIds.length > 0) body['extras'] = extraIds;
    // Incluir puntos a canjear cuando el usuario los eligió (US-020).
    if (s.pointsToRedeem() > 0) body['pointsToRedeem'] = s.pointsToRedeem();

    this.api.post<any>('bookings/quote', body).subscribe({
      next: (response) => {
        this.quote.set(response);
        this.loadingQuote.set(false);
        // Detectar cambio: comparar total del servidor con el total local previo.
        // Se usa una tolerancia de 1 céntimo para evitar falsos positivos por redondeo.
        const serverTotal = Number(response.breakdown.total);
        if (Math.abs(serverTotal - localTotal) > 0.01) {
          this.priceChanged.set(true);
          this.toast.warning('El precio de tu paquete se actualizó');
        }
      },
      error: (err) => {
        this.quoteError.set(apiErrorMessage(err, 'No se pudo calcular el precio del paquete'));
        this.loadingQuote.set(false);
      },
    });
  }

  /** Activa o desactiva el toggle de canje; al desactivar quita los puntos (US-020). */
  toggleCanje(activo: boolean) {
    this.canjeActivo.set(activo);
    if (!activo) {
      this.state.pointsToRedeem.set(0);
      this.puntosIngresados = 0;
      this._fetchQuote();
    }
  }

  /** Aplica el canje ingresado: actualiza el state y vuelve a cotizar (US-020). */
  aplicarCanje() {
    const puntos = Math.floor(this.puntosIngresados ?? 0);
    this.state.pointsToRedeem.set(puntos > 0 ? puntos : 0);
    this._fetchQuote();
  }

  /** Quita el canje activo y vuelve a cotizar sin puntos (US-020). */
  quitarCanje() {
    this.canjeActivo.set(false);
    this.state.pointsToRedeem.set(0);
    this.puntosIngresados = 0;
    this._fetchQuote();
  }

  /** Navega a /register con returnUrl al resumen. */
  goToRegister() {
    this.router.navigate(['/register'], { queryParams: { returnUrl: '/packages/new' } });
  }

  /** Navega a /login con returnUrl al resumen. */
  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/packages/new' } });
  }

  /** Avanza al paso de pago (paso 8). La creación de la reserva ocurre allí. */
  irAlPago() {
    this.state.goTo(8);
  }
}
