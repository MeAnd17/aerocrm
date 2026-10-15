import { Component, OnInit, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { HotelListComponent } from '../../shared/components/hotel-list/hotel-list.component';

@Component({
  selector: 'app-destination-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe, HotelListComponent],
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

        <!-- Hoteles (US-007) -->
        @if (destination().hotels?.length) {
          <div class="bg-white rounded-xl border shadow-sm p-5">
            <h2 class="font-semibold text-gray-800 mb-3">🏨 Hoteles disponibles</h2>
            <app-hotel-list [hotels]="destination().hotels" />
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

        <a routerLink="/search" class="block text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
          Buscar vuelos a {{ destination().city }} →
        </a>
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