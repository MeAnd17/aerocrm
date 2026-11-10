import { Component, OnInit, computed, signal } from '@angular/core';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { HotelListComponent } from '../../shared/ui/hotel-list.component';
import { ActivityListComponent } from '../../shared/ui/activity-list.component';
import { RatingStarsComponent } from '../../shared/ui/rating-stars.component';

interface DestinationReviews {
  averageRating: number | null;
  reviewCount: number;
  reviews: {
    id: number;
    rating: number;
    comment: string | null;
    updatedAt: string;
    travelerName: string;
  }[];
}

@Component({
  selector: 'app-destination-detail',
  standalone: true,
  imports: [CommonModule, LabelPipe, HotelListComponent, ActivityListComponent, RatingStarsComponent],
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
            <app-hotel-list [hotels]="destination().hotels ?? []" />
          </div>
        }

        <!-- Actividades -->
        @if (destination().activities?.length) {
          <div class="bg-white rounded-xl border shadow-sm p-5">
            <h2 class="font-semibold text-gray-800 mb-3">🎯 Actividades</h2>
            <app-activity-list [activities]="destination().activities ?? []" />
          </div>
        }

        <!-- Calificaciones (US-026) -->
        <div class="bg-white rounded-xl border shadow-sm p-5">
          <h2 class="font-semibold text-gray-800 mb-3">⭐ Calificaciones</h2>

          @if (cargandoResenas()) {
            <p class="text-sm text-gray-400">Cargando calificaciones...</p>
          } @else if (resenas()?.reviewCount === 0 || !resenas()) {
            <p class="text-sm text-gray-500">Todavía no hay calificaciones de este destino.</p>
          } @else {
            <!-- Promedio -->
            <div class="flex items-center gap-3 mb-4 pb-4 border-b">
              <ui-stars [rating]="promedioRedondeado()" />
              <span class="text-lg font-bold text-gray-800">{{ resenas()!.averageRating | number:'1.1-1' }}</span>
              <span class="text-sm text-gray-500">({{ resenas()!.reviewCount }} calificación{{ resenas()!.reviewCount !== 1 ? 'es' : '' }})</span>
            </div>

            <!-- Lista de reseñas -->
            <div class="space-y-4">
              @for (r of resenas()!.reviews; track r.id) {
                <div class="pb-4 border-b last:border-0">
                  <div class="flex items-center justify-between mb-1">
                    <p class="font-medium text-sm text-gray-800">{{ r.travelerName }}</p>
                    <p class="text-xs text-gray-400">{{ r.updatedAt | date:'dd MMM yyyy':'':'es-PE' }}</p>
                  </div>
                  <ui-stars [rating]="r.rating" />
                  @if (r.comment) {
                    <p class="text-sm text-gray-600 mt-1">{{ r.comment }}</p>
                  }
                </div>
              }
            </div>
          }
        </div>

        <button
          (click)="goToBuilder()"
          class="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          Armar mi viaje a {{ destination().city }} →
        </button>
      }
    </div>
  `,
})
export class DestinationDetailComponent implements OnInit {
  destination = signal<any>(null);
  resenas = signal<DestinationReviews | null>(null);
  cargandoResenas = signal(false);

  readonly promedioRedondeado = computed(() => {
    const avg = this.resenas()?.averageRating;
    if (!avg) return 0;
    return Math.round(avg);
  });

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.get<any>(`destinations/${id}`).subscribe((data) => {
      this.destination.set(data);
    });

    this.cargandoResenas.set(true);
    this.api.get<DestinationReviews>(`reviews/destination/${id}`).subscribe({
      next: (data) => {
        this.resenas.set(data);
        this.cargandoResenas.set(false);
      },
      error: () => this.cargandoResenas.set(false),
    });
  }

  goToBuilder() {
    const id = this.destination()?.id;
    this.router.navigate(['/packages/new'], { queryParams: { destinationId: id } });
  }
}
