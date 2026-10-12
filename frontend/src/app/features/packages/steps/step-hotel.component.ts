import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PackageBuilderState } from '../package-builder.state';

/** Paso 3 · Hotel (opcional). */
@Component({
  selector: 'app-step-hotel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border shadow-sm p-5">
      <h3 class="font-semibold text-gray-800 mb-3">🏨 Elige tu hotel <span class="text-gray-400 font-normal text-sm">(opcional)</span></h3>
      <div class="space-y-2 mb-3">
        @for (hotel of state.context()?.hotels; track hotel.id) {
          <div (click)="state.toggleHotel(hotel)"
            [class.ring-2]="state.hotel()?.id === hotel.id"
            [class.ring-blue-500]="state.hotel()?.id === hotel.id"
            class="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition">
            <div>
              <p class="font-medium text-sm">{{ hotel.name }}</p>
              <p class="text-xs text-gray-500">{{ '⭐'.repeat(hotel.stars) }} · {{ hotel.zone }}</p>
            </div>
            <p class="font-bold text-blue-900 text-sm">S/. {{ hotel.pricePerNight }}/noche</p>
          </div>
        }
      </div>
      @if (state.hotel()) {
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-xs text-gray-500 mb-1">Check-in</label>
            <input type="date" [ngModel]="state.hotelCheckIn()" (ngModelChange)="state.hotelCheckIn.set($event)"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex-1">
            <label class="block text-xs text-gray-500 mb-1">Check-out</label>
            <input type="date" [ngModel]="state.hotelCheckOut()" (ngModelChange)="state.hotelCheckOut.set($event)"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      }
      <div class="flex gap-3 mt-3">
        <button (click)="state.goTo(4)" class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition text-sm">
          Continuar
        </button>
        <button (click)="state.hotel.set(null); state.goTo(4)" class="text-sm text-gray-400 hover:text-gray-600 px-3">
          Omitir
        </button>
      </div>
    </div>
  `,
})
export class StepHotelComponent {
  readonly state = inject(PackageBuilderState);
}
