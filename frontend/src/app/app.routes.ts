import { Routes } from '@angular/router';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { staffGuard, clientGuard, changePasswordGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Portal selector (public landing) ──────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./features/auth/portal-selector/portal-selector.component').then(m => m.PortalSelectorComponent),
    canActivate: [noAuthGuard],
  },

  // ── Staff auth ─────────────────────────────────────────────────────────────
  {
    path: 'staff/login',
    loadComponent: () => import('./features/auth/staff-login/staff-login.component').then(m => m.StaffLoginComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: 'staff/change-password',
    loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [changePasswordGuard],
  },

  // ── Client auth ────────────────────────────────────────────────────────────
  {
    path: 'client/login',
    loadComponent: () => import('./features/auth/client-login/client-login.component').then(m => m.ClientLoginComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: 'client/register',
    loadComponent: () => import('./features/auth/client-register/client-register.component').then(m => m.ClientRegisterComponent),
    canActivate: [noAuthGuard],
  },

  // ── Client portal ──────────────────────────────────────────────────────────
  {
    path: 'client',
    loadComponent: () => import('./core/layout/client-shell/client-shell.component').then(m => m.ClientShellComponent),
    canActivate: [clientGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/client/client-dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent) },
      { path: 'reservations', loadComponent: () => import('./features/client/client-reservations/client-reservations.component').then(m => m.ClientReservationsComponent) },
      { path: 'flights', loadComponent: () => import('./features/client/client-flights/client-flights.component').then(m => m.ClientFlightsComponent) },
      { path: 'support', loadComponent: () => import('./features/client/client-support/client-support.component').then(m => m.ClientSupportComponent) },
      { path: 'profile', loadComponent: () => import('./features/client/client-profile/client-profile.component').then(m => m.ClientProfileComponent) },
    ],
  },

  // ── Staff backoffice ───────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./core/layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [staffGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'passengers', loadComponent: () => import('./features/passengers/passengers-list/passengers-list.component').then(m => m.PassengersListComponent) },
      { path: 'passengers/new', loadComponent: () => import('./features/passengers/passenger-form/passenger-form.component').then(m => m.PassengerFormComponent) },
      { path: 'passengers/:id', loadComponent: () => import('./features/passengers/passenger-profile/passenger-profile.component').then(m => m.PassengerProfileComponent) },
      { path: 'passengers/:id/edit', loadComponent: () => import('./features/passengers/passenger-form/passenger-form.component').then(m => m.PassengerFormComponent) },
      { path: 'flights', loadComponent: () => import('./features/flights/flights-list/flights-list.component').then(m => m.FlightsListComponent) },
      { path: 'flights/new', loadComponent: () => import('./features/flights/flight-form/flight-form.component').then(m => m.FlightFormComponent) },
      { path: 'flights/board', loadComponent: () => import('./features/flights/departure-board/departure-board.component').then(m => m.DepartureBoardComponent) },
      { path: 'flights/:id', loadComponent: () => import('./features/flights/flight-detail/flight-detail.component').then(m => m.FlightDetailComponent) },
      { path: 'flights/:id/edit', loadComponent: () => import('./features/flights/flight-form/flight-form.component').then(m => m.FlightFormComponent) },
      { path: 'reservations', loadComponent: () => import('./features/reservations/reservations-list/reservations-list.component').then(m => m.ReservationsListComponent) },
      { path: 'reservations/new', loadComponent: () => import('./features/reservations/reservation-wizard/reservation-wizard.component').then(m => m.ReservationWizardComponent) },
      { path: 'reservations/:id', loadComponent: () => import('./features/reservations/reservation-detail/reservation-detail.component').then(m => m.ReservationDetailComponent) },
      { path: 'support', loadComponent: () => import('./features/support/support-inbox/support-inbox.component').then(m => m.SupportInboxComponent) },
      { path: 'admin', loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent) },
    ],
  },

  { path: '**', redirectTo: '' },
];
