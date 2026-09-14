import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-client-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div style="min-height:100vh;background:#050d1a;display:flex;flex-direction:column">

      <!-- Top navigation bar -->
      <header style="background:rgba(10,22,40,0.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(201,168,76,0.15);position:sticky;top:0;z-index:30">
        <div style="max-width:1400px;margin:0 auto;padding:0 1.5rem;height:64px;display:flex;align-items:center;justify-content:space-between">

          <!-- Logo -->
          <a routerLink="/client" style="display:flex;align-items:center;gap:.75rem;text-decoration:none">
            <div style="width:36px;height:36px;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:9px;display:flex;align-items:center;justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;color:#c9a84c" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>
            </div>
            <span style="font-size:1.1rem;font-weight:700;color:white;letter-spacing:.02em">
              <span style="color:#c9a84c">Aero</span>CRM
            </span>
          </a>

          <!-- Desktop nav -->
          <nav style="display:none" class="md-nav">
            <div style="display:flex;align-items:center;gap:.25rem">
              <a *ngFor="let item of navItems" [routerLink]="item.route" routerLinkActive="client-nav-active"
                 style="display:flex;align-items:center;gap:.5rem;padding:.5rem .875rem;border-radius:.5rem;font-size:.875rem;font-weight:500;color:#5580d0;text-decoration:none;transition:all .15s">
                <span [innerHTML]="item.icon" style="width:16px;height:16px;display:flex"></span>
                {{ item.label }}
              </a>
            </div>
          </nav>

          <!-- User area -->
          <div style="display:flex;align-items:center;gap:.75rem">
            <!-- Tier badge -->
            <span *ngIf="user" style="display:none;padding:.25rem .75rem;border-radius:999px;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em"
                  class="tier-badge-show"
                  [style.background]="tierBg" [style.color]="tierColor" [style.border]="tierBorder">
              {{ passenger?.tier || 'STANDARD' }}
            </span>

            <!-- Avatar dropdown -->
            <div style="position:relative">
              <button (click)="showMenu.set(!showMenu())"
                      style="display:flex;align-items:center;gap:.5rem;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:.75rem;padding:.375rem .75rem;cursor:pointer;transition:all .15s">
                <div style="width:28px;height:28px;border-radius:50%;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.3);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:#c9a84c">
                  {{ initials }}
                </div>
                <span style="font-size:.875rem;font-weight:500;color:white;display:none" class="name-show">{{ user?.firstName }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;color:#c9a84c" viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/></svg>
              </button>

              <div *ngIf="showMenu()"
                   style="position:absolute;right:0;top:calc(100% + 8px);width:200px;background:#0f2040;border:1px solid rgba(22,45,88,0.8);border-radius:.75rem;box-shadow:0 8px 32px rgba(0,0,0,0.5);padding:.375rem 0;z-index:50">
                <div style="padding:.625rem 1rem;border-bottom:1px solid rgba(22,45,88,0.6)">
                  <p style="font-size:.8rem;font-weight:600;color:white">{{ user?.firstName }} {{ user?.lastName }}</p>
                  <p style="font-size:.7rem;color:#5580d0;margin-top:2px">{{ user?.email }}</p>
                </div>
                <a routerLink="/client/profile" (click)="showMenu.set(false)"
                   style="display:flex;align-items:center;gap:.625rem;padding:.5rem 1rem;font-size:.8rem;color:#8aaae0;text-decoration:none;transition:background .15s">
                  <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 256 256" fill="currentColor"><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8Z"/></svg>
                  Mi Perfil
                </a>
                <button (click)="logout()"
                        style="width:100%;display:flex;align-items:center;gap:.625rem;padding:.5rem 1rem;font-size:.8rem;color:#f87171;background:none;border:none;cursor:pointer;text-align:left;transition:background .15s">
                  <svg xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px" viewBox="0 0 256 256" fill="currentColor"><path d="M120,216a8,8,0,0,1-8,8H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32h64a8,8,0,0,1,0,16H48V208h64A8,8,0,0,1,120,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L204.69,120H112a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,229.66,122.34Z"/></svg>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile bottom nav -->
        <div style="display:flex;justify-content:space-around;border-top:1px solid rgba(22,45,88,0.5);padding:.5rem 0" class="mobile-nav">
          <a *ngFor="let item of navItems" [routerLink]="item.route" routerLinkActive="mobile-nav-active"
             style="display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.375rem .75rem;border-radius:.5rem;font-size:.65rem;font-weight:500;color:#5580d0;text-decoration:none;transition:all .15s">
            <span [innerHTML]="item.icon" style="width:18px;height:18px;display:flex"></span>
            {{ item.label }}
          </a>
        </div>
      </header>

      <!-- Page content -->
      <main style="flex:1;padding:1.5rem;max-width:1400px;margin:0 auto;width:100%">
        <div class="animate-enter">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Footer -->
      <footer style="border-top:1px solid rgba(22,45,88,0.4);padding:1rem 1.5rem;text-align:center">
        <p style="font-size:.75rem;color:#2452a0">Portal del Pasajero &mdash; Tu viaje, nuestro compromiso</p>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @media (min-width: 768px) {
      .md-nav { display: block !important; }
      .mobile-nav { display: none !important; }
      .name-show { display: inline !important; }
      .tier-badge-show { display: inline !important; }
    }
    a[routerLinkActive].client-nav-active { color: #c9a84c !important; background: rgba(201,168,76,0.08) !important; }
    a[routerLinkActive].mobile-nav-active { color: #c9a84c !important; }
  `],
})
export class ClientShellComponent {
  showMenu = signal(false);

  constructor(private auth: AuthService) {}

  get user() { return this.auth.currentUser(); }
  get passenger() { return (this.user as any)?.passenger; }
  get initials() {
    const u = this.user;
    return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '?';
  }

  get tierBg() {
    const map: Record<string, string> = { PLATINUM: 'rgba(139,92,246,0.15)', GOLD: 'rgba(201,168,76,0.15)', SILVER: 'rgba(148,163,184,0.15)', STANDARD: 'rgba(71,85,105,0.15)' };
    return map[this.passenger?.tier] || map['STANDARD'];
  }
  get tierColor() {
    const map: Record<string, string> = { PLATINUM: '#a78bfa', GOLD: '#c9a84c', SILVER: '#94a3b8', STANDARD: '#64748b' };
    return map[this.passenger?.tier] || map['STANDARD'];
  }
  get tierBorder() {
    return `1px solid ${this.tierColor}33`;
  }

  logout() { this.showMenu.set(false); this.auth.logout(); }

  navItems = [
    { label: 'Inicio', route: '/client/dashboard', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-96,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,200,136Zm0,64H152V152h48v48Z"/></svg>` },
    { label: 'Mis Vuelos', route: '/client/flights', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>` },
    { label: 'Reservas', route: '/client/reservations', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M227.19,104.48A16,16,0,0,0,240,88.81V64a16,16,0,0,0-16-16H32A16,16,0,0,0,16,64V88.81a16,16,0,0,0,12.81,15.67,24,24,0,0,1,0,47A16,16,0,0,0,16,167.19V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V167.19a16,16,0,0,0-12.81-15.67,24,24,0,0,1,0-47Z"/></svg>` },
    { label: 'Soporte', route: '/client/support', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Z"/></svg>` },
    { label: 'Mi Perfil', route: '/client/profile', icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8Z"/></svg>` },
  ];
}
