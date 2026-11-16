import { Component, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { PackageBuilderState } from '../../../features/packages/package-builder.state';
import { BrandMarkComponent, ButtonComponent } from '../../../shared/ui';

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
  imports: [RouterLink, RouterLinkActive, TitleCasePipe, ButtonComponent, BrandMarkComponent],
  template: `
    <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <nav class="mx-auto flex h-16 lg:h-[72px] max-w-7xl items-center justify-between gap-4 px-4 lg:px-10" aria-label="Principal">
        <a [routerLink]="user() ? '/home' : '/explore'" class="flex items-center gap-2.5 shrink-0" aria-label="AeroCRM, ir al inicio">
          <app-brand-mark />
          <span class="leading-none">
            <span class="block text-[17px] font-extrabold tracking-tight text-primary-700">AeroCRM</span>
            <span class="block mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-accent-700">Expertia Travel</span>
          </span>
        </a>

        <!-- Escritorio -->
        <div class="hidden lg:flex items-center gap-1 self-stretch">
          @for (link of links(); track link.path) {
            <a [routerLink]="link.path" routerLinkActive="!text-accent-700 !border-accent-500"
              class="flex items-center border-b-2 border-transparent px-3 text-sm font-medium text-slate-600 transition hover:text-primary-700">{{ link.label }}</a>
          }
        </div>

        <div class="hidden lg:flex items-center gap-3">
          @if (draft.hasDraft()) {
            <a routerLink="/packages/new"
              class="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3.5 py-1.5 text-sm font-semibold text-accent-700 hover:bg-accent-100">
              <span class="h-2 w-2 rounded-full bg-accent-500 animate-pulse" aria-hidden="true"></span>
              Continuar paquete
            </a>
          }
          @if (user(); as u) {
            <div class="flex items-center gap-2.5 border-l border-slate-200 pl-4">
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white" aria-hidden="true">{{ initials() }}</span>
              <div class="leading-tight">
                <p class="text-sm font-semibold text-primary-700">{{ u.firstName }}</p>
                @if (u.membershipLevel) {
                  <p class="text-[11px] font-bold uppercase tracking-wider text-success-700">{{ u.membershipLevel | titlecase }}</p>
                }
              </div>
            </div>
            <button type="button" uiButton variant="ghost" size="sm" (click)="logout()">Cerrar sesión</button>
          } @else {
            <a routerLink="/login" uiButton variant="ghost" size="sm">Iniciar sesión</a>
            <a routerLink="/register" uiButton size="sm">Crear cuenta</a>
          }
        </div>

        <!-- Teléfono -->
        <button type="button" class="lg:hidden rounded-full p-2 text-primary-700 hover:bg-slate-100"
          (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-controls="menu-movil" aria-label="Abrir menú">
          <span class="block h-6 w-6 text-xl leading-6 text-center">{{ open() ? '✕' : '☰' }}</span>
        </button>
      </nav>

      @if (open()) {
        <div id="menu-movil" class="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-float">
          @if (user(); as u) {
            <div class="flex items-center gap-3 px-3 pb-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white" aria-hidden="true">{{ initials() }}</span>
              <p class="text-sm leading-tight">
                <span class="block font-semibold text-primary-700">{{ u.firstName }} {{ u.lastName }}</span>
                @if (u.membershipLevel) { <span class="block text-[11px] font-bold uppercase tracking-wider text-success-700">{{ u.membershipLevel | titlecase }}</span> }
              </p>
            </div>
          }
          @if (draft.hasDraft()) {
            <a routerLink="/packages/new" class="block rounded-xl bg-accent-50 px-3 py-2.5 text-sm font-semibold text-accent-700">Continuar paquete</a>
          }
          @for (link of links(); track link.path) {
            <a [routerLink]="link.path" routerLinkActive="bg-primary-50 !text-primary-700 font-semibold"
              class="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">{{ link.label }}</a>
          }
          <div class="pt-2">
            @if (user()) {
              <button type="button" uiButton variant="secondary" [block]="true" (click)="logout()">Cerrar sesión</button>
            } @else {
              <div class="grid grid-cols-2 gap-2">
                <a routerLink="/login" uiButton variant="secondary">Iniciar sesión</a>
                <a routerLink="/register" uiButton>Crear cuenta</a>
              </div>
            }
          </div>
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
  /** Iniciales del cliente para el círculo de la cuenta. */
  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  });

  constructor() {
    // El menú del teléfono se cierra al navegar.
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.open.set(false));
  }

  logout() {
    this.auth.logout();
  }
}
