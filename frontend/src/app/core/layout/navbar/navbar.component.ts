import { Component, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { PackageBuilderState } from '../../../features/packages/package-builder.state';

interface NavLink {
  label: string;
  path: string;
}

const VISITOR_LINKS: NavLink[] = [
  { label: 'Explorar', path: '/explore' },
  { label: 'Contacto', path: '/contact' },
];

const CLIENT_LINKS: NavLink[] = [
  { label: 'Inicio', path: '/home' },
  { label: 'Explorar', path: '/search' },
  { label: 'Mis viajes', path: '/my-trips' },
  { label: 'Mis puntos', path: '/loyalty' },
  { label: 'Contacto', path: '/contact' },
  { label: 'Perfil', path: '/profile' },
];

const ADMIN_LINKS: NavLink[] = [
  { label: 'Panel de administración', path: '/admin' },
];

/**
 * Barra de navegación común (TS-008). Siempre presente; su contenido cambia según haya sesión.
 * En pantallas angostas se reduce a un menú desplegable.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TitleCasePipe],
  template: `
    <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <nav class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4" aria-label="Principal">
        <a [routerLink]="user() ? '/home' : '/explore'" class="flex items-center gap-2 font-bold text-primary-800 shrink-0">
          <span class="text-xl" aria-hidden="true">✈️</span>
          <span>AeroCRM</span>
        </a>

        <!-- Escritorio -->
        <div class="hidden lg:flex items-center gap-1">
          @for (link of links(); track link.path) {
            <a [routerLink]="link.path" routerLinkActive="bg-primary-50 text-primary-700"
              class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">{{ link.label }}</a>
          }
        </div>

        <div class="hidden lg:flex items-center gap-3">
          @if (draft.hasDraft()) {
            <a routerLink="/packages/new"
              class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100">Continuar paquete</a>
          }
          @if (user(); as u) {
            <div class="text-right leading-tight">
              <p class="text-sm font-semibold text-slate-800">{{ u.firstName }}</p>
              @if (u.membershipLevel) {
                <p class="text-xs text-primary-700">{{ u.membershipLevel | titlecase }}</p>
              }
            </div>
            <button type="button" (click)="logout()" class="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800">Cerrar sesión</button>
          } @else {
            <a routerLink="/login" class="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Iniciar sesión</a>
            <a routerLink="/register" class="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">Crear cuenta</a>
          }
        </div>

        <!-- Teléfono -->
        <button type="button" class="lg:hidden rounded-lg p-2 text-slate-700 hover:bg-slate-100"
          (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-controls="menu-movil" aria-label="Abrir menú">
          <span class="block text-xl leading-none">{{ open() ? '✕' : '☰' }}</span>
        </button>
      </nav>

      @if (open()) {
        <div id="menu-movil" class="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          @if (user(); as u) {
            <p class="px-3 pb-2 text-sm text-slate-500">
              {{ u.firstName }} {{ u.lastName }}
              @if (u.membershipLevel) { · <span class="text-primary-700">{{ u.membershipLevel | titlecase }}</span> }
            </p>
          }
          @if (draft.hasDraft()) {
            <a routerLink="/packages/new" class="block rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">Continuar paquete</a>
          }
          @for (link of links(); track link.path) {
            <a [routerLink]="link.path" routerLinkActive="bg-primary-50 text-primary-700"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">{{ link.label }}</a>
          }
          @if (user()) {
            <button type="button" (click)="logout()" class="block w-full text-left rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">Cerrar sesión</button>
          } @else {
            <a routerLink="/login" class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Iniciar sesión</a>
            <a routerLink="/register" class="block rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white text-center">Crear cuenta</a>
          }
        </div>
      }
    </header>
  `,
})
export class NavbarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly draft = inject(PackageBuilderState);

  readonly user = this.auth.currentUser;
  readonly links = computed(() => {
    const u = this.user();
    if (!u) return VISITOR_LINKS;
    return u.role === 'ADMIN' ? ADMIN_LINKS : CLIENT_LINKS;
  });
  readonly open = signal(false);

  constructor() {
    // El menú del teléfono se cierra al navegar.
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.open.set(false));
  }

  logout() {
    this.auth.logout();
  }
}
