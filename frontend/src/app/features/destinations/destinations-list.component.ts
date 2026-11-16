import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { apiErrorMessage } from '../../core/services/api-error';
import { LabelPipe } from '../../shared/pipes/label.pipe';
import { EmptyStateComponent, LoadingStateComponent } from '../../shared/ui/index';

const DESTINATION_TYPES = ['PLAYA', 'CIUDAD', 'AVENTURA', 'CULTURA'] as const;

@Component({
  selector: 'app-destinations-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe, EmptyStateComponent, LoadingStateComponent],
  template: `
    <div class="space-y-6">
      <!-- Encabezado -->
      <div class="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 text-white">
        <h1 class="text-3xl font-bold">Destinos</h1>
        <p class="text-primary-200 mt-1">Explora todos los destinos disponibles</p>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-2xl border border-slate-900/[0.06] shadow-card p-4 space-y-3">
        <!-- Búsqueda -->
        <input
          type="text"
          [value]="searchText()"
          (input)="onSearchInput($event)"
          placeholder="Buscar por nombre, país o ciudad..."
          class="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Buscar destinos"
        />

        <!-- Filtros de tipo -->
        <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de destino">
          <button
            (click)="typeFilter.set('')"
            [class]="typeFilter() === '' ? activeTypeClass : inactiveTypeClass"
          >
            Todos
          </button>
          @for (t of destinationTypes; track t) {
            <button
              (click)="typeFilter.set(typeFilter() === t ? '' : t)"
              [class]="typeFilter() === t ? activeTypeClass : inactiveTypeClass"
              [attr.aria-pressed]="typeFilter() === t"
            >
              {{ t | label }}
            </button>
          }
        </div>
      </div>

      <!-- Estado de carga -->
      @if (loading()) {
        <ui-loading text="Cargando destinos..." />
      }

      <!-- Resultados -->
      @if (!loading()) {
        @if (filtered().length === 0) {
          <ui-empty-state
            icon="🔍"
            title="No encontramos destinos con esos criterios"
            message="Intenta con otro nombre, país, ciudad o tipo de destino."
          />
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (dest of filtered(); track dest.id) {
              <a
                [routerLink]="['/destinations', dest.id]"
                class="block bg-white rounded-2xl border border-slate-900/[0.06] shadow-card overflow-hidden hover:shadow-md transition-shadow"
                [attr.aria-label]="dest.name + ', ' + dest.city"
              >
                <!-- Imagen -->
                @if (dest.imageUrl) {
                  <img
                    [src]="dest.imageUrl"
                    [alt]="dest.name"
                    class="w-full h-40 object-cover"
                  />
                } @else {
                  <div class="w-full h-40 bg-gradient-to-br from-primary-700 to-primary-400 flex items-center justify-center">
                    <span class="text-4xl" aria-hidden="true">✈️</span>
                  </div>
                }

                <!-- Datos del destino -->
                <div class="p-4 space-y-1">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <h2 class="text-lg font-bold tracking-tight text-primary-700 text-base leading-tight">{{ dest.name }}</h2>
                      <p class="text-xs text-slate-500">{{ dest.city }}, {{ dest.country }}</p>
                    </div>
                    <span class="text-xs bg-primary-100 text-primary-800 rounded-full px-2 py-0.5 whitespace-nowrap font-medium">
                      {{ dest.type | label }}
                    </span>
                  </div>

                  @if (dest.fromPrice != null) {
                    <p class="text-sm font-bold text-primary-700 pt-1">
                      Desde S/. {{ dest.fromPrice | number:'1.0-0' }}
                    </p>
                  } @else {
                    <p class="text-xs text-slate-400 pt-1">Sin vuelos disponibles</p>
                  }
                </div>
              </a>
            }
          </div>
        }
      }
    </div>
  `,
})
export class DestinationsListComponent implements OnInit {
  readonly destinationTypes = DESTINATION_TYPES;

  readonly activeTypeClass =
    'px-3 py-1 rounded-full text-sm font-medium bg-primary-600 text-white transition-colors';
  readonly inactiveTypeClass =
    'px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors';

  destinations = signal<any[]>([]);
  loading = signal(false);
  typeFilter = signal('');
  searchText = signal('');

  filtered = computed(() => {
    const type = this.typeFilter();
    const search = this.searchText().toLowerCase().trim();
    return this.destinations().filter(dest => {
      const matchesType = !type || dest.type === type;
      const matchesSearch =
        !search ||
        dest.name?.toLowerCase().includes(search) ||
        dest.country?.toLowerCase().includes(search) ||
        dest.city?.toLowerCase().includes(search);
      return matchesType && matchesSearch;
    });
  });

  constructor(private api: ApiService, private toast: ToastService) {}

  onSearchInput(event: Event) {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  ngOnInit() {
    this.loading.set(true);
    this.api.get<any[]>('destinations').subscribe({
      next: (data) => {
        this.destinations.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(apiErrorMessage(err, 'No pudimos cargar los destinos'));
      },
    });
  }
}
