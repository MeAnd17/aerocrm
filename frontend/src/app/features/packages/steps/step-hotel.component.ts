import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PackageBuilderState } from '../package-builder.state';
import { HotelListComponent } from '../../../shared/ui/hotel-list.component';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { apiErrorMessage } from '../../../core/services/api-error';

/** Paso 3 · Hotel (opcional). */
@Component({
  selector: 'app-step-hotel',
  standalone: true,
  imports: [CommonModule, FormsModule, HotelListComponent],
  template: `
    <div class="bg-white rounded-xl border shadow-sm p-5 space-y-4">
      <h3 class="font-semibold text-gray-800">🏨 Elige tu hotel <span class="text-gray-400 font-normal text-sm">(opcional)</span></h3>

      <app-hotel-list
        [hotels]="state.context()?.hotels ?? []"
        [checkIn]="state.hotelCheckIn()"
        [checkOut]="state.hotelCheckOut()"
        [selected]="state.hotel()"
        (hotelSelect)="onSelectHotel($event)"
      />

      @if (state.hotel()) {
        <!-- Fechas del hotel -->
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-xs text-gray-500 mb-1">Fecha de entrada</label>
            <input type="date"
              [ngModel]="state.hotelCheckIn()"
              (ngModelChange)="onCheckInChange($event)"
              [min]="minCheckIn()"
              [max]="maxCheckIn()"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex-1">
            <label class="block text-xs text-gray-500 mb-1">Fecha de salida</label>
            <input type="date"
              [ngModel]="state.hotelCheckOut()"
              (ngModelChange)="onCheckOutChange($event)"
              [min]="minCheckOut()"
              [max]="maxCheckOut()"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        @if (dateError()) {
          <p class="text-sm text-red-600">{{ dateError() }}</p>
        }

        <!-- Resumen de noches y total (viene del servidor) -->
        @if (cargandoCotizacion()) {
          <p class="text-sm text-gray-400 italic">Calculando precio…</p>
        } @else if (cotizacion()) {
          <div class="bg-blue-50 rounded-lg px-4 py-3 text-sm space-y-1">
            <div class="flex justify-between text-gray-700">
              <span>Noches</span>
              <span class="font-medium">{{ cotizacion()!.breakdown.hotel?.nights ?? 0 }}</span>
            </div>
            <div class="flex justify-between text-gray-700">
              <span>Total estadía</span>
              <span class="font-semibold text-blue-900">S/. {{ cotizacion()!.breakdown.hotel?.lineTotal | number:'1.2-2' }}</span>
            </div>
          </div>
        }
      }

      <!-- Acciones -->
      <div class="flex gap-3">
        <button (click)="continuar()"
          class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition text-sm">
          Continuar
        </button>
        <button (click)="sinAlojamiento()"
          class="text-sm text-gray-400 hover:text-gray-600 px-3 whitespace-nowrap">
          Ya tengo alojamiento
        </button>
      </div>
    </div>
  `,
})
export class StepHotelComponent implements OnInit {
  readonly state = inject(PackageBuilderState);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly cargandoCotizacion = signal(false);
  readonly cotizacion = signal<any>(null);
  readonly dateError = signal('');

  /** Fecha mínima para checkIn: llegada del vuelo de ida. */
  readonly minCheckIn = computed(() => {
    const arr = this.state.flight()?.arrivalDate;
    return arr ? isoToDate(arr) : '';
  });

  /** Fecha máxima para checkIn: un día antes del checkout actual (o salida del vuelo de regreso). */
  readonly maxCheckIn = computed(() => {
    const retDep = this.state.returnFlight()?.departureDate;
    if (!retDep) return '';
    // El máximo de checkIn es el día anterior a la salida del vuelo de regreso
    const d = new Date(retDep);
    d.setDate(d.getDate() - 1);
    return localDate(d);
  });

