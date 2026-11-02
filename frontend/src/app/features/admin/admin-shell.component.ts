import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Estructura base del panel de administración con barra lateral de navegación
 * y salida para las rutas hijas (TS-027).
 */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen bg-gray-50">
      <!-- Barra lateral -->
      <aside class="w-56 bg-white border-r flex flex-col shrink-0">
        <div class="px-5 py-4 border-b">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest">Panel admin</p>
        </div>
        <nav class="flex-1 py-4 space-y-1 px-3">
          <a
            routerLink="dashboard"
            routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Resumen
          </a>
          <a
            routerLink="destinations"
            routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Destinos
          </a>
          <a
            routerLink="bookings"
            routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Reservas
          </a>
          <a
            routerLink="clients"
            routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Clientes
          </a>
          <a
            routerLink="inquiries"
            routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Consultas
          </a>
        </nav>
      </aside>

      <!-- Contenido principal -->
      <main class="flex-1 p-6 overflow-auto">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminShellComponent {}
