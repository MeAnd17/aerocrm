import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PackageBuilderState } from '../package-builder.state';
import { HotelListComponent } from '../../../shared/components/hotel-list/hotel-list.component';

/** Paso 3 · Hotel (opcional). */
@Component({
  selector: 'app-step-hotel',
  standalone: true,
  imports: [CommonModule, FormsModule, HotelListComponent],
  template: `
    <div class="bg-white rounded-xl border shadow-sm p-5">
      <h3 class="font-semibold text-gray-800 mb-3">🏨 Elige tu hotel <span class="text-gray-400 font-normal text-sm">(opcional)</span></h3>
      <div class="mb-3">
        <app-hotel-list
          [hotels]="state.context()?.hotels"
          [selectable]="true"
          [selectedId]="state.hotel()?.id ?? null"
          [nights]="state.hotelNights()"
          (select)="state.toggleHotel($event)" />
      </div>
      @if (state.hotel()) {
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-xs text-gray-500 mb-1">Fecha de entrada</label>
            <input type="date" [ngModel]="state.hotelCheckIn()" (ngModelChange)="state.hotelCheckIn.set($event)"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex-1">
            <label class="block text-xs text-gray-500 mb-1">Fecha de salida</label>
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