  /** Fecha mínima para checkOut: un día después del checkIn actual. */
  readonly minCheckOut = computed(() => {
    const ci = this.state.hotelCheckIn();
    if (!ci) return '';
    const d = new Date(ci);
    d.setDate(d.getDate() + 1);
    return localDate(d);
  });

  /** Fecha máxima para checkOut: salida del vuelo de regreso. */
  readonly maxCheckOut = computed(() => {
    const retDep = this.state.returnFlight()?.departureDate;
    return retDep ? isoToDate(retDep) : '';
  });

  ngOnInit() {
    // Si ya hay hotel y fechas al llegar al paso, cargar cotización inicial
    if (this.state.hotel() && this.state.hotelCheckIn() && this.state.hotelCheckOut()) {
      this._loadQuote();
    }
  }

  onSelectHotel(hotel: any) {
    this.state.toggleHotel(hotel);
    this.cotizacion.set(null);
    this.dateError.set('');
    if (this.state.hotel()) {
      this._loadQuote();
    }
  }

  onCheckInChange(value: string) {
    this.state.hotelCheckIn.set(value);
    this.dateError.set('');
    this._validateDates(value, this.state.hotelCheckOut());
    if (!this.dateError() && this.state.hotel()) {
      this._loadQuote();
    }
  }

  onCheckOutChange(value: string) {
    this.state.hotelCheckOut.set(value);
    this.dateError.set('');
    this._validateDates(this.state.hotelCheckIn(), value);
    if (!this.dateError() && this.state.hotel()) {
      this._loadQuote();
    }
  }

  private _validateDates(checkIn: string, checkOut: string) {
    if (!checkIn || !checkOut) return;

    const minIn = this.minCheckIn();
    const maxOut = this.maxCheckOut();

    if (minIn && checkIn < minIn) {
      this.dateError.set('Las fechas del hotel deben estar dentro de tu viaje.');
      return;
    }
    if (maxOut && checkOut > maxOut) {
      this.dateError.set('Las fechas del hotel deben estar dentro de tu viaje.');
      return;
    }
    if (checkOut <= checkIn) {
      this.dateError.set('La fecha de salida debe ser posterior a la de entrada.');
    }
  }

  private _loadQuote() {
    const hotel = this.state.hotel();
    const checkIn = this.state.hotelCheckIn();
    const checkOut = this.state.hotelCheckOut();
    const flightId = this.state.flightId();
    const passengers = this.state.passengers();

    if (!hotel || !checkIn || !checkOut || !flightId) return;
    if (checkOut <= checkIn) return;

    this.cargandoCotizacion.set(true);
    this.cotizacion.set(null);

    const body: Record<string, any> = {
      flightId,
      passengers,
      hotelId: hotel.id,
      checkIn,
      checkOut,
    };
    if (this.state.returnFlightId()) {
      body['returnFlightId'] = this.state.returnFlightId();
    }

    this.api.post<any>('bookings/quote', body).subscribe({
      next: (res) => {
        this.cotizacion.set(res);
        this.cargandoCotizacion.set(false);
      },
      error: (err) => {
        this.cargandoCotizacion.set(false);
        this.toast.error(apiErrorMessage(err, 'No se pudo calcular el precio del hotel.'));
      },
    });
  }

  continuar() {
    if (this.state.hotel() && this.dateError()) return;
    this.state.goTo(4);
  }

  /** Permite avanzar sin hotel (borra la selección). */
  sinAlojamiento() {
    this.state.hotel.set(null);
    this.state.hotelId.set(null);
    this.state.hotelCheckIn.set('');
    this.state.hotelCheckOut.set('');
    this.cotizacion.set(null);
    this.dateError.set('');
    this.state.goTo(4);
  }
}

/** Extrae la parte de fecha (AAAA-MM-DD) de un ISO string. */
function isoToDate(iso: string): string {
  return iso.slice(0, 10);
}

/** Fecha local en formato AAAA-MM-DD para <input type="date">. */
function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
