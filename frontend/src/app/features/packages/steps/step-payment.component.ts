import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { PackageBuilderState } from '../package-builder.state';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';

/** Métodos de pago simulados aceptados por PayBookingDto. */
type MetodoPago = 'TARJETA' | 'TRANSFERENCIA' | 'BILLETERA_DIGITAL';

/**
 * Paso 8 · Pago simulado del paquete (US-016).
 *
 * Muestra un selector de método de pago y, si se elige tarjeta, un formulario
 * de datos de tarjeta puramente decorativo: esos datos NUNCA se envían al backend.
 *
 * Al confirmar:
 *  1. Llama POST /bookings con todo el paquete armado en el state (crea y confirma la reserva).
 *  2. Navega a /my-trips/:id y muestra el código de confirmación.
 */
@Component({
  selector: 'app-step-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border shadow-sm p-5 space-y-5">
      <h3 class="font-semibold text-gray-800 text-lg">💳 Pago</h3>

      <!-- Aviso de demostración -->
      <div class="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
        <span class="text-amber-500 text-lg leading-none mt-0.5">⚠️</span>
        <p class="text-sm font-semibold text-amber-800">
          Pago de demostración — no se realiza ningún cargo real
        </p>
      </div>

      <!-- Selector de método de pago -->
      <div class="space-y-2">
        <p class="text-sm font-medium text-gray-700">Método de pago</p>

        @for (opcion of opcionesPago; track opcion.valor) {
          <label class="flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition"
            [class.border-blue-500]="metodoPago() === opcion.valor"
            [class.bg-blue-50]="metodoPago() === opcion.valor"
            [class.border-gray-200]="metodoPago() !== opcion.valor">
            <input type="radio" name="metodoPago"
              [value]="opcion.valor"
              [checked]="metodoPago() === opcion.valor"
              (change)="metodoPago.set(opcion.valor)"
              class="accent-blue-600">
            <span class="text-sm font-medium text-gray-700">{{ opcion.etiqueta }}</span>
          </label>
        }
      </div>

      <!-- Formulario de tarjeta (solo decorativo, nunca enviado al backend) -->
      @if (metodoPago() === 'TARJETA') {
        <div class="space-y-3 border border-gray-200 rounded-lg p-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos de tarjeta</p>

          <div class="space-y-1">
            <label class="text-sm text-gray-600" for="nro-tarjeta">Número de tarjeta</label>
            <input id="nro-tarjeta" type="text"
              [(ngModel)]="nroTarjeta"
              placeholder="XXXX XXXX XXXX XXXX"
              maxlength="19"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <div class="flex gap-3">
            <div class="flex-1 space-y-1">
              <label class="text-sm text-gray-600" for="vencimiento">Vencimiento (MM/AA)</label>
              <input id="vencimiento" type="text"
                [(ngModel)]="vencimiento"
                placeholder="MM/AA"
                maxlength="5"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            </div>
            <div class="w-24 space-y-1">
              <label class="text-sm text-gray-600" for="cvv">CVV</label>
              <input id="cvv" type="text"
                [(ngModel)]="cvv"
                placeholder="123"
                maxlength="3"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            </div>
          </div>

          <p class="text-xs text-gray-400">
            Estos datos son solo de demostración y no se transmiten a ningún servidor.
          </p>
        </div>
      }

      <!-- Error -->
      @if (errorPago()) {
        <p class="text-sm text-red-600 bg-red-50 rounded-lg p-3">{{ errorPago() }}</p>
      }

      <!-- Botones -->
      <div class="flex gap-3">
        <button (click)="volver()"
          class="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
          ← Volver al resumen
        </button>
        <button (click)="confirmarPago()" [disabled]="cargando()"
          class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-base transition disabled:opacity-50">
          @if (cargando()) {
            Procesando…
          } @else {
            Confirmar y pagar
          }
        </button>
      </div>
    </div>
  `,
})
export class StepPaymentComponent {
  readonly state = inject(PackageBuilderState);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly metodoPago = signal<MetodoPago>('TARJETA');
  readonly cargando = signal(false);
  readonly errorPago = signal('');

  /** Datos de tarjeta — puramente decorativos, nunca se envían al backend. */
  nroTarjeta = '';
  vencimiento = '';
  cvv = '';

  readonly opcionesPago: { valor: MetodoPago; etiqueta: string }[] = [
    { valor: 'TARJETA',          etiqueta: 'Tarjeta de crédito' },
    { valor: 'TRANSFERENCIA',    etiqueta: 'Transferencia bancaria' },
    { valor: 'BILLETERA_DIGITAL', etiqueta: 'Billetera digital' },
  ];

  /** Regresa al paso de resumen (paso 7). */
  volver() {
    this.state.goTo(7);
  }

  /**
   * Crea la reserva con todos los datos del state y navega al detalle.
   * El método de pago elegido en pantalla NO se envía: create() confirma todo en el servidor.
   */
  confirmarPago() {
    const s = this.state;
    this.cargando.set(true);
    this.errorPago.set('');

    const cuerpo = this._construirCuerpo();

    this.api.post<any>('bookings', cuerpo).subscribe({
      next: (reserva) => {
        s.reset();
        const codigo = reserva.confirmationCode ?? '';
        this.toast.success(
          `¡Tu viaje está confirmado! Código ${codigo}`,
          'Reserva confirmada',
        );
        this.router.navigate(['/my-trips', reserva.id]);
      },
      error: (err) => {
        this.errorPago.set(apiErrorMessage(err, 'No pudimos procesar el pago. Intenta de nuevo.'));
        this.cargando.set(false);
      },
    });
  }

  /** Arma el body de CreateBookingDto a partir del state. */
  private _construirCuerpo(): Record<string, unknown> {
    const s = this.state;

    // Vuelos: ida obligatoria; regreso si existe (el DTO exige ArrayMinSize(2))
    const vuelos: { flightId: number }[] = [{ flightId: s.flightId()! }];
    if (s.returnFlightId()) {
      vuelos.push({ flightId: s.returnFlightId()! });
    }

    const cuerpo: Record<string, unknown> = {
      flights:         vuelos,
      passengers:      s.passengerDrafts().map((p) => ({
        firstName:      p.firstName,
        lastName:       p.lastName,
        documentNumber: p.documentNumber,
        birthDate:      p.birthDate,
        isHolder:       p.isHolder,
      })),
      pointsToRedeem: s.usePoints() ? (s.loyalty()?.availablePoints ?? 0) : 0,
    };

    // Hotel (opcional)
    if (s.hotel() && s.hotelCheckIn() && s.hotelCheckOut()) {
      cuerpo['hotels'] = [{
        hotelId:  s.hotel().id,
        checkIn:  s.hotelCheckIn(),
        checkOut: s.hotelCheckOut(),
        nights:   s.hotelNights(),
      }];
    }

    // Actividades (opcional)
    if (s.activitySelections().length > 0) {
      cuerpo['activities'] = s.activitySelections().map((sel) => ({
        activityId: sel.activityId,
        quantity:   sel.quantity,
      }));
    }

    // Extras (opcional) — el DTO espera { type: ExtraType }[]
    if (s.extras().length > 0) {
      cuerpo['extras'] = s.extras().map((e) => ({ type: e.type }));
    }

    return cuerpo;
  }
}
