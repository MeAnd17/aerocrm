import { Component, OnInit, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ButtonComponent, CardComponent, LoadingStateComponent } from '../../shared/ui';

@Component({
  selector: 'app-destination-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe, ButtonComponent, CardComponent, LoadingStateComponent],
  template: `
    <div class="space-y-5">
      @if (destination()) {
        <div class="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white">
          <h1 class="text-3xl font-bold">{{ destination().city }}</h1>
          <p class="text-blue-200">{{ destination().country }}</p>
          <p class="mt-2 text-sm">{{ destination().description }}</p>
        </div>

        <!-- Festividades -->
        @if (destination().festivities?.length) {
          <div class="bg-white rounded-xl border shadow-sm p-5">
            <h2 class="font-semibold text-gray-800 mb-3">🎉 Festividades</h2>
            <div class="space-y-2">
              @for (fest of destination().festivities; track fest.id) {
                <div class="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <span class="text-2xl">🎭</span>
                  <div>
                    <p class="font-medium text-gray-800">{{ fest.name }}</p>
                    <p class="text-xs text-gray-500">
                      {{ fest.startDay }}/{{ fest.startMonth }} — {{ fest.endDay }}/{{ fest.endMonth }}
                    </p>
                    <p class="text-sm text-gray-600 mt-1">{{ fest.description }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Hoteles -->
        @if (destination().hotels?.length) {
          <div class="bg-white rounded-xl border shadow-sm p-5">
            <h2 class="font-semibold text-gray-800 mb-3">🏨 Hoteles disponibles</h2>
            <div class="space-y-2">
              @for (hotel of destination().hotels; track hotel.id) {
                <div class="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p class="font-medium text-gray-800">{{ hotel.name }}</p>
                    <p class="text-xs text-gray-500">{{ hotel.zone }} · {{ '⭐'.repeat(hotel.stars) }}</p>
                  </div>
                  <p class="font-bold text-blue-900">S/. {{ hotel.pricePerNight }}<span class="text-xs text-gray-400">/noche</span></p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Actividades -->
        @if (destination().activities?.length) {
          <div class="bg-white rounded-xl border shadow-sm p-5">
            <h2 class="font-semibold text-gray-800 mb-3">🎯 Actividades</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              @for (act of destination().activities; track act.id) {
                <div class="p-3 border rounded-lg">
                  <p class="font-medium text-sm text-gray-800">{{ act.name }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ act.type | etiqueta }} · {{ act.durationHours }}h</p>
                  <p class="text-sm font-bold text-blue-900 mt-1">S/. {{ act.price }}</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Vuelos de llegada (US-005 CA4/CA5) -->
        @if (destination().arrivingFlights?.length) {
          <ui-card title="✈️ Vuelos de llegada">
            <div class="space-y-2">
              @for (flight of destination().arrivingFlights; track flight.id) {
                <div class="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div>
                    <p class="font-medium text-slate-800">{{ flight.airline }} · {{ flight.flightNumber }}</p>
                    <p class="text-xs text-slate-500">{{ flight.origin?.city }} → {{ destination().city }}</p>
                    <p class="text-xs text-slate-400">{{ flight.departureDate | date:'dd MMM yyyy' }}</p>
                  </div>
                  <p class="font-bold text-primary-700">S/. {{ flight.pricePerPerson | number:'1.2-2' }}</p>
                </div>
              }
            </div>
          </ui-card>
        } @else {
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center">
            <p class="text-slate-400">No hay vuelos disponibles</p>
          </div>
        }

        <a [routerLink]="['/packages/new']" [queryParams]="{ destinationId: destination().id }" uiButton variant="primary" size="lg" [block]="true">
          Armar mi viaje a {{ destination().city }}
        </a>
      } @else {
        <ui-loading text="Cargando destino..." />
      }
    </div>
  `,
})
export class DestinationDetailComponent implements OnInit {
  destination = signal<any>(null);

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get<any>(`destinations/${id}`).subscribe(data => this.destination.set(data));
  }
}
