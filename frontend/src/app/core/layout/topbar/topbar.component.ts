import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FlightsSocketService } from '../../services/flights-socket.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="h-16 bg-navy-900 border-b border-navy-800 flex items-center px-6 gap-4 flex-shrink-0">
      <!-- Menu toggle -->
      <button (click)="toggleSidebar.emit()" class="btn-icon flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
          <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/>
        </svg>
      </button>

      <!-- Spacer -->
      <div class="flex-1"></div>

      <!-- WS status -->
      <div class="flex items-center gap-2 text-xs" [title]="wsConnected ? 'Actualizaciones en vivo' : 'Conectando...'">
        <span class="w-2 h-2 rounded-full" [class.bg-emerald-400]="wsConnected" [class.bg-amber-400]="!wsConnected" [class.animate-pulse]="!wsConnected"></span>
        <span class="text-navy-400 hidden sm:block">{{ wsConnected ? 'En vivo' : 'Conectando...' }}</span>
      </div>

      <!-- User dropdown -->
      <div class="relative">
        <button (click)="showDropdown.set(!showDropdown())" class="flex items-center gap-2 hover:bg-navy-800 rounded-lg px-3 py-2 transition-colors">
          <div class="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-semibold text-sm">
            {{ userInitials }}
          </div>
          <span class="text-sm font-medium text-white hidden sm:block">{{ user?.firstName }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-navy-400" viewBox="0 0 256 256" fill="currentColor">
            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/>
          </svg>
        </button>

        <!-- Dropdown -->
        <div *ngIf="showDropdown()" class="absolute right-0 top-12 w-48 aero-card py-1 z-50 shadow-elevated">
          <div class="px-4 py-2 border-b border-navy-700">
            <p class="text-sm font-medium text-white">{{ user?.firstName }} {{ user?.lastName }}</p>
            <p class="text-xs text-navy-400">{{ user?.email }}</p>
          </div>
          <a routerLink="/admin" (click)="showDropdown.set(false)" class="flex items-center gap-2 px-4 py-2 text-sm text-navy-300 hover:bg-navy-700 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/></svg>
            Mi Perfil
          </a>
          <button (click)="logout()" class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-navy-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 256 256" fill="currentColor"><path d="M120,216a8,8,0,0,1-8,8H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32h64a8,8,0,0,1,0,16H48V208h64A8,8,0,0,1,120,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L204.69,120H112a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,229.66,122.34Z"/></svg>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  showDropdown = signal(false);

  constructor(private auth: AuthService, private socket: FlightsSocketService) {}

  get user() { return this.auth.currentUser(); }
  get userInitials() {
    const u = this.user;
    return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '?';
  }
  get wsConnected() { return this.socket.isConnected; }

  logout() {
    this.showDropdown.set(false);
    this.auth.logout();
  }
}
