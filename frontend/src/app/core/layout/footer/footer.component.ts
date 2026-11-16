import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BrandMarkComponent } from '../../../shared/ui';

interface FooterLink {
  label: string;
  path: string;
}

/**
 * Pie de página común (TS-008), como en la maqueta: marca, enlaces de la plataforma y de la cuenta.
 * No aparece en el panel de administración ni al imprimir.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, BrandMarkComponent],
  template: `
    @if (!isAdmin()) {
      <footer class="no-print print:hidden mt-16 bg-primary-700 text-primary-200">
        <div class="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:px-10 sm:grid-cols-2 lg:grid-cols-4">
          <div class="sm:col-span-2 lg:col-span-2 max-w-sm">
            <div class="flex items-center gap-2.5">
              <app-brand-mark [onDark]="true" />
              <span class="leading-none">
                <span class="block text-[17px] font-extrabold tracking-tight text-white">AeroCRM</span>
                <span class="block mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-accent-300">Expertia Travel</span>
              </span>
            </div>
            <p class="mt-4 text-sm leading-relaxed">
              Arma tu paquete de viaje en un solo flujo: vuelo, hotel, actividades y extras.
              Cada compra suma puntos para tu nivel de membresía.
            </p>
          </div>

          <nav aria-label="Plataforma">
            <p class="text-sm font-bold text-white">Explora</p>
            <ul class="mt-3 space-y-2 text-sm">
              @for (link of exploreLinks; track link.path) {
                <li><a [routerLink]="link.path" class="hover:text-white">{{ link.label }}</a></li>
              }
            </ul>
          </nav>

          <nav aria-label="Tu cuenta">
            <p class="text-sm font-bold text-white">Tu cuenta</p>
            <ul class="mt-3 space-y-2 text-sm">
              @for (link of accountLinks(); track link.path) {
                <li><a [routerLink]="link.path" class="hover:text-white">{{ link.label }}</a></li>
              }
            </ul>
          </nav>
        </div>
        <div class="border-t border-white/10">
          <p class="mx-auto max-w-7xl px-4 py-5 text-xs lg:px-10">© {{ year }} Expertia Travel S.A.C. · AeroCRM</p>
        </div>
      </footer>
    }
  `,
})
export class FooterComponent {
  private readonly auth = inject(AuthService);

  readonly year = new Date().getFullYear();
  readonly isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  readonly exploreLinks: FooterLink[] = [
    { label: 'Explorar vuelos', path: '/explore' },
    { label: 'Destinos', path: '/destinations' },
    { label: 'Armar un paquete', path: '/packages/new' },
    { label: 'Contacto y ayuda', path: '/contact' },
  ];

  readonly accountLinks = computed<FooterLink[]>(() =>
    this.auth.currentUser()
      ? [
          { label: 'Mis viajes', path: '/my-trips' },
          { label: 'Mis puntos', path: '/loyalty' },
          { label: 'Perfil', path: '/profile' },
        ]
      : [
          { label: 'Iniciar sesión', path: '/login' },
          { label: 'Crear cuenta', path: '/register' },
        ],
  );
}
