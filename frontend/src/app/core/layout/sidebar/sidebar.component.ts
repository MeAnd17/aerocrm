import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  permission?: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside
      class="flex flex-col h-full bg-navy-950 border-r border-navy-800 transition-all duration-300 ease-in-out"
      [class.w-64]="!collapsed"
      [class.w-16]="collapsed"
    >
      <!-- Logo -->
      <div class="flex items-center h-16 px-4 border-b border-navy-800 flex-shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 flex-shrink-0 bg-gold-500/10 border border-gold-500/30 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gold-400" viewBox="0 0 256 256" fill="currentColor">
              <path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84ZM224,144.6l-30.58-6.46A8,8,0,0,0,184,146v30H72V146a8,8,0,0,0-9.42-7.86L32,144.6V138l36-20.84A8,8,0,0,0,72,110V80H184v30a8,8,0,0,0,4,6.93l36,20.84Z"/>
            </svg>
          </div>
          <span *ngIf="!collapsed" class="font-bold text-lg text-white tracking-wide">
            <span class="text-gold-400">Aero</span>CRM
          </span>
        </div>
      </div>

      <!-- Nav items -->
      <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <ng-container *ngFor="let item of visibleNavItems">
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-item"
            [title]="collapsed ? item.label : ''"
          >
            <span class="flex-shrink-0 w-5 h-5" [innerHTML]="getIcon(item.icon)"></span>
            <span *ngIf="!collapsed" class="flex-1 truncate">{{ item.label }}</span>
            <span *ngIf="!collapsed && item.badge" class="ml-auto badge badge-red text-xs">{{ item.badge }}</span>
          </a>
        </ng-container>
      </nav>

      <!-- User section -->
      <div class="border-t border-navy-800 p-3 flex-shrink-0">
        <div class="flex items-center gap-3 px-1">
          <div class="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/30 flex-shrink-0 flex items-center justify-center text-gold-400 font-semibold text-sm">
            {{ userInitials }}
          </div>
          <div *ngIf="!collapsed" class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ user?.firstName }} {{ user?.lastName }}</p>
            <p class="text-xs text-navy-400 truncate">{{ user?.roles?.[0] }}</p>
          </div>
        </div>
      </div>

      <!-- Collapse toggle -->
      <button
        (click)="toggleCollapse.emit()"
        class="absolute -right-3 top-20 w-6 h-6 bg-navy-700 border border-navy-600 rounded-full flex items-center justify-center hover:bg-navy-600 transition-colors z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-navy-300 transition-transform" [class.rotate-180]="collapsed" viewBox="0 0 256 256" fill="currentColor">
          <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/>
        </svg>
      </button>
    </aside>
  `,
  styles: [`
    :host { position: relative; display: block; }
  `]
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  constructor(private auth: AuthService) {}

  get user() { return this.auth.currentUser(); }
  get userInitials() {
    const u = this.user;
    return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '?';
  }

  private navItems: NavItem[] = [
    { label: 'Panel Principal', route: '/dashboard', icon: 'squares-four', permission: 'dashboard:read' },
    { label: 'Pasajeros', route: '/passengers', icon: 'users', permission: 'passengers:read' },
    { label: 'Vuelos', route: '/flights', icon: 'airplane', permission: 'flights:read' },
    { label: 'Reservas', route: '/reservations', icon: 'ticket', permission: 'reservations:read' },
    { label: 'Soporte', route: '/support', icon: 'chat-circle-text', permission: 'support:read' },
    { label: 'Administración', route: '/admin', icon: 'gear', permission: 'admin:read' },
  ];

  get visibleNavItems() {
    return this.navItems.filter(item => !item.permission || this.auth.hasPermission(item.permission));
  }

  getIcon(name: string): string {
    const icons: Record<string, string> = {
      'squares-four': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-96,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,200,136Zm0,64H152V152h48v48Z"/></svg>`,
      'users': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.43a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.51A8,8,0,0,1,250.14,206.7Z"/></svg>`,
      'airplane': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84ZM224,144.6l-30.58-6.46A8,8,0,0,0,184,146v30H72V146a8,8,0,0,0-9.42-7.86L32,144.6V138l36-20.84A8,8,0,0,0,72,110V80H184v30a8,8,0,0,0,4,6.93l36,20.84Z"/></svg>`,
      'ticket': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M227.19,104.48A16,16,0,0,0,240,88.81V64a16,16,0,0,0-16-16H32A16,16,0,0,0,16,64V88.81a16,16,0,0,0,12.81,15.67,24,24,0,0,1,0,47A16,16,0,0,0,16,167.19V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V167.19a16,16,0,0,0-12.81-15.67,24,24,0,0,1,0-47ZM32,167.19a40,40,0,0,0,0-78.38V64H92v128H32Zm192,0V192H108V64H224V88.81a40,40,0,0,0,0,78.38Z"/></svg>`,
      'chat-circle-text': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a88.21,88.21,0,0,1-45.06-12.38,8,8,0,0,0-6.51-.9L40,216l13.28-36.51a8,8,0,0,0-.9-6.51A88,88,0,1,1,128,216ZM80,128a8,8,0,1,1,8,8A8,8,0,0,1,80,128Zm40,0a8,8,0,1,1,8,8A8,8,0,0,1,120,128Zm40,0a8,8,0,1,1,8,8A8,8,0,0,1,160,128Z"/></svg>`,
      'gear': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.9,123.66Z"/></svg>`,
    };
    return icons[name] || icons['airplane'];
  }
}
