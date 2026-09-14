import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { FlightsSocketService } from '../../services/flights-socket.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="flex h-screen overflow-hidden bg-navy-900">
      <!-- Sidebar -->
      <app-sidebar [collapsed]="sidebarCollapsed()" (toggleCollapse)="sidebarCollapsed.set(!sidebarCollapsed())" />

      <!-- Main content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <app-topbar [sidebarCollapsed]="sidebarCollapsed()" (toggleSidebar)="sidebarCollapsed.set(!sidebarCollapsed())" />
        <main class="flex-1 overflow-y-auto p-6">
          <div class="animate-enter">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  sidebarCollapsed = signal(false);

  constructor(private socket: FlightsSocketService) {}

  ngOnInit() {
    this.socket.connect();
  }
}
