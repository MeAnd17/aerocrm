import { Component, computed, inject, signal } from '@angular/core';
import { apiErrorMessage } from '../../../core/services/api-error';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PackageBuilderState } from '../package-builder.state';
import { AuthService } from '../../../core/services/auth.service';

/** Paso 6 · Resumen, canje de puntos y confirmación. */
@Component({
  selector: 'app-step-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border shadow-sm p-5 space-y-3">
      <h3 class="font-semibold text-gray-800">📋 Resumen del paquete</h3>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between"><span>✈️ Vuelo ({{ state.passengers() }} pax)</span><span class="font-semibold">S/. {{ state.flightTotal() | number:'1.2-2' }}</span></div>
        @if (state.hotel()) {
          <div class="flex justify-between"><span>🏨 {{ state.hotel()?.name }} ({{ state.hotelNights() }} noches)</span><span class="font-semibold">S/. {{ state.hotelTotal() | number:'1.2-2' }}</span></div>
        }
        @for (act of state.activities(); track act.id) {
          <div class="flex justify-between"><span>🎯 {{ act.name }}</span><span class="font-semibold">S/. {{ act.price }}</span></div>
        }
        @for (extra of state.extras(); track extra.type) {
          <div class="flex justify-between"><span>➕ {{ extra.label }}</span><span class="font-semibold">S/. {{ extra.price }}</span></div>
        }
        <div class="border-t pt-2 flex justify-between font-bold text-base">
          <span>Total</span><span class="text-blue-900">S/. {{ state.totalPrice() | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Puntos a canjear -->
      @if (state.loyalty()?.canRedeem) {
        <div class="bg-blue-50 rounded-lg p-3">
          <p class="text-sm font-medium text-blue-800 mb-2">
            Tienes {{ state.loyalty()?.availablePoints }} puntos (S/. {{ state.loyalty()?.availablePointsValue }} de descuento)
          </p>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" [ngModel]="state.usePoints()" (ngModelChange)="onUsePointsChange($event)" class="rounded" />
            Canjear {{ state.loyalty()?.availablePoints }} puntos
            @if (state.redemption()) { y ahorrar S/. {{ state.pointsDiscount() | number:'1.2-2' }} }
          </label>
        </div>
      }

      @if (error()) {
        <p class="text-red-600 text-sm">{{ error() }}</p>
      }

      @if (!isLoggedIn()) {
        <p class="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          Tu paquete queda guardado. Inicia sesión o crea tu cuenta para confirmarlo; al volver lo encontrarás tal cual.
        </p>
        <button (click)="goToLogin()"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-lg transition">
          Inicia sesión para confirmar
        </button>
      } @else {
      <button (click)="confirmBooking()" [disabled]="loading()"
        class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-lg transition disabled:opacity-50">
        {{ loading() ? 'Confirmando...' : '✅ Confirmar y pagar S/. ' + (state.usePoints() ? (state.totalPrice() - state.pointsDiscount()) : state.totalPrice() | number:'1.2-2') }}
      </button>
      }
    </div>
  `,
})
export class StepSummaryComponent {
  readonly state = inject(PackageBuilderState);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly isLoggedIn = computed(() => this.auth.currentUser() !== null);

  readonly loading = signal(false);
  readonly error = signal('');

  onUsePointsChange(value: boolean) {
    this.state.usePoints.set(value);
    this.state.redemption.set(null);
    if (!value) return;
    this.api.post<any>('loyalty/redemption-preview', {
      packageTotal: this.state.totalPrice().toFixed(2),
      pointsToRedeem: this.state.loyalty()?.availablePoints ?? 0,
    }).subscribe({ next: (r) => this.state.redemption.set(r) });
  }

  /** El visitante inicia sesión y vuelve al resumen; el paquete pasa a ser suyo. */
  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/packages/new' } });
  }

  confirmBooking() {
    const s = this.state;
    this.loading.set(true);
    this.error.set('');
    const body: any = {
      passengers: s.passengers(),
      pointsToRedeem: s.usePoints() ? (s.loyalty()?.availablePoints ?? 0) : 0,
      flights: [{ flightId: s.flightId(), priceSnapshot: s.flight()?.pricePerPerson ?? 0 }],
      hotels: s.hotel() && s.hotelCheckIn() && s.hotelCheckOut() ? [{
        hotelId: s.hotel().id,
        checkIn: s.hotelCheckIn(), checkOut: s.hotelCheckOut(),
        nights: s.hotelNights(), priceSnapshot: s.hotelTotal(),
      }] : [],
      activities: s.activities().map((a) => ({ activityId: a.id, quantity: 1, priceSnapshot: Number(a.price) })),
      extras: s.extras().map((e) => ({ type: e.type, price: e.price })),
    };
    this.api.post<any>('bookings', body).subscribe({
      next: (booking) => {
        s.reset();
        this.router.navigate(['/my-trips', booking.id]);
      },
      error: (err) => { this.error.set(apiErrorMessage(err, 'No pudimos confirmar la compra')); this.loading.set(false); },
    });
  }
}
