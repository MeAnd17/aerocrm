import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

/** Estadísticas devueltas por GET /admin/stats. */
interface AdminStats {
  destinations: number;
  bookings: number;
  clients: number;
}

/**
 * Panel de resumen del administrador: muestra conteos de destinos, reservas y clientes
 * obtenidos desde GET /admin/stats (TS-027).
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-xl font-bold text-gray-800">Resumen</h1>

      @if (cargando()) {
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-hidden="true">
          @for (_ of [1, 2, 3]; track _) {
            <div class="bg-white rounded-xl border shadow-sm p-5 animate-pulse">
              <div class="h-8 w-16 bg-gray-200 rounded mb-2"></div>
              <div class="h-4 w-28 bg-gray-100 rounded"></div>
            </div>
          }
        </div>
      }

      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {{ error() }}
        </div>
      }

      @if (stats()) {
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white rounded-xl border shadow-sm p-5">
            <p class="text-3xl font-bold text-blue-900">{{ stats()!.destinations }}</p>
            <p class="text-sm text-gray-500 mt-1">Destinos activos</p>
          </div>
          <div class="bg-white rounded-xl border shadow-sm p-5">
            <p class="text-3xl font-bold text-blue-900">{{ stats()!.bookings }}</p>
            <p class="text-sm text-gray-500 mt-1">Reservas totales</p>
          </div>
          <div class="bg-white rounded-xl border shadow-sm p-5">
            <p class="text-3xl font-bold text-blue-900">{{ stats()!.clients }}</p>
            <p class="text-sm text-gray-500 mt-1">Clientes registrados</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<AdminStats | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<AdminStats>('admin/stats').subscribe({
      next: (data) => {
        this.stats.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las estadísticas. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }
}